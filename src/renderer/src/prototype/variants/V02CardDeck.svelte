<script lang="ts">
  // PROTOTYPE — Variant 2: Card Deck.
  // Premise: no list at all. One message fills the screen; you decide and it is gone.
  // Left = archive, right = delete, down = skip, U = undo. The peek is the whole UI.
  import type { MarkAction } from '../../types'
  import { ws } from '../store.svelte'
  import { senderAddr, senderName } from '../fixtures'

  let idx = $state(0)
  let history = $state<{ id: string; action: MarkAction | 'skip' }[]>([])
  let flash = $state<'archive' | 'trash' | null>(null)

  const deck = $derived(ws.inbox.filter((m) => !ws.marks[m.id]))
  const card = $derived(deck[idx])
  const done = $derived(ws.inbox.length - deck.length)

  function decide(action: MarkAction): void {
    if (!card) return
    flash = action
    setTimeout(() => (flash = null), 160)
    history.push({ id: card.id, action })
    ws.mark([card.id], action)
    if (idx >= deck.length - 1) idx = Math.max(0, deck.length - 2)
  }

  function skip(): void {
    if (!card) return
    history.push({ id: card.id, action: 'skip' })
    idx = (idx + 1) % Math.max(1, deck.length)
  }

  function undo(): void {
    const last = history.pop()
    if (!last) return
    if (last.action !== 'skip') ws.unmark([last.id])
    idx = Math.max(0, idx - 1)
  }

  function onKey(e: KeyboardEvent): void {
    if (e.altKey) return
    if (e.key === 'ArrowLeft') decide('archive')
    else if (e.key === 'ArrowRight') decide('trash')
    else if (e.key === 'ArrowDown' || e.key === ' ') skip()
    else if (e.key.toLowerCase() === 'u') undo()
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="relative flex h-full flex-col items-center justify-center px-6">
  <div class="absolute inset-x-0 top-0 flex items-center gap-4 px-6 py-4">
    <span class="font-mono text-xs tracking-widest text-accent-dim">CARD DECK</span>
    <div class="h-1 flex-1 overflow-hidden rounded-full bg-surface">
      <div
        class="h-full bg-brand transition-all"
        style="width: {(done / Math.max(1, ws.inbox.length)) * 100}%"
      ></div>
    </div>
    <span class="font-mono text-xs text-accent-dim">{done} / {ws.inbox.length}</span>
    <button
      class="rounded-md bg-brand px-3 py-1 font-mono text-xs text-black disabled:opacity-30"
      disabled={ws.markedCount === 0}
      onclick={() => { ws.applyAll(); idx = 0; history = [] }}
    >
      APPLY {ws.markedCount || ''}
    </button>
  </div>

  {#if card}
    <!-- stacked cards behind -->
    <div class="relative w-full max-w-2xl">
      <div class="absolute inset-x-6 -top-4 h-full rounded-2xl border border-white/5 bg-surface/40"></div>
      <div class="absolute inset-x-3 -top-2 h-full rounded-2xl border border-white/5 bg-surface/70"></div>

      <div
        class="relative rounded-2xl border p-8 transition-colors duration-150 {flash === 'archive'
          ? 'border-brand bg-brand/10'
          : flash === 'trash'
            ? 'border-danger bg-danger/10'
            : 'border-white/10 bg-surface'}"
      >
        <div class="font-mono text-[11px] tracking-wider text-accent-dim">{card.date}</div>
        <div class="mt-4 text-lg font-semibold">{senderName(card.from)}</div>
        <div class="font-mono text-xs text-accent-dim">{senderAddr(card.from)}</div>
        <h2 class="mt-6 text-2xl leading-snug">{card.subject}</h2>
        <p class="mt-4 max-h-40 overflow-y-auto text-sm leading-relaxed text-accent-dim">
          {card.body}
        </p>
      </div>
    </div>

    <div class="mt-8 flex items-center gap-3">
      <button
        class="rounded-full border border-brand/40 px-6 py-2.5 font-mono text-xs text-brand hover:bg-brand hover:text-black"
        onclick={() => decide('archive')}
      >
        ← ARCHIVE
      </button>
      <button
        class="rounded-full border border-white/15 px-5 py-2.5 font-mono text-xs text-accent-dim hover:text-accent"
        onclick={skip}>↓ SKIP</button
      >
      <button
        class="rounded-full border border-danger/40 px-6 py-2.5 font-mono text-xs text-danger hover:bg-danger hover:text-black"
        onclick={() => decide('trash')}
      >
        DELETE →
      </button>
      <button
        class="rounded-full px-4 py-2.5 font-mono text-xs text-accent-dim hover:text-accent disabled:opacity-30"
        disabled={history.length === 0}
        onclick={undo}>U UNDO</button
      >
    </div>
    <div class="mt-4 font-mono text-[11px] text-accent-dim">
      arrow keys decide · space skips · u undoes
    </div>
  {:else}
    <div class="text-center">
      <div class="text-4xl">Inbox clear</div>
      <div class="mt-3 font-mono text-xs text-accent-dim">
        {ws.markedCount} pending marks waiting for Apply All
      </div>
    </div>
  {/if}
</div>
