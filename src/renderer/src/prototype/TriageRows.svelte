<script lang="ts">
  // PROTOTYPE — list for variants 21 and 22.
  // Same sender bands as TriageList, but selection is driven by the three-button model
  // in selection.ts. The checkbox stays as the state *display* (that is what made
  // unselecting legible in round three) while the row body is the click target.
  import type { EmailMsg, MarkAction } from '../types'
  import { ws } from './store.svelte'
  import { senderAddr, senderName } from './fixtures'
  import { flood, range, rowSelected, single, type Row } from './selection'

  type Band = { key: string; from: string; msgs: EmailMsg[] }
  type VRow = Row & { band: Band; msg?: EmailMsg; header: boolean }

  const bands = $derived.by(() => {
    const by = new Map<string, Band>()
    for (const m of ws.filtered) {
      if (ws.marks[m.id]) continue
      const key = senderAddr(m.from)
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()].sort(
      (a, b) => b.msgs.length - a.msgs.length || a.key.localeCompare(b.key)
    )
  })

  let open = $state<Set<string>>(new Set())
  let anchor = $state<string | null>(null)
  let hint = $state('')

  /**
   * The visible rows, in order, as the selection model sees them. An expanded band
   * contributes a non-selectable header plus one row per message; a collapsed band is
   * a single row covering all of its messages.
   */
  const vrows = $derived.by(() => {
    const out: VRow[] = []
    for (const b of bands) {
      const expanded = b.msgs.length > 1 && open.has(b.key)
      if (expanded) {
        out.push({ key: 'h:' + b.key, ids: [], band: b, header: true })
        for (const m of b.msgs) out.push({ key: 'm:' + m.id, ids: [m.id], band: b, msg: m, header: false })
      } else {
        out.push({ key: 'b:' + b.key, ids: b.msgs.map((m) => m.id), band: b, header: false })
      }
    }
    return out
  })

  /** Indices the selection model may touch — headers are skipped. */
  const pickable = $derived(vrows.filter((r) => !r.header))
  const idxOf = (key: string): number => pickable.findIndex((r) => r.key === key)
  const sel = $derived(ws.selection)

  function say(msg: string): void {
    hint = msg
    setTimeout(() => (hint = ''), 1600)
  }

  function onLeft(key: string): void {
    const i = idxOf(key)
    if (i < 0) return
    ws.selection = single(pickable, i, sel)
    anchor = key
    say(rowSelected(pickable[i], ws.selection) ? 'selected' : 'unselected')
  }

  function onRight(e: MouseEvent, key: string): void {
    e.preventDefault()
    const i = idxOf(key)
    if (i < 0) return
    const a = anchor ? idxOf(anchor) : -1
    const before = sel.size
    ws.selection = range(pickable, a, i, sel)
    anchor = key
    say(a < 0 ? 'selected (no anchor yet)' : '+' + (ws.selection.size - before) + ' in range')
  }

  function onMiddle(e: MouseEvent, key: string): void {
    if (e.button !== 1) return
    e.preventDefault()
    const i = idxOf(key)
    if (i < 0) return
    const was = rowSelected(pickable[i], sel)
    const before = sel.size
    ws.selection = flood(pickable, i, sel)
    anchor = key
    const n = Math.abs(ws.selection.size - before)
    say(was ? 'cleared run of ' + n : 'filled run of ' + n)
  }

  function toggleBand(k: string): void {
    const next = new Set(open)
    next.has(k) ? next.delete(k) : next.add(k)
    open = next
  }

  const scope = (list: string[]): string[] =>
    sel.size && list.some((id) => sel.has(id)) ? [...sel] : list

  function always(from: string, action: MarkAction): void {
    ws.addRule(from, action)
    const key = senderAddr(from)
    ws.mark(
      ws.inbox.filter((m) => senderAddr(m.from) === key && !ws.marks[m.id]).map((m) => m.id),
      action,
      true
    )
  }
</script>

{#snippet box(on: boolean, partial: boolean)}
  <span
    class="grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] leading-none {on
      ? 'border-brand bg-brand text-black'
      : partial
        ? 'border-brand text-brand'
        : 'border-white/25 text-transparent'}"
  >
    {on ? '✓' : partial ? '–' : '·'}
  </span>
{/snippet}

