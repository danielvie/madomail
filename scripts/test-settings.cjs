/* eslint-disable @typescript-eslint/no-require-imports -- Node CJS test runner loads transpiled CJS modules. */
const { test, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

// Compile only the pure settings modules; no Electron or real user files are needed.
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mado-settings-test-'))
for (const name of ['shared/settings', 'main/settings-store']) {
  const source = fs.readFileSync(path.join(__dirname, '../src', `${name}.ts`), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText
  const destination = path.join(root, `${name}.js`)
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.writeFileSync(destination, output)
}
const { SettingsStore } = require(path.join(root, 'main/settings-store.js'))
const { DEFAULT_SETTINGS } = require(path.join(root, 'shared/settings.js'))
after(() => fs.rmSync(root, { recursive: true, force: true }))
const fileFor = (name) => path.join(root, name, 'settings.json')

test('creates a readable settings file with defaults', () => {
  const file = fileFor('defaults')
  assert.deepEqual(new SettingsStore(file).load(), DEFAULT_SETTINGS)
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), DEFAULT_SETTINGS)
})

test('migrates legacy preferences only when the file is missing', () => {
  const file = fileFor('migration')
  const legacy = {
    theme: 'frost',
    autoApply: true,
    markedItems: [{ id: 'rule1', from: 'example.test', action: 'archive' }]
  }
  const first = new SettingsStore(file).load(legacy)
  assert.equal(first.theme, 'frost')
  assert.equal(first.autoApply, true)
  assert.deepEqual(first.markedItems, legacy.markedItems)
  assert.deepEqual(new SettingsStore(file).load({ theme: 'paper' }), first)
})

test('theme, rules and pane sizes survive a restart and rapid partial updates', () => {
  const file = fileFor('restart')
  const store = new SettingsStore(file)
  store.load()
  store.update({ theme: 'frost' })
  store.update({ paneSizes: { inbox: 70, list: 55 } })
  store.update({ autoApply: true })
  store.update({ theme: 'ink' })
  const loaded = new SettingsStore(file).load()
  assert.deepEqual(loaded, {
    ...DEFAULT_SETTINGS,
    autoApply: true,
    paneSizes: { inbox: 70, list: 55 }
  })
  assert.deepEqual(fs.readdirSync(path.dirname(file)), ['settings.json'])
})

test('preserves unknown file keys when updating supported settings', () => {
  const file = fileFor('unknown')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify({ theme: 'paper', futureSetting: { enabled: true } }))
  new SettingsStore(file).update({ autoApply: true })
  assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')).futureSetting, { enabled: true })
})

test('rejects invalid settings without changing the saved file', () => {
  const file = fileFor('invalid')
  const store = new SettingsStore(file)
  store.load()
  const before = fs.readFileSync(file, 'utf8')
  for (const patch of [
    { theme: 'missing' },
    { autoApply: 'false' },
    { markedItems: [{}] },
    { paneSizes: { inbox: NaN, list: 50 } },
    { paneSizes: { inbox: 70, list: 0 } }
  ]) {
    assert.throws(() => store.update(patch))
    assert.equal(fs.readFileSync(file, 'utf8'), before)
  }
})

test('never overwrites malformed JSON, and can retry after repair', () => {
  const file = fileFor('malformed')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, '{broken')
  const store = new SettingsStore(file)
  assert.throws(() => store.load(), /Unable to load/)
  assert.throws(() => store.update({ theme: 'frost' }))
  assert.equal(fs.readFileSync(file, 'utf8'), '{broken')
  fs.writeFileSync(file, '{"theme":"frost"}')
  assert.equal(store.load().theme, 'frost')
})

test('failed writes do not update the in-memory settings', () => {
  const file = fileFor('write-failure')
  const store = new SettingsStore(file)
  store.load()
  fs.renameSync(file, `${file}.backup`)
  fs.mkdirSync(file)
  assert.throws(() => store.update({ theme: 'frost' }))
  assert.equal(store.load().theme, DEFAULT_SETTINGS.theme)
  fs.rmdirSync(file)
  fs.renameSync(`${file}.backup`, file)
  assert.equal(store.update({ theme: 'frost' }).theme, 'frost')
})
