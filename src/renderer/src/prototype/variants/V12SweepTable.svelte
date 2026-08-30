<script lang="ts">
  // PROTOTYPE — Variant 12: Sweep Table. (retry of 1, which failed as a card grid)
  // Premise: the sender grouping was right, the cards were wrong. Same dense table you
  // have now, but consecutive mail from one sender collapses into a single band row
  // with a count and two buttons. Every band is one decision; the tray docks below.
  import type { EmailMsg } from '../../types'
  import { ws } from '../store.svelte'
  import { senderAddr, senderName } from '../fixtures'

  type Band = { key: string; from: string; msgs: EmailMsg[] }

  const bands = $derived.by(() => {
    const by = new Map<string, Band>()
    for (const m of ws.filtered) {
      if (ws.marks[m.id]) continue
      const key = senderAddr(m.from)
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    // Noisiest senders first: that is where the bulk decisions are.
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length || a.key.localeCompare(b.key))
  })

  const staged = $derived(ws.inbox.filter((m) => ws.marks[m.id]))
  let open = $state<Set<string>>(new Set())
  let trayOpen = $state(false)

  function toggleBand(k: string): void {
    const next = new Set(open)
    next.has(k) ? next.delete(k) : next.add(k)
    open = next
  }
  const ids = (b: Band): string[] => b.msgs.map((m) => m.id)
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center gap-2 border-b border-white/5 px-3 py-2">
    <input
      class="w-64 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
      placeholder="Filter..."
      bind:value={ws.search}
    />
    <button
      class="rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] hover:bg-surface-hover"
      onclick={() => ws.runQuery()}>RUN QUERY</button
    >
    <span class="font-mono text-[11px] text-accent-dim">
      {bands.length} senders · {bands.reduce((n, b) => n + b.msgs.length, 0)} undecided
    </span>
    <label class="ml-auto flex items-center gap-2 font-mono text-[11px] text-accent-dim">
      <input type="checkbox" bind:checked={ws.autoApply} class="accent-[#d6ff00]" /> auto-apply
    </label>
  </header>

  <!-- column header, matching the table you already have -->
  <div
    class="flex gap-3 border-b border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim"
  >
    <span class="w-6 shrink-0"></span>
    <span class="w-[30ch] shrink-0">FROM</span>
    <span class="min-w-0 flex-1">SUBJECT</span>
    <span class="w-[16ch] shrink-0 text-right">DATE</span>
    <span class="w-[7ch] shrink-0"></span>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto">
    {#each bands as b (b.key)}
      {@const multi = b.msgs.length > 1}
      {@const rule = ws.ruleFor(b.from)}
      <!-- band row -->
      <div
        class="group flex items-center gap-3 border-b border-white/5 px-3 text-sm {multi
          ? 'bg-surface/60'
          : ''} hover:bg-surface-hover"
      >
        <button
          class="w-6 shrink-0 font-mono text-[10px] text-accent-dim"
          onclick={() => multi && toggleBand(b.key)}
        >
          {multi ? (open.has(b.key) ? '▾' : '▸') : ''}
        </button>
        <span class="w-[30ch] shrink-0 truncate py-2 font-semibold">
          {senderName(b.from)}
          {#if multi}<span class="ml-1 rounded bg-surface-active px-1.5 font-mono text-[10px]"
              >{b.msgs.length}</span
            >{/if}
          {#if rule}<span
              class="ml-1 font-mono text-[9px]"
              style="color:{rule.action === 'archive' ? '#d6ff00' : '#ff3333'}">RULE</span
            >{/if}
        </span>
        <span class="min-w-0 flex-1 truncate text-accent-dim">
          {multi ? b.msgs.length + ' messages — ' + b.msgs[0].subject : b.msgs[0].subject}
        </span>
        <span class="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim"
          >{b.msgs[0].date}</span
        >
        <span class="flex w-[7ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
          <button
            class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
            title="Archive all {b.msgs.length}"
            onclick={() => ws.mark(ids(b), 'archive')}>A</button
          >
          <button
            class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
            title="Delete all {b.msgs.length}"
            onclick={() => ws.mark(ids(b), 'trash')}>D</button
          >
        </span>
      </div>

      <!-- expanded band -->
      {#if multi && open.has(b.key)}
        {#each b.msgs as m (m.id)}
          <div
            class="group flex items-center gap-3 border-b border-white/5 bg-black/30 px-3 text-sm hover:bg-surface"
          >
            <span class="w-6 shrink-0"></span>
            <span class="w-[30ch] shrink-0"></span>
            <span class="min-w-0 flex-1 truncate py-1.5">{m.subject}</span>
            <span class="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim"
              >{m.date}</span
            >
            <span class="flex w-[7ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
              <button
                class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                onclick={() => ws.mark([m.id], 'archive')}>A</button
              >
              <button
                class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
                onclick={() => ws.mark([m.id], 'trash')}>D</button
              >
            </span>
          </div>
        {/each}
      {/if}
    {/each}
  </div>

  <!-- staging tray -->
  <div class="border-t border-white/10 bg-black/60">
    <div class="flex items-center gap-3 px-3 py-2">
      <button
        class="font-mono text-[11px] text-accent-dim hover:text-accent"
        onclick={() => (trayOpen = !trayOpen)}
      >
        {trayOpen ? '▾' : '▸'} STAGED {staged.length}
      </button>
      <span class="font-mono text-[11px] text-brand">
        {staged.filter((m) => ws.marks[m.id] === 'archive').length} archive
      </span>
      <span class="font-mono text-[11px] text-danger">
        {staged.filter((m) => ws.marks[m.id] === 'trash').length} delete
      </span>
      <button
        class="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
        disabled={staged.length === 0}
        onclick={() => ws.unmarkAll()}>clear</button
      >
      <button
        class="rounded-md bg-brand px-4 py-1 font-mono text-[11px] text-black disabled:opacity-30"
        disabled={staged.length === 0}
        onclick={() => ws.applyAll()}>APPLY ALL</button
      >
    </div>
    {#if trayOpen}
      <ul class="max-h-48 overflow-y-auto border-t border-white/5">
        {#each staged as m (m.id)}
          {@const a = ws.marks[m.id]}
          <li
            class="flex items-center gap-3 border-l-2 px-3 py-1 text-xs {a === 'archive'
              ? 'border-brand'
              : 'border-danger'}"
          >
            <span class="w-[28ch] shrink-0 truncate text-accent-dim">{senderName(m.from)}</span>
            <span class="min-w-0 flex-1 truncate">{m.subject}</span>
            <button class="shrink-0 font-mono text-[10px] text-accent-dim hover:text-accent"
              onclick={() => ws.unmark([m.id])}>undo</button
            >
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
