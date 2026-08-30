<script lang="ts">
  // PROTOTYPE — Variant 6: Board.
  // Premise: pending marks are literally columns. Drag a message from Inbox into
  // Archive or Delete; Apply All flushes both columns to Gmail.
  import type { MarkAction } from '../../types'
  import { ws } from '../store.svelte'
  import { senderName } from '../fixtures'

  let dragging = $state<string | null>(null)
  let over = $state<string | null>(null)

  const inboxCol = $derived(ws.filtered.filter((m) => !ws.marks[m.id]))
  const archiveCol = $derived(ws.inbox.filter((m) => ws.marks[m.id] === 'archive'))
  const trashCol = $derived(ws.inbox.filter((m) => ws.marks[m.id] === 'trash'))

  function drop(target: MarkAction | 'inbox'): void {
    if (!dragging) return
    if (target === 'inbox') ws.unmark([dragging])
    else ws.marks[dragging] = target
    dragging = null
    over = null
  }

  /** Click fallback so the board is usable without dragging: inbox -> archive -> delete -> inbox. */
  function cycle(id: string): void {
    const at = ws.marks[id]
    if (!at) ws.marks[id] = 'archive'
    else if (at === 'archive') ws.marks[id] = 'trash'
    else ws.unmark([id])
  }
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center gap-3 border-b border-white/5 px-5 py-3">
    <span class="font-mono text-xs tracking-widest text-accent-dim">BOARD</span>
    <input
      class="w-56 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
      placeholder="Filter..."
      bind:value={ws.search}
    />
    <button
      class="rounded-md border border-white/10 px-3 py-1.5 font-mono text-xs hover:bg-surface-hover"
      onclick={() => ws.runQuery()}>RUN QUERY</button
    >
    <button
      class="ml-auto rounded-md bg-brand px-4 py-1.5 font-mono text-xs text-black disabled:opacity-30"
      disabled={ws.markedCount === 0}
      onclick={() => ws.applyAll()}>APPLY ALL ({ws.markedCount})</button
    >
  </header>

  <div class="grid min-h-0 flex-1 grid-cols-3 gap-4 p-4 pb-20">
    {#snippet column(
      title: string,
      accent: string,
      items: typeof ws.inbox,
      target: MarkAction | 'inbox'
    )}
      <div
        role="list"
        class="flex min-h-0 flex-col rounded-xl border transition-colors {over === target
          ? 'border-brand bg-brand/5'
          : 'border-white/8 bg-surface/40'}"
        ondragover={(e) => {
          e.preventDefault()
          over = target
        }}
        ondragleave={() => over === target && (over = null)}
        ondrop={() => drop(target)}
      >
        <div class="flex items-center justify-between px-4 py-3">
          <span class="font-mono text-xs tracking-widest" style="color:{accent}">{title}</span>
          <span class="font-mono text-xs text-accent-dim">{items.length}</span>
        </div>
        <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          {#each items as m (m.id)}
            <div
              role="listitem"
              draggable="true"
              ondragstart={() => (dragging = m.id)}
              ondragend={() => (dragging = null)}
              onclick={() => cycle(m.id)}
              onkeydown={(e) => e.key === 'Enter' && cycle(m.id)}
              tabindex="0"
              class="cursor-grab rounded-lg border border-white/8 bg-surface p-3 active:cursor-grabbing {dragging ===
              m.id
                ? 'opacity-40'
                : 'hover:border-white/20'}"
            >
              <div class="flex items-baseline gap-2">
                <span class="min-w-0 flex-1 truncate text-xs font-semibold"
                  >{senderName(m.from)}</span
                >
                <span class="shrink-0 font-mono text-[10px] text-accent-dim">{m.date}</span>
              </div>
              <div class="mt-1 line-clamp-2 text-sm">{m.subject}</div>
            </div>
          {:else}
            <div class="px-2 py-8 text-center font-mono text-[11px] text-accent-dim">
              drag cards here — or click a card to cycle it
            </div>
          {/each}
        </div>
      </div>
    {/snippet}

    {@render column('INBOX', '#8b8b92', inboxCol, 'inbox')}
    {@render column('ARCHIVE', '#d6ff00', archiveCol, 'archive')}
    {@render column('DELETE', '#ff3333', trashCol, 'trash')}
  </div>
</div>
