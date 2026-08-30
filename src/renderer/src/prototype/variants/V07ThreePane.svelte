<script lang="ts">
  // PROTOTYPE — Variant 7: Three Pane.
  // Premise: replace the Ctrl-hover peek with a permanent reading pane, and give
  // senders a real sidebar so filtering is a click instead of a typed query.
  import { ws } from '../store.svelte'
  import { initials, senderAddr, senderName } from '../fixtures'

  const senders = $derived.by(() => {
    const by = new Map<string, { from: string; n: number }>()
    for (const m of ws.inbox) {
      const k = senderAddr(m.from)
      by.set(k, { from: m.from, n: (by.get(k)?.n ?? 0) + 1 })
    }
    return [...by.entries()].sort((a, b) => b[1].n - a[1].n)
  })

  let sender = $state<string | null>(null)
  let openId = $state<string | null>(null)

  const list = $derived(
    ws.filtered.filter((m) => !sender || senderAddr(m.from) === sender)
  )
  const current = $derived(ws.inbox.find((m) => m.id === openId) ?? list[0])
</script>

<div class="grid h-full grid-cols-[220px_minmax(0,1fr)_minmax(0,1.1fr)] divide-x divide-white/5">
  <!-- senders -->
  <aside class="flex min-h-0 flex-col">
    <div class="px-4 py-3 font-mono text-[11px] tracking-widest text-accent-dim">SENDERS</div>
    <div class="min-h-0 flex-1 overflow-y-auto pb-20">
      <button
        class="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm {sender === null
          ? 'bg-surface-hover'
          : 'hover:bg-surface'}"
        onclick={() => (sender = null)}
      >
        <span class="flex-1">All Inbox</span>
        <span class="font-mono text-[10px] text-accent-dim">{ws.inbox.length}</span>
      </button>
      {#each senders as [key, s] (key)}
        {@const rule = ws.ruleFor(s.from)}
        <button
          class="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm {sender === key
            ? 'bg-surface-hover'
            : 'hover:bg-surface'}"
          onclick={() => (sender = key)}
        >
          <span class="min-w-0 flex-1 truncate">{senderName(s.from)}</span>
          {#if rule}
            <span
              class="size-1.5 rounded-full"
              style="background:{rule.action === 'archive' ? '#d6ff00' : '#ff3333'}"
              title="rule: {rule.action}"
            ></span>
          {/if}
          <span class="font-mono text-[10px] text-accent-dim">{s.n}</span>
        </button>
      {/each}
    </div>
  </aside>

  <!-- list -->
  <section class="flex min-h-0 flex-col">
    <div class="flex items-center gap-2 px-4 py-3">
      <input
        class="flex-1 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
        placeholder="Search..."
        bind:value={ws.search}
      />
      <button
        class="rounded-md bg-brand px-3 py-1.5 font-mono text-xs text-black disabled:opacity-30"
        disabled={ws.markedCount === 0}
        onclick={() => ws.applyAll()}>APPLY {ws.markedCount || ''}</button
      >
    </div>
    <ul class="min-h-0 flex-1 overflow-y-auto pb-20">
      {#each list as m (m.id)}
        {@const a = ws.marks[m.id]}
        <li>
          <button
            class="w-full border-b border-white/5 px-4 py-3 text-left {current?.id === m.id
              ? 'bg-surface-hover'
              : 'hover:bg-surface'} {a ? 'opacity-50' : ''}"
            onclick={() => (openId = m.id)}
          >
            <div class="flex items-baseline gap-2">
              <span class="min-w-0 flex-1 truncate text-sm font-semibold">{senderName(m.from)}</span>
              {#if a}<span
                  class="font-mono text-[10px] {a === 'archive' ? 'text-brand' : 'text-danger'}"
                  >{a}</span
                >{/if}
              <span class="shrink-0 font-mono text-[10px] text-accent-dim">{m.date}</span>
            </div>
            <div class="truncate text-sm">{m.subject}</div>
            <div class="truncate text-xs text-accent-dim">{m.snippet}</div>
          </button>
        </li>
      {/each}
    </ul>
  </section>

  <!-- reader -->
  <section class="flex min-h-0 flex-col bg-black/25">
    {#if current}
      <div class="flex items-center gap-2 border-b border-white/5 px-5 py-3">
        <div class="grid size-8 place-items-center rounded-lg bg-surface-active font-mono text-[10px]">
          {initials(current.from)}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold">{senderName(current.from)}</div>
          <div class="truncate font-mono text-[10px] text-accent-dim">{senderAddr(current.from)}</div>
        </div>
        <button
          class="rounded-md px-3 py-1.5 font-mono text-[11px] hover:bg-brand hover:text-black"
          onclick={() => ws.mark([current.id], 'archive')}>ARCHIVE</button
        >
        <button
          class="rounded-md px-3 py-1.5 font-mono text-[11px] hover:bg-danger"
          onclick={() => ws.mark([current.id], 'trash')}>DELETE</button
        >
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5 pb-20">
        <h2 class="text-xl leading-snug">{current.subject}</h2>
        <div class="mt-1 font-mono text-[11px] text-accent-dim">{current.date}</div>
        <p class="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-accent-dim">
          {current.body}
        </p>
      </div>
    {:else}
      <div class="grid flex-1 place-items-center text-sm text-accent-dim">No message selected</div>
    {/if}
  </section>
</div>
