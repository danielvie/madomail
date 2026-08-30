<script module lang="ts">
  // Sets data-theme on <html>; theme.css does the rest. Choice is remembered locally.
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

  /** Matches the palette on `:root` in theme.css. */
  export const DEFAULT_THEME: ThemeId = 'ink'

  export function applyTheme(id: string): void {
    document.documentElement.dataset.theme = id
    try {
      localStorage.setItem('theme', id)
    } catch {
      /* private mode — the theme just will not persist */
    }
  }

  export function loadTheme(): string {
    let id = DEFAULT_THEME
    try {
      id = localStorage.getItem('theme') ?? DEFAULT_THEME
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.theme = id
    return id
  }
</script>

<script lang="ts">
  let { current = $bindable(DEFAULT_THEME as string) }: { current?: string } = $props()

  function pick(id: string): void {
    current = id
    applyTheme(id)
  }
</script>

<div class="flex items-center gap-1">
  <span class="font-mono text-[10px] tracking-widest text-ink-dim">THEME</span>
  <select
    class="rounded border border-line bg-panel px-1.5 py-1 font-mono text-[10px] text-ink outline-none"
    value={current}
    onchange={(e) => pick((e.currentTarget as HTMLSelectElement).value)}
  >
    <optgroup label="Dark">
      {#each THEMES.filter((t) => t.mode === 'dark') as t (t.id)}
        <option value={t.id}>{t.name} — {t.note}</option>
      {/each}
    </optgroup>
    <optgroup label="Light">
      {#each THEMES.filter((t) => t.mode === 'light') as t (t.id)}
        <option value={t.id}>{t.name} — {t.note}</option>
      {/each}
    </optgroup>
  </select>
</div>
