import { useEffect, useState } from 'react'

export const THEMES = [
  { id: 'slate', name: 'Slate', mode: 'dark', note: 'cool neutral, blue accent' },
  { id: 'carbon', name: 'Carbon', mode: 'dark', note: 'monochrome, red only for delete' },
  { id: 'ink', name: 'Ink', mode: 'dark', note: 'navy, amber accent' },
  { id: 'moss', name: 'Moss', mode: 'dark', note: 'warm dark, sage accent' },
  { id: 'plum', name: 'Plum', mode: 'dark', note: 'aubergine, violet accent' },
  { id: 'paper', name: 'Paper', mode: 'light', note: 'warm white, deep blue' },
  { id: 'bone', name: 'Bone', mode: 'light', note: 'cream, forest green' },
  { id: 'frost', name: 'Frost', mode: 'light', note: 'cool white, indigo' },
  { id: 'linen', name: 'Linen', mode: 'light', note: 'beige, teal' },
  { id: 'swiss', name: 'Swiss', mode: 'light', note: 'monochrome, red only for delete' }
] as const
export type ThemeId = (typeof THEMES)[number]['id']
export const DEFAULT_THEME: ThemeId = 'ink'
export function applyTheme(id: string): void {
  document.documentElement.dataset.theme = id
  try {
    localStorage.setItem('theme', id)
  } catch {
    /* private mode */
  }
}
export function loadTheme(): string {
  let id: string = DEFAULT_THEME
  try {
    id = localStorage.getItem('theme') ?? DEFAULT_THEME
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = id
  return id
}
export default function ThemePicker({
  current,
  onChange
}: {
  current?: string
  onChange?: (id: string) => void
}) {
  const [value, setValue] = useState<string>(current ?? DEFAULT_THEME)
  useEffect(() => {
    if (current !== undefined) setValue(current)
  }, [current])
  const pick = (id: string) => {
    setValue(id)
    applyTheme(id)
    onChange?.(id)
  }
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[10px] tracking-widest text-ink-dim">THEME</span>
      <select
        className="rounded border border-line bg-panel px-1.5 py-1 font-mono text-[10px] text-ink outline-none"
        value={value}
        onChange={(e) => pick(e.target.value)}
      >
        <optgroup label="Dark">
          {THEMES.filter((t) => t.mode === 'dark').map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.note}
            </option>
          ))}
        </optgroup>
        <optgroup label="Light">
          {THEMES.filter((t) => t.mode === 'light').map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.note}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  )
}
