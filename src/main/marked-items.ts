import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const SETTINGS_DIR = join(homedir(), '.mado', 'madomail')
const MARKED_ITEMS_PATH = join(SETTINGS_DIR, 'marked-items.json')

type MarkedItem = {
  id: string
  from: string
  folderPath: string
}

type MarkedItemsFile = {
  markedItems: MarkedItem[]
}

function normalizePath(value: string) {
  return value.replace(/\\/g, '/').trim()
}

function normalizeMarkedItems(values: MarkedItem[]) {
  return values
    .map((value) => ({
      id: String(value.id || '').trim(),
      from: String(value.from || '').trim(),
      folderPath: normalizePath(String(value.folderPath || ''))
    }))
    .filter((value) => value.id && value.from && value.folderPath)
}

export function loadMarkedItems() {
  if (!existsSync(MARKED_ITEMS_PATH)) return []

  const content = readFileSync(MARKED_ITEMS_PATH, 'utf8')
  const parsed = JSON.parse(content) as Partial<MarkedItemsFile>
  return normalizeMarkedItems(parsed.markedItems ?? [])
}

export function saveMarkedItems(values: MarkedItem[]) {
  const markedItems = normalizeMarkedItems(values)

  if (!existsSync(SETTINGS_DIR)) {
    mkdirSync(SETTINGS_DIR, { recursive: true })
  }

  writeFileSync(MARKED_ITEMS_PATH, JSON.stringify({ markedItems }, null, 2))
  return markedItems
}
