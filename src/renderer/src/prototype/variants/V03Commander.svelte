<script lang="ts">
  // PROTOTYPE — Variant 3: Commander.
  // Premise: make the pending marks a real place. Inbox on the left, a staging pane on
  // the right holding everything you have decided but not yet sent to Gmail.
  import { ws } from '../store.svelte'
  import { senderName } from '../fixtures'

  const staged = $derived(ws.inbox.filter((m) => ws.marks[m.id]))
  const pending = $derived(ws.filtered.filter((m) => !ws.marks[m.id]))

  let cursor = $state(0)
  let pane = $state<'left' | 'right'>('left')

  const selected = $derived(ws.selection)
  const targets = (id: string): string[] =>
    selected.size && selected.has(id) ? [...selected] : [id]
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center gap-3 border-b border-white/5 px-4 py-3">
    <span class="font-mono text-xs tracking-widest text-accent-dim">COMMANDER</span>
    <input
      class="w-64 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
      placeholder="Filter..."
      bind:value={ws.search}
    />
    <button
      class="rounded-md border border-white/10 px-3 py-1.5 font-mono text-xs hover:bg-surface-hover"
      onclick={() => ws.runQuery()}>RUN QUERY</button
    >
    <label class="flex items-center gap-2 font-mono text-xs text-accent-dim">
      <input type="checkbox" bind:checked={ws.autoApply} class="accent-[#d6ff00]" /> auto-apply
    </label>
  </header>

  <div class="grid min-h-0 flex-1 grid-cols-2 divide-x divide-white/5">
    <!-- LEFT: inbox -->
    <div
      class="flex min-h-0 flex-col {pane === 'left' ? '' : 'opacity-60'}"
      onfocusin={() => (pane = 'left')}
    >
      <div class="flex items-center justify-between px-4 py-2 font-mono text-[11px] text-accent-dim">
        <span>INBOX · {pending.length}</span>
        <span>{selected.size} selected</span>
      </div>
      <ul class="min-h-0 flex-1 overflow-y-auto pb-20">
        {#each pending as m, i (m.id)}
          <li>
            <button
              class="flex w-full items-center gap-3 border-l-2 px-4 py-2 text-left text-sm {cursor ===
                i && pane === 'left'
                ? 'border-brand bg-surface-hover'
                : 'border-transparent hover:bg-surface'} {selected.has(m.id) ? 'bg-brand/10' : ''}"
              onclick={() => {
                cursor = i
                pane = 'left'
                ws.toggle(m.id)
              }}
            >
              <span class="w-40 shrink-0 truncate text-xs">{senderName(m.from)}</span>
              <span class="min-w-0 flex-1 truncate">{m.subject}</span>
              <span class="shrink-0 font-mono text-[10px] text-accent-dim">{m.date}</span>
            </button>
          </li>
        {/each}
      </ul>
      <div class="flex gap-2 border-t border-white/5 p-3">
        <button
          class="flex-1 rounded-md bg-surface-hover py-2 font-mono text-xs hover:bg-brand hover:text-black disabled:opacity-30"
          disabled={selected.size === 0}
          onclick={() => ws.mark([...selected], 'archive')}>STAGE ARCHIVE →</button
        >
        <button
          class="flex-1 rounded-md bg-surface-hover py-2 font-mono text-xs hover:bg-danger disabled:opacity-30"
          disabled={selected.size === 0}
          onclick={() => ws.mark([...selected], 'trash')}>STAGE DELETE →</button
        >
      </div>
    </div>

    <!-- RIGHT: staging -->
    <div class="flex min-h-0 flex-col bg-black/30">
      <div class="flex items-center justify-between px-4 py-2 font-mono text-[11px] text-accent-dim">
        <span>STAGED · {staged.length}</span>
        <button class="hover:text-accent" onclick={() => ws.unmarkAll()}>clear all</button>
      </div>
      <ul class="min-h-0 flex-1 overflow-y-auto pb-20">
        {#each staged as m (m.id)}
          {@const a = ws.marks[m.id]}
          <li
            class="flex items-center gap-3 border-l-2 px-4 py-2 text-sm {a === 'archive'
              ? 'border-brand'
              : 'border-danger'}"
          >
            <span
              class="w-16 shrink-0 font-mono text-[10px] {a === 'archive'
                ? 'text-brand'
                : 'text-danger'}">{a === 'archive' ? 'ARCHIVE' : 'DELETE'}</span
            >
            <span class="w-32 shrink-0 truncate text-xs text-accent-dim">{senderName(m.from)}</span>
            <span class="min-w-0 flex-1 truncate">{m.subject}</span>
            <button
              class="shrink-0 font-mono text-[10px] text-accent-dim hover:text-accent"
              onclick={() => ws.unmark(targets(m.id))}>←</button
            >
          </li>
        {:else}
          <li class="px-4 py-10 text-center text-sm text-accent-dim">
            Nothing staged. Select messages on the left and stage an action.
          </li>
        {/each}
      </ul>
      <div class="border-t border-white/5 p-3">
        <button
          class="w-full rounded-md bg-brand py-2 font-mono text-xs text-black disabled:opacity-30"
          disabled={staged.length === 0}
          onclick={() => ws.applyAll()}
        >
          APPLY ALL TO GMAIL ({staged.length})
        </button>
      </div>
    </div>
  </div>
</div>