{#snippet actions(list: string[], from: string, withAlways: boolean)}
  <span
    class="flex w-[24ch] shrink-0 items-center justify-end gap-1 opacity-0 group-hover:opacity-100"
  >
    <button
      class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
      title="Archive {list.length}"
      onclick={(e) => { e.stopPropagation(); ws.mark(scope(list), 'archive') }}>A</button
    >
    <button
      class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
      title="Delete {list.length}"
      onclick={(e) => { e.stopPropagation(); ws.mark(scope(list), 'trash') }}>D</button
    >
    {#if withAlways}
      <span class="mx-0.5 text-accent-dim">|</span>
      <button
        class="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
        title="Always archive {senderAddr(from)}"
        onclick={(e) => { e.stopPropagation(); always(from, 'archive') }}>ALWAYS A</button
      >
      <button
        class="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
        title="Always delete {senderAddr(from)}"
        onclick={(e) => { e.stopPropagation(); always(from, 'trash') }}>ALWAYS D</button
      >
    {/if}
  </span>
{/snippet}

<div class="flex h-full min-h-0 flex-col">
  <div class="flex items-center gap-2 px-3 py-2">
    <input
      class="w-52 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
      placeholder="Filter..."
      bind:value={ws.search}
    />
    <button
      class="rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[10px] hover:bg-surface-hover"
      onclick={() => ws.runQuery()}>RUN QUERY</button
    >
    <span class="font-mono text-[11px] text-accent-dim">
      {bands.length} senders · {bands.reduce((n, b) => n + b.msgs.length, 0)} undecided
    </span>
    {#if sel.size}
      <span class="ml-auto flex items-center gap-2">
        <span class="font-mono text-[11px] text-brand">{sel.size} selected</span>
        <button
          class="rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-black"
          onclick={() => ws.mark([...sel], 'archive')}>ARCHIVE</button
        >
        <button
          class="rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-danger"
          onclick={() => ws.mark([...sel], 'trash')}>DELETE</button
        >
        <button
          class="font-mono text-[10px] text-accent-dim hover:text-accent"
          onclick={() => (ws.selection = new Set())}>clear</button
        >
      </span>
    {/if}
  </div>

  <div
    class="flex items-center gap-3 border-y border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim"
  >
    <span class="w-4 shrink-0"></span>
    <span class="w-4 shrink-0"></span>
    <span class="w-[24ch] shrink-0">FROM</span>
    <span class="min-w-0 flex-1">SUBJECT</span>
    <span class="w-[17ch] shrink-0 whitespace-nowrap text-right">DATE</span>
    <span class="w-[24ch] shrink-0 text-right">THIS / ALWAYS</span>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto select-none">
    {#each vrows as r (r.key)}
      {#if r.header}
        <!-- expanded band header: not selectable, still actionable -->
        <div
          class="group flex items-center gap-3 border-b border-white/5 border-l-2 border-l-transparent bg-surface/60 pr-3 text-sm"
        >
          <span class="w-4 shrink-0 pl-3"></span>
          <button
            class="w-4 shrink-0 font-mono text-[10px] text-accent-dim"
            onclick={() => toggleBand(r.band.key)}>▾</button
          >
          <span class="w-[24ch] shrink-0 truncate py-2 font-semibold">
            {senderName(r.band.from)}
            <span class="ml-1 rounded bg-surface-active px-1.5 font-mono text-[10px]"
              >{r.band.msgs.length}</span
            >
          </span>
          <span class="min-w-0 flex-1 truncate text-accent-dim">expanded — pick messages below</span>
          <span class="w-[17ch] shrink-0"></span>
          {@render actions(r.band.msgs.map((m) => m.id), r.band.from, true)}
        </div>
      {:else}
        {@const on = rowSelected(r, sel)}
        {@const some = !on && r.ids.some((id) => sel.has(id))}
        {@const multi = !r.msg && r.band.msgs.length > 1}
        {@const rule = ws.ruleFor(r.band.from)}
        <div
          class="group flex items-center gap-3 border-b border-white/5 border-l-2 pr-3 text-sm {on ||
          some
            ? 'border-l-brand bg-brand/10'
            : 'border-l-transparent hover:bg-surface'} {multi ? 'bg-surface/40' : ''} {r.msg
            ? 'bg-black/25'
            : ''}"
          role="row"
          tabindex="-1"
          onclick={() => onLeft(r.key)}
          oncontextmenu={(e) => onRight(e, r.key)}
          onmousedown={(e) => e.button === 1 && e.preventDefault()}
          onauxclick={(e) => onMiddle(e, r.key)}
        >
          <span class="pl-3">{@render box(on, some)}</span>
          <button
            class="w-4 shrink-0 font-mono text-[10px] text-accent-dim"
            onclick={(e) => {
              e.stopPropagation()
              if (multi) toggleBand(r.band.key)
            }}
          >
            {multi ? '▸' : ''}
          </button>
          <span class="w-[24ch] shrink-0 truncate py-2 font-semibold">
            {#if r.msg}
              <span class="text-accent-dim">·</span>
            {:else}
              {senderName(r.band.from)}
              {#if multi}<span class="ml-1 rounded bg-surface-active px-1.5 font-mono text-[10px]"
                  >{r.band.msgs.length}</span
                >{/if}
              {#if rule}<span
                  class="ml-1 font-mono text-[9px]"
                  style="color:{rule.action === 'archive' ? '#d6ff00' : '#ff3333'}">RULE</span
                >{/if}
            {/if}
          </span>
          <span class="min-w-0 flex-1 truncate {multi ? 'text-accent-dim' : ''}">
            {r.msg
              ? r.msg.subject
              : multi
                ? r.band.msgs.length + ' messages — ' + r.band.msgs[0].subject
                : r.band.msgs[0].subject}
          </span>
          <span
            class="w-[17ch] shrink-0 whitespace-nowrap text-right font-mono text-[10px] text-accent-dim"
            >{(r.msg ?? r.band.msgs[0]).date}</span
          >
          {@render actions(r.ids, r.band.from, !r.msg)}
        </div>
      {/if}
    {:else}
      <div class="px-3 py-16 text-center text-sm text-accent-dim">
        Nothing left undecided in the Inbox.
      </div>
    {/each}
  </div>

  <div
    class="flex items-center gap-4 border-t border-white/5 px-3 py-1.5 font-mono text-[10px] text-accent-dim"
  >
    <span><b class="text-accent">left</b> select</span>
    <span><b class="text-accent">right</b> range from last click</span>
    <span><b class="text-accent">middle</b> fill / clear the run</span>
    {#if hint}<span class="ml-auto text-brand">{hint}</span>{/if}
  </div>
</div>
