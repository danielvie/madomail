export const THEME_IDS = [
  'slate',
  'carbon',
  'ink',
  'moss',
  'plum',
  'paper',
  'bone',
  'frost',
  'linen',
  'swiss'
] as const

export type AppSettings = {
  theme: string
  autoApply: boolean
  markedItems: { id: string; from: string; action: 'archive' | 'trash' }[]
  paneSizes: { inbox: number; list: number }
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'ink',
  autoApply: false,
  markedItems: [],
  paneSizes: { inbox: 75, list: 60 }
}

export type SettingsAPI = {
  load: (legacy?: Partial<AppSettings>) => Promise<AppSettings>
  update: (patch: Partial<AppSettings>) => Promise<AppSettings>
}

export function validateSettingsPatch(value: unknown): Partial<AppSettings> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Settings must be a JSON object')
  }
  const data = value as Record<string, unknown>
  const patch: Partial<AppSettings> = {}
  if ('theme' in data) {
    if (!THEME_IDS.some((id) => id === data.theme)) throw new Error('Unknown theme')
    patch.theme = data.theme as string
  }
  if ('autoApply' in data) {
    if (typeof data.autoApply !== 'boolean') throw new Error('autoApply must be a boolean')
    patch.autoApply = data.autoApply
  }
  if ('markedItems' in data) {
    if (
      !Array.isArray(data.markedItems) ||
      !data.markedItems.every(
        (item) =>
          item &&
          typeof item.id === 'string' &&
          typeof item.from === 'string' &&
          (item.action === 'archive' || item.action === 'trash')
      )
    )
      throw new Error('Invalid sender rules')
    patch.markedItems = data.markedItems.map(({ id, from, action }) => ({ id, from, action }))
  }
  if ('paneSizes' in data) {
    const sizes = data.paneSizes as AppSettings['paneSizes'] | null
    if (
      !sizes ||
      ![sizes.inbox, sizes.list].every(
        (size) => typeof size === 'number' && Number.isFinite(size) && size >= 10 && size <= 90
      )
    )
      throw new Error('Pane sizes must be percentages between 10 and 90')
    patch.paneSizes = { inbox: sizes.inbox, list: sizes.list }
  }
  return patch
}
