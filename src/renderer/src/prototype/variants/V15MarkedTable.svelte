<script lang="ts">
  // PROTOTYPE — Variant 15: Marked Table. (the conservative control)
  // Premise: the density of today's table is not the problem — the lack of feedback is.
  // Same table, four changes: marked rows stay in place and are painted, so you can see
  // what you decided and change your mind; shift-click selects a range; a sender chip
  // grabs every message from that sender; the footer is a running ledger, not a counter.
  import { ws } from '../store.svelte'
  import { senderAddr, senderName } from '../fixtures'

  let anchor = $state<string | null>(null)
  let peek = $state<string | null>(null)

  const rows = $derived(ws.filtered)
  const sel = $derived(ws.selection)
  const staged = $derived(ws.inbox.filter((m) => ws.marks[m.id]))
  const scope = (id: string): string[] => (sel.size && sel.has(id) ? [...sel] : [id])

  function click(id: string, e: MouseEvent): void {
    if (e.shiftKey && anchor) {
      const ids = rows.map((m) => m.id)
      const [a, b] = [ids.indexOf(anchor), ids.indexOf(id)].sort((x, y) => x - y)
      ws.selection = new Set([...sel, ...ids.slice(a, b + 1)])
    } else {
      anchor = id
      ws.toggle(id)
    }
  }

  const senderIds = (from: string): string[] =>
    rows.filter((m) => senderAddr(m.from) === senderAddr(from)).map((m) => m.id)
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center gap-2 border-b border-white/5 px-3 py-2">
    <input
      class="w-72 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
      placeholder="Search..."
      bind:value={ws.search}
    />
    <button
      class="rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] hover:bg-surface-hover"
      onclick={() => ws.runQuery()}>RUN QUERY</button
    >
    <span class="font-mono text-[11px] text-accent-dim">{rows.length} messages</span>
    <label class="ml-auto flex items-center gap-2 font-mono text-[11px] text-accent-dim">
      <input type="checkbox" bind:checked={ws.autoApply} class="accent-[#d6ff00]" /> auto-apply
    </label>
  </header>

  <div
    class="flex gap-3 border-b border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim"
  >
    <span class="w-5 shrink-0"></span>
    <span class="w-[30ch] shrink-0">FROM</span>
    <span class="min-w-0 flex-1">SUBJECT</span>
    <span class="w-[16ch] shrink-0 text-right">DATE</span>
    <span class="w-[13ch] shrink-0"></span>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto">
    {#each rows as m (m.id)}
      {@const a = ws.marks[m.id]}
      <div
        class="group flex items-center gap-3 border-b border-white/5 px-3 text-sm {a === 'archive'
          ? 'bg-brand/10'
          : a === 'trash'
            ? 'bg-danger/10'
            : sel.has(m.id)
              ? 'bg-surface-active'
              : 'hover:bg-surface'}"
      >
        <!-- the mark itself, always visible once set -->
        <span
          class="w-5 shrink-0 font-mono text-[10px] {a === 'archive'
            ? 'text-brand'
            : a === 'trash'
              ? 'text-danger'
              : 'text-accent-dim'}">{a === 'archive' ? 'A' : a === 'trash' ? 'D' : ''}</span
        >
        <button
          class="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
          onclick={(e) => click(m.id, e)}
          onmouseenter={() => (peek = m.id)}
          onmouseleave={() => (peek = null)}
        >
          <span class="w-[30ch] shrink-0 truncate font-semibold {a ? 'line-through opacity-60' : ''}"
            >{senderName(m.from)}</span
          >
          <span class="min-w-0 flex-1 truncate {a ? 'line-through opacity-60' : ''}">{m.subject}</span
          >
          <span class="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim"
            >{m.date}</span
          >
        </button>
        <span class="flex w-[13ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
          {#if a}
            <button
              class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-surface-active"
              onclick={() => ws.unmark(scope(m.id))}>UNDO</button
            >
          {:else}
            <button
              class="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-surface-hover"
              title="Select all {senderIds(m.from).length} from {senderName(m.from)}"
              onclick={() => (ws.selection = new Set([...sel, ...senderIds(m.from)]))}
              >⋮{senderIds(m.from).length}</button
            >
            <button
              class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
              onclick={() => ws.mark(scope(m.id), 'archive')}>A</button
            >
            <button
              class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
              onclick={() => ws.mark(scope(m.id), 'trash')}>D</button
            >
          {/if}
        </span>
      </div>
    {/each}
  </div>

  <!-- peek: a strip, not a popup -->
  {#if peek}
    {@const m = ws.inbox.find((x) => x.id === peek)}
    {#if m}
      <div class="border-t border-white/5 bg-black/50 px-3 py-1.5">
        <div class="truncate text-xs">{m.subject}</div>
        <div class="truncate text-[11px] text-accent-dim">{m.snippet}</div>
      </div>
    {/if}
  {/if}

  <!-- ledger -->
  <div class="flex items-center gap-3 border-t border-white/10 bg-black/60 px-3 py-2">
    <span class="font-mono text-[11px] text-accent-dim">{sel.size} selected</span>
    <span class="font-mono text-[11px] text-brand">
      {staged.filter((x) => ws.marks[x.id] === 'archive').length} to archive
    </span>
    <span class="font-mono text-[11px] text-danger">
      {staged.filter((x) => ws.marks[x.id] === 'trash').length} to delete
    </span>
    <div class="ml-auto flex gap-2">
      <button
        class="rounded-md bg-surface-hover px-3 py-1 font-mono text-[11px] hover:bg-brand hover:text-black disabled:opacity-30"
        disabled={sel.size === 0}
        onclick={() => ws.mark([...sel], 'archive')}>ARCHIVE SEL</button
      >
      <button
        class="rounded-md bg-surface-hover px-3 py-1 font-mono text-[11px] hover:bg-danger disabled:opacity-30"
        disabled={sel.size === 0}
        onclick={() => ws.mark([...sel], 'trash')}>DELETE SEL</button
      >
      <button
        class="rounded-md px-3 py-1 font-mono text-[11px] text-accent-dim hover:text-accent disabled:opacity-30"
        disabled={staged.length === 0}
        onclick={() => ws.unmarkAll()}>UNMARK ALL</button
      >
      <button
        class="rounded-md bg-brand px-4 py-1 font-mono text-[11px] text-black disabled:opacity-30"
        disabled={staged.length === 0}
        onclick={() => ws.applyAll()}>APPLY {staged.length}</button
      >
    </div>
  </div>
</div>
