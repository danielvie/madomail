<script lang="ts">
  // PROTOTYPE — Variant 5: Palette.
  // Premise: no toolbar at all. The screen is a result set; every command lives behind
  // Ctrl+K. Typing filters; a leading ">" switches to commands.
  import { ws } from '../store.svelte'
  import { senderName } from '../fixtures'

  let open = $state(true)
  let q = $state('')
  let hi = $state(0)

  type Cmd = { label: string; hint: string; run: () => void }

  const commands: Cmd[] = [
    { label: 'Archive selection', hint: 'mark', run: () => ws.mark([...ws.selection], 'archive') },
    { label: 'Delete selection', hint: 'mark', run: () => ws.mark([...ws.selection], 'trash') },
    { label: 'Apply all pending marks', hint: 'gmail', run: () => ws.applyAll() },
    { label: 'Unmark everything', hint: 'marks', run: () => ws.unmarkAll() },
    { label: 'Run rule query', hint: 'rules', run: () => ws.runQuery() },
    { label: 'Select everything visible', hint: 'selection', run: () => (ws.selection = new Set(ws.filtered.map((m) => m.id))) },
    { label: 'Clear selection', hint: 'selection', run: () => (ws.selection = new Set()) },
    { label: 'Toggle auto-apply', hint: 'preference', run: () => (ws.autoApply = !ws.autoApply) },
    { label: 'Refresh Inbox', hint: 'gmail', run: () => ws.reset() }
  ]

  const isCmd = $derived(q.startsWith('>'))
  const cmdResults = $derived(
    commands.filter((c) => c.label.toLowerCase().includes(q.slice(1).trim().toLowerCase()))
  )
  const msgResults = $derived(
    q.trim()
      ? ws.inbox.filter(
          (m) =>
            m.from.toLowerCase().includes(q.toLowerCase()) ||
            m.subject.toLowerCase().includes(q.toLowerCase())
        )
      : ws.inbox
  )
  const count = $derived(isCmd ? cmdResults.length : msgResults.length)

  function onKey(e: KeyboardEvent): void {
    if (e.altKey) return
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      open = !open
      return
    }
    if (!open) return
    if (e.key === 'Escape') open = false
    else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hi + 1, count - 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.max(0, hi - 1) }
    else if (e.key === 'Enter') {
      if (isCmd) { cmdResults[hi]?.run(); open = false }
      else if (msgResults[hi]) ws.toggle(msgResults[hi].id)
    }
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="relative flex h-full flex-col">
  <div class="min-h-0 flex-1 overflow-y-auto px-10 pt-16 pb-24">
    <div class="mb-8 flex items-baseline gap-4">
      <h1 class="text-3xl font-light">{ws.inbox.length} messages</h1>
      <span class="font-mono text-xs text-accent-dim">
        {ws.selection.size} selected · {ws.markedCount} marked
      </span>
      <button
        class="ml-auto font-mono text-xs text-accent-dim hover:text-accent"
        onclick={() => (open = true)}>press ctrl+k</button
      >
    </div>

    <ul class="space-y-px">
      {#each ws.inbox as m (m.id)}
        {@const a = ws.marks[m.id]}
        <li
          class="flex items-baseline gap-4 rounded px-3 py-2 text-sm {ws.selection.has(m.id)
            ? 'bg-brand/15'
            : ''} {a ? 'opacity-40' : ''}"
        >
          <span class="w-52 shrink-0 truncate text-accent-dim">{senderName(m.from)}</span>
          <span class="min-w-0 flex-1 truncate">{m.subject}</span>
          {#if a}
            <span class="font-mono text-[10px] {a === 'archive' ? 'text-brand' : 'text-danger'}"
              >{a}</span
            >
          {/if}
          <span class="shrink-0 font-mono text-[10px] text-accent-dim">{m.date}</span>
        </li>
      {/each}
    </ul>
  </div>

  {#if open}
    <div class="absolute inset-0 z-40 flex justify-center bg-black/50 pt-24 backdrop-blur-sm">
      <div class="h-fit w-full max-w-xl rounded-xl border border-white/10 bg-surface shadow-2xl">
        <input
          class="w-full bg-transparent px-5 py-4 text-[15px] outline-none placeholder:text-accent-dim"
          placeholder="Search messages, or type > for commands"
          bind:value={q}
          oninput={() => (hi = 0)}
          autofocus
        />
        <div class="max-h-80 overflow-y-auto border-t border-white/5 py-2">
          {#if isCmd}
            {#each cmdResults as c, i (c.label)}
              <button
                class="flex w-full items-baseline gap-3 px-5 py-2 text-left text-sm {hi === i
                  ? 'bg-surface-hover'
                  : ''}"
                onmouseenter={() => (hi = i)}
                onclick={() => { c.run(); open = false }}
              >
                <span class="flex-1">{c.label}</span>
                <span class="font-mono text-[10px] text-accent-dim">{c.hint}</span>
              </button>
            {/each}
          {:else}
            {#each msgResults.slice(0, 40) as m, i (m.id)}
              <button
                class="flex w-full items-baseline gap-3 px-5 py-2 text-left text-sm {hi === i
                  ? 'bg-surface-hover'
                  : ''}"
                onmouseenter={() => (hi = i)}
                onclick={() => ws.toggle(m.id)}
              >
                <span class="w-40 shrink-0 truncate text-xs text-accent-dim"
                  >{senderName(m.from)}</span
                >
                <span class="min-w-0 flex-1 truncate">{m.subject}</span>
                {#if ws.selection.has(m.id)}<span class="font-mono text-[10px] text-brand">✓</span
                  >{/if}
              </button>
            {/each}
          {/if}
        </div>
        <div class="flex gap-4 border-t border-white/5 px-5 py-2 font-mono text-[10px] text-accent-dim">
          <span>↑↓ move</span><span>↵ select / run</span><span>&gt; commands</span><span>esc close</span>
        </div>
      </div>
    </div>
  {/if}
</div>
