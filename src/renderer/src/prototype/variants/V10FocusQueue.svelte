<script lang="ts">
  // PROTOTYPE — Variant 10: Focus Queue.
  // Premise: triage is a session, not a screen you live in. Five at a time, a visible
  // finish line, and one confirmation at the end of each batch.
  import type { MarkAction } from '../../types'
  import { ws } from '../store.svelte'
  import { senderName } from '../fixtures'

  const BATCH = 5
  let batchStart = $state(0)
  let started = $state(false)

  const untouched = $derived(ws.inbox.filter((m) => !ws.marks[m.id]))
  const batch = $derived(untouched.slice(0, BATCH))
  const decided = $derived(batch.filter((m) => ws.marks[m.id]).length)
  const total = $derived(ws.inbox.length)
  const left = $derived(untouched.length)

  function decide(id: string, action: MarkAction): void {
    ws.marks[id] = action
  }
  function commitBatch(): void {
    ws.applyAll()
    batchStart += BATCH
  }
</script>

<div class="flex h-full flex-col items-center overflow-y-auto">
  {#if !started}
    <div class="m-auto max-w-md text-center">
      <div class="font-mono text-xs tracking-widest text-brand">TRIAGE SESSION</div>
      <h1 class="mt-4 text-4xl font-light">{total} messages</h1>
      <p class="mt-4 text-sm leading-relaxed text-accent-dim">
        Five at a time. Decide archive or delete for each, then send the batch to Gmail.
        Roughly {Math.ceil(total / BATCH)} rounds.
      </p>
      <button
        class="mt-8 rounded-full bg-brand px-8 py-3 font-mono text-sm text-black"
        onclick={() => (started = true)}>START</button
      >
      <button
        class="mt-3 block w-full font-mono text-xs text-accent-dim hover:text-accent"
        onclick={() => { ws.runQuery(); started = true }}>apply my sender rules first</button
      >
    </div>
  {:else if left === 0}
    <div class="m-auto text-center">
      <div class="text-5xl">Inbox zero</div>
      <div class="mt-4 font-mono text-xs text-accent-dim">
        {ws.applied.length} messages sent to Gmail this session
      </div>
      <button
        class="mt-8 rounded-full border border-white/15 px-6 py-2 font-mono text-xs hover:bg-surface-hover"
        onclick={() => { ws.reset(); started = false; batchStart = 0 }}>run again</button
      >
    </div>
  {:else}
    <div class="w-full max-w-3xl px-6 pt-10">
      <div class="flex items-baseline gap-3">
        <span class="font-mono text-xs tracking-widest text-accent-dim">ROUND {batchStart / BATCH + 1}</span>
        <span class="ml-auto font-mono text-xs text-accent-dim">{left} left of {total}</span>
      </div>
      <div class="mt-2 flex h-1.5 gap-1">
        {#each { length: Math.ceil(total / BATCH) } as _, i}
          <div
            class="flex-1 rounded-full {i < batchStart / BATCH
              ? 'bg-brand'
              : i === batchStart / BATCH
                ? 'bg-brand/40'
                : 'bg-surface'}"
          ></div>
        {/each}
      </div>

      <ul class="mt-8 space-y-3">
        {#each batch as m (m.id)}
          {@const a = ws.marks[m.id]}
          <li
            class="rounded-xl border p-4 transition-colors {a === 'archive'
              ? 'border-brand/50 bg-brand/5'
              : a === 'trash'
                ? 'border-danger/50 bg-danger/5'
                : 'border-white/8 bg-surface'}"
          >
            <div class="flex items-baseline gap-2">
              <span class="text-sm font-semibold">{senderName(m.from)}</span>
              <span class="ml-auto font-mono text-[10px] text-accent-dim">{m.date}</span>
            </div>
            <div class="mt-1 text-[15px]">{m.subject}</div>
            <div class="mt-1 line-clamp-2 text-xs text-accent-dim">{m.snippet}</div>
            <div class="mt-3 flex gap-2">
              <button
                class="flex-1 rounded-lg py-2 font-mono text-[11px] {a === 'archive'
                  ? 'bg-brand text-black'
                  : 'bg-surface-hover hover:bg-surface-active'}"
                onclick={() => decide(m.id, 'archive')}>ARCHIVE</button
              >
              <button
                class="flex-1 rounded-lg py-2 font-mono text-[11px] {a === 'trash'
                  ? 'bg-danger text-black'
                  : 'bg-surface-hover hover:bg-surface-active'}"
                onclick={() => decide(m.id, 'trash')}>DELETE</button
              >
              <button
                class="rounded-lg px-4 py-2 font-mono text-[11px] text-accent-dim hover:text-accent"
                onclick={() => ws.unmark([m.id])}>KEEP</button
              >
            </div>
          </li>
        {/each}
      </ul>

      <div class="sticky bottom-0 mt-6 flex items-center gap-3 bg-base py-4 pb-16">
        <span class="font-mono text-xs text-accent-dim">{decided} of {batch.length} decided</span>
        <button
          class="ml-auto rounded-full bg-brand px-6 py-2.5 font-mono text-xs text-black disabled:opacity-30"
          disabled={ws.markedCount === 0}
          onclick={commitBatch}>SEND BATCH TO GMAIL ({ws.markedCount})</button
        >
      </div>
    </div>
  {/if}
</div>
