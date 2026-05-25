import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const SETTINGS_DIR = join(homedir(), '.mado', 'madomail')
const RECENT_FOLDERS_PATH = join(SETTINGS_DIR, 'recent-folders.json')
const MAX_RECENT_FOLDERS = 8

type RecentFoldersFile = {
  recentFolders: string[]
}

function normalizeFolderPath(value: string) {
  return value.replace(/\\/g, '/').trim()
}

function normalizeRecentFolders(values: string[]) {
  const unique = new Map<string, string>()

  for (const value of values) {
    const normalized = normalizeFolderPath(value)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (!unique.has(key)) unique.set(key, normalized)
  }

  return Array.from(unique.values())
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .slice(0, MAX_RECENT_FOLDERS)
}

export function loadRecentFolders() {
  if (!existsSync(RECENT_FOLDERS_PATH)) return []

  try {
    const content = readFileSync(RECENT_FOLDERS_PATH, 'utf8')
    const parsed = JSON.parse(content) as Partial<RecentFoldersFile>
    return normalizeRecentFolders(parsed.recentFolders ?? [])
  } catch (error) {
    console.error('Failed to read recent folders', error)
    return []
  }
}

export function saveRecentFolders(values: string[]) {
  const recentFolders = normalizeRecentFolders(values)

  if (!existsSync(SETTINGS_DIR)) {
    mkdirSync(SETTINGS_DIR, { recursive: true })
  }

  writeFileSync(RECENT_FOLDERS_PATH, JSON.stringify({ recentFolders }, null, 2))
  return recentFolders
}

export function mergeRecentFolders(values: string[], nextValue: string) {
  return saveRecentFolders([...values, nextValue])
}
