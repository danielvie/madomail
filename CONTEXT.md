# Code Context

## Files Retrieved
1. `src/renderer/src/main.ts` (1-11) — production Svelte mount and CSS entry.
2. `src/renderer/src/App.svelte` (1-20, remainder) — production coordinator and all UI imports; owns renderer state/effects/actions.
3. `src/renderer/src/components/*.svelte` — production components: `ErrorPanel`, `MarkedItemEditor`, `MarkedItemsView`, `StagingBins`, `ThemePicker`, `TriageRows`, `Versions` (the last appears not imported by App).
4. `src/renderer/src/prototype/main.ts` (1-6), `prototype/Shell.svelte` (1-100) — separate browser prototype entry/switcher.
5. `src/renderer/src/prototype/store.svelte.ts` (1-~170) — prototype Workspace shared state/actions.
6. `src/renderer/src/prototype/variants/V01SenderStacks.svelte` through `V23Combined.svelte` — 23 prototype variants, all selected dynamically by Shell.
7. `src/renderer/src/types.ts` (1-25) and `src/renderer/src/lib/{selection,sender}.ts` — shared domain types and pure selection/sender helpers.
8. `electron.vite.config.ts` (1-12), `svelte.config.mjs` (1-7) — Svelte Vite integration/config.
9. `package.json` (8-50), `pnpm-lock.yaml` — Svelte scripts and dependencies; lockfile migration required.
10. `eslint.config.mjs` (1-28), `.prettierrc.yaml`, `tsconfig.web.json`, `electron-builder.yml` — Svelte lint/format/typecheck/include/packaging references.
11. `src/renderer/src/assets/{base,main,theme}.css` — Tailwind v4 and semantic theme styling shared by app/prototype.
12. `src/preload/index.ts`, `src/preload/index.d.ts`, `src/main/{index,gmail}.ts` — unchanged Electron boundary/backend, but renderer React must retain IPC calls/types.

## Key Code
- `App.svelte` uses Svelte 5 runes: `$state` for `emails`, `loading`, `error`, `searchQuery`, `selectedIds`, `markedActions`, `markedItems`, `viewMode`, action/theme/editor/auth flags (lines 12-25); `$derived` for filtered undecided list/counts (roughly lines 42-60); `onMount` loads theme/settings/inbox (26-31); `$effect` persists `autoApply` and `markedItems` to localStorage (33-40).
- App passes callback props to focused components. Core operations are `fetchEmails`, `mark`/`unmark`, `always`, `executeActions`, `applyActionToIds`, `runMarkedItemsQuery`, and sender-rule CRUD. Gmail is invoked directly with `window.electron.ipcRenderer.invoke('gmail-fetch-inbox'|'gmail-archive'|'gmail-trash'|authorization channel)`.
- Production component responsibilities (documented in `docs/project-overview.md` lines 121-130): sender-banded list and three-button mouse selection (`TriageRows`), staging bins/apply (`StagingBins`), theme persistence/application (`ThemePicker`), marked-rule filtering (`MarkedItemsView`), rule editor dialog (`MarkedItemEditor`), Gmail error/auth code (`ErrorPanel`). `TriageRows` derives sender bands and expanded message rows and relies on `lib/selection` (top of file).
- Prototype `Workspace` is a singleton `export const ws = new Workspace()`. It uses Svelte rune fields for inbox/rules/marks/selection/autoApply/search/applied/ops; provides mark/unmark/undo, bulk apply, toggle, rule query/add/remove/reset, and derived filtering. `Op` records staged bulk action history (`id`, action, ids, label, viaRule). This is intentionally in-memory fixture state and not production persistence.
- Shell imports all 23 variants and chooses `active` from URL `?v=` (defaults to 23), resets `ws`, supports keyboard navigation, and renders dynamic `<active.c />`; React needs an explicit component map/render strategy.

## Architecture
Electron main/preload remain framework-neutral. `electron-vite` builds a renderer whose current entry mounts `App.svelte`; a second plain-Vite prototype entry mounts `Shell.svelte`. Both import the same CSS and renderer types/helpers, while production App talks across preload to Gmail IPC and prototype uses fixture singleton state. React migration should replace both mount paths, dynamic variant rendering, callback props, runes, Svelte event/window directives, and Svelte-specific component syntax while preserving IPC and CSS.

## Migration Inventory / Changes
- Replace `@sveltejs/vite-plugin-svelte` with React plugin (likely `@vitejs/plugin-react`), alter `electron.vite.config.ts`; remove `svelte.config.mjs` once unused.
- Replace `svelte` mount imports and `.svelte` entries with `react`/`react-dom` (`createRoot`); production `index.html` and prototype Vite config/HTML must point to TSX entries.
- Convert all production components plus 23 variants and Shell (and likely `Versions`) to `.tsx`; retain `types.ts`, `lib/*`, CSS, main/preload.
- Package scripts: remove `svelte-check`, Svelte Prettier plugin/config, and Svelte ESLint config/rules; add React typings/plugin and React lint setup. Update `typecheck` and TS includes from `.svelte` to TS/TSX. Update electron-builder exclusion of `svelte.config.mjs`; regenerate both lockfiles.
- `agentation-svelte` is Svelte-specific and must be removed/replaced if used (search indicates package/config dependency; inspect actual imports before deciding). README/docs/editor settings still describe Svelte and need update.

## Risks
- Svelte 5 rune reactivity and mutable `Set`/object patterns do not translate directly: React requires immutable updates, carefully memoized derived filtering, and effect dependency handling to avoid stale state or excessive localStorage writes.
- Svelte callback props, `$props`, keyed blocks, `<svelte:window onkeydown>`, dynamic `<active.c />`, transitions/conditional blocks, and event modifiers require semantic React equivalents. Preserve three-button selection, keyboard shortcuts, focus/dialog behavior, and expanded sender bands.
- Prototype and production have deliberately different state models (IPC-backed vs fixture singleton); do not accidentally merge them or persist prototype state. Variant 23 is promoted but all variants remain reachable via URL.
- IPC has weak typing (`@ts-ignore` in App) and Electron `window.electron` global declarations; React conversion is an opportunity to retain/strengthen declarations without breaking preload security boundary.
- Theme relies on `data-theme` on `<html>` and CSS custom properties; preserve initial theme flash behavior and shared Tailwind classes. Gmail async failures/loading and archive/trash semantics (including unread removal) need regression testing.

## Start Here
Open `src/renderer/src/App.svelte` first: it is the production state machine and defines the callback/data contracts every production component migration must preserve. Then migrate `src/renderer/src/main.ts` and `electron.vite.config.ts`, followed by components and the prototype Shell/store.
