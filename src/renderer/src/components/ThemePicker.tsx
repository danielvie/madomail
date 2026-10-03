import { useState } from 'react'

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
export function applyTheme(id: string): void {
  document.documentElement.dataset.theme = id
}
export default function ThemePicker({
  current,
  onChange
}: {
  current: string
  onChange: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const pick = (id: string) => {
    applyTheme(id)
    onChange(id)
  }
  const selected = THEMES.find((theme) => theme.id === current)
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={`flex items-center gap-1 rounded px-1.5 py-1 font-mono text-[10px] text-ink-dim hover:bg-panel2 hover:text-ink ${expanded ? 'border border-line' : ''}`}
        aria-expanded={expanded}
        aria-controls="theme-options"
        title={`${expanded ? 'Hide' : 'Show'} theme options`}
        onClick={() => setExpanded((open) => !open)}
      >
        <span className="tracking-widest">THEME</span>
        <span className="tracking-normal text-ink">{selected?.name ?? current}</span>
        <span aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <select
          id="theme-options"
          className="rounded border border-line bg-panel px-1.5 py-1 font-mono text-[10px] text-ink outline-none"
          value={current}
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
      )}
    </div>
  )
}
