import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DEFAULT_SETTINGS, validateSettingsPatch, type AppSettings } from '../shared/settings'

// Small synchronous writes serialize IPC updates and finish before the window can close.
export class SettingsStore {
  private document: Record<string, unknown> | null = null
  readonly path: string

  constructor(path: string) {
    this.path = path
  }

  load(legacy: unknown = {}): AppSettings {
    if (this.document) return this.snapshot()
    let text: string
    try {
      text = readFileSync(this.path, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      const initial = { ...structuredClone(DEFAULT_SETTINGS), ...validateSettingsPatch(legacy) }
      this.write(initial)
      return this.snapshot()
    }
    // Never replace an unreadable or malformed settings file with defaults.
    try {
      const parsed: unknown = JSON.parse(text)
      const known = validateSettingsPatch(parsed)
      this.document = {
        ...(parsed as Record<string, unknown>),
        ...structuredClone(DEFAULT_SETTINGS),
        ...known
      }
      return this.snapshot()
    } catch (error) {
      throw new Error(`Unable to load ${this.path}: ${(error as Error).message}`)
    }
  }

  update(patch: unknown): AppSettings {
    const valid = validateSettingsPatch(patch)
    this.load()
    this.write({ ...this.document, ...valid })
    return this.snapshot()
  }

  private snapshot(): AppSettings {
    return structuredClone(validateSettingsPatch(this.document) as AppSettings)
  }

  private write(next: Record<string, unknown>): void {
    mkdirSync(dirname(this.path), { recursive: true })
    const temporary = `${this.path}.${process.pid}.tmp`
    try {
      writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 })
      renameSync(temporary, this.path)
      this.document = next
    } finally {
      rmSync(temporary, { force: true })
    }
  }
}
