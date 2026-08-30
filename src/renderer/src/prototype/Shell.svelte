<script lang="ts">
  // PROTOTYPE — throwaway variant switcher.
  import { ws } from './store.svelte'
  import ThemePicker, { loadTheme } from '../components/ThemePicker.svelte'
  import V01 from './variants/V01SenderStacks.svelte'
  import V02 from './variants/V02CardDeck.svelte'
  import V03 from './variants/V03Commander.svelte'
  import V04 from './variants/V04Digest.svelte'
  import V05 from './variants/V05Palette.svelte'
  import V06 from './variants/V06Board.svelte'
  import V07 from './variants/V07ThreePane.svelte'
  import V08 from './variants/V08Terminal.svelte'
  import V09 from './variants/V09RuleCockpit.svelte'
  import V10 from './variants/V10FocusQueue.svelte'
  import V11 from './variants/V11TriageDesk.svelte'
  import V12 from './variants/V12SweepTable.svelte'
  import V13 from './variants/V13RuleRail.svelte'
  import V14 from './variants/V14ByExample.svelte'
  import V15 from './variants/V15MarkedTable.svelte'
  import V16 from './variants/V16BinDrawer.svelte'
  import V17 from './variants/V17OperationLog.svelte'
  import V18 from './variants/V18BeforeAfter.svelte'
  import V19 from './variants/V19ReviewSheet.svelte'
  import V20 from './variants/V20Conveyor.svelte'
  import V21 from './variants/V21Bins.svelte'
  import V22 from './variants/V22Ledger.svelte'
  import V23 from './variants/V23Combined.svelte'

  // `score` is the user's grade from round one; round-two variants carry their lineage.
  const variants = [
    { n: 1, name: 'Sender Stacks', idea: 'Group by sender; triage a whole sender in one move.', score: 2, c: V01 },
    { n: 2, name: 'Card Deck', idea: 'One message at a time, keyboard-driven, with undo.', score: 1, c: V02 },
    { n: 3, name: 'Commander', idea: 'Two panes: Inbox left, staged marks right.', score: 8, c: V03 },
    { n: 4, name: 'Digest', idea: 'Grouped by day, noise collapsed behind a summary line.', score: 6, c: V04 },
    { n: 5, name: 'Palette', idea: 'Empty canvas; everything through a command palette.', score: 4, c: V05 },
    { n: 6, name: 'Board', idea: 'Kanban columns — Inbox / Archive / Delete.', score: 6, c: V06 },
    { n: 7, name: 'Three Pane', idea: 'Sender sidebar, list, persistent reading pane.', score: 7, c: V07 },
    { n: 8, name: 'Terminal', idea: 'Monospace TUI, vim keys, status line.', score: 4, c: V08 },
    { n: 9, name: 'Rule Cockpit', idea: 'Rules are the object; Inbox is their dry-run diff.', score: 7, c: V09 },
    { n: 10, name: 'Focus Queue', idea: 'A timed triage session in batches of five.', score: 3, c: V10 },
    { n: 11, name: 'Triage Desk', idea: '3+7: Inbox | Reader | Staged, bulk select, no context switch.', score: 7, c: V11 },
    { n: 12, name: 'Sweep Table', idea: 'Retry of 1 as a dense table: sender bands + docked tray.', score: 8, c: V12 },
    { n: 13, name: 'Rule Rail', idea: '9 at table density: rules rail, residue list, one-click "always".', score: 6, c: V13 },
    { n: 14, name: 'By Example', idea: 'Touch one row, get the whole batch it belongs to.', score: 4, c: V14 },
    { n: 15, name: 'Marked Table', idea: "Today's table, fixed: marks stay put, ranges, ledger footer.", score: 4, c: V15 },
    { n: 16, name: 'Bin Drawer', idea: 'Staging as two named bins, always on screen, grouped by sender.', score: 9, c: V16 },
    { n: 17, name: 'Operation Log', idea: 'Stage moves, not messages. Too much space for the information.', score: 8, c: V17 },
    { n: 18, name: 'Before / After', idea: 'Stage as outcome. A bit polluted.', score: 7, c: V18 },
    { n: 19, name: 'Review Sheet', idea: 'One counter while working; full-screen review before Gmail.', score: 5, c: V19 },
    { n: 20, name: 'Conveyor', idea: 'Narrow rail of tinted tiles. Good space, says too little.', score: 8, c: V20 },
    { n: 21, name: 'Bins ✦', idea: 'FINALIST — 16 kept, with left/right/middle-click selection.', score: 0, c: V21 },
    { n: 22, name: 'Ledger ✦', idea: '17+20: narrow column, every line carries shape+name+count.', score: 0, c: V22 },
    { n: 23, name: 'PROMOTED ★', idea: 'The chosen layout — now the real app components.', score: 0, c: V23 }
  ]

  const initial = (): number => {
    const v = Number(new URLSearchParams(location.search).get('v'))
    return v >= 1 && v <= variants.length ? v : 23
  }

  let current = $state(initial())
  let barOpen = $state(true)
  let theme = $state(loadTheme())

  const active = $derived(variants[current - 1])

  function go(n: number): void {
    current = n
    ws.reset()
    const url = new URL(location.href)
    url.searchParams.set('v', String(n))
    history.replaceState(null, '', url)
  }

  function onKey(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.altKey && e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      go(e.key === '0' ? 10 : Number(e.key))
    } else if (e.key === '[') go(current === 1 ? variants.length : current - 1)
    else if (e.key === ']') go(current === variants.length ? 1 : current + 1)
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
  <!-- pb-12 keeps every variant's own footer clear of the floating variant bar -->
  <div class="min-h-0 flex-1 overflow-hidden pb-12">
    {#key current}
      <active.c />
    {/key}
  </div>

  <!-- floating variant bar -->
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center pb-3">
    <div
      class="pointer-events-auto flex max-w-[95vw] flex-wrap items-center justify-center gap-1 rounded-2xl border border-line bg-panel px-2 py-1.5 shadow-2xl"
    >
      {#if barOpen}
        {#each variants as v (v.n)}
          <button
            class="relative rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors {current ===
            v.n
              ? 'bg-brand text-on-brand'
              : v.score === 0
                ? 'text-ink hover:bg-panel2'
                : 'text-ink-dim hover:bg-panel2 hover:text-ink'}"
            title="{v.name} — {v.idea}{v.score ? '  (graded ' + v.score + '/10)' : '  (new)'}"
            onclick={() => go(v.n)}
          >
            {v.n}
            {#if v.score === 0 && current !== v.n}
              <span class="absolute -right-0 -top-0 size-1.5 rounded-full bg-brand"></span>
            {/if}
          </button>
        {/each}
        <span class="mx-2 hidden max-w-[40ch] truncate text-[11px] text-ink-dim sm:inline">
          <b class="text-ink">{active.name}</b>
          {#if active.score}<span class="text-brand">{active.score}/10</span>{/if} — {active.idea}
        </span>
      {/if}
      <ThemePicker bind:current={theme} />
      <button
        class="rounded-full px-2 py-1 font-mono text-[11px] text-ink-dim hover:text-ink"
        onclick={() => (barOpen = !barOpen)}
      >
        {barOpen ? 'hide' : 'variants'}
      </button>
    </div>
  </div>
</div>
