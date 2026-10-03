import { validateSettingsPatch, type AppSettings } from '../../../shared/settings'

// Used only when settings.json does not exist. The file wins on subsequent starts.
export function readLegacySettings(): Partial<AppSettings> {
  const legacy: Partial<AppSettings> = {}
  for (const key of ['theme', 'autoApply', 'markedItems'] as const) {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) {
        Object.assign(
          legacy,
          validateSettingsPatch({ [key]: key === 'theme' ? value : JSON.parse(value) })
        )
      }
    } catch {
      // A damaged legacy entry must not prevent migration of the other preferences.
    }
  }
  return legacy
}
