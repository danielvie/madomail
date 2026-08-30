<script lang="ts">
  // PROTOTYPE — Variant 11: Triage Desk. (from feedback on 3 + 7)
  // Premise: keep Commander's staging column and give it a reading pane, so you never
  // leave the screen to find out what something is. Inbox | Reader | Staged.
  // Bulk first: shift-click ranges, "+N from this sender" on every row.
  import { ws } from '../store.svelte'
  import { senderAddr, senderName } from '../fixtures'

  let cursorId = $state<string | null>(null)
  let anchor = $state<string | null>(null)

  const pending = $derived(ws.filtered.filter((m) => !ws.marks[m.id]))
  const staged = $derived(ws.inbox.filter((m) => ws.marks[m.id]))
  const current = $derived(ws.inbox.find((m) => m.id === cursorId) ?? pending[0])
  const sel = $derived(ws.selection)

  const sameSender = (id: string): string[] => {
    const m = ws.inbox.find((x) => x.id === id)
    if (!m) return []
    const key = senderAddr(m.from)
    return pending.filter((x) => senderAddr(x.from) === key).map((x) => x.id)
  }

  function click(id: string, e: MouseEvent): void {
    cursorId = id
    if (e.shiftKey && anchor) {
      const ids = pending.map((m) => m.id)
      const [a, b] = [ids.indexOf(anchor), ids.indexOf(id)].sort((x, y) => x - y)
      ws.selection = new Set([...sel, ...ids.slice(a, b + 1)])
    } else {
      anchor = id
      ws.toggle(id)
    }
  }

  /** Act on the selection when there is one, otherwise on the row you clicked. */
  const scope = (id: string): string[] => (sel.size && sel.has(id) ? [...sel] : [id])

  function onKey(e: KeyboardEvent): void {
    if (e.altKey || e.target instanceof HTMLInputElement) return
    const ids = pending.map((m) => m.id)
    const i = ids.indexOf(current?.id ?? '')
    if (e.key === 'ArrowDown') { e.preventDefault(); cursorId = ids[Math.min(i + 1, ids.length - 1)] }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cursorId = ids[Math.max(0, i - 1)] }
    else if (e.key === 'a' && current) ws.mark(scope(current.id), 'archive')
    else if (e.key === 'd' && current) ws.mark(scope(current.id), 'trash')
    else if (e.key === 'Enter') ws.applyAll()
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="grid h-full grid-cols-[minmax(0,1.15fr)_minmax(0,1.25fr)_minmax(260px,0.75fr)] divide-x divide-white/5">
  <!-- INBOX -->
  <section class="flex min-h-0 flex-col">
    <div class="flex items-center gap-2 px-3 py-2">
      <input
        class="min-w-0 flex-1 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
        placeholder="Filter..."
        bind:value={ws.search}
      />
      <span class="shrink-0 font-mono text-[11px] text-accent-dim">{pending.length}</span>
    </div>
    <ul class="min-h-0 flex-1 overflow-y-auto">
      {#each pending as m (m.id)}
        {@const dupes = sameSender(m.id).length - 1}
        <li
          class="group flex items-center gap-2 border-l-2 pr-2 text-sm {current?.id === m.id
            ? 'border-brand bg-surface-hover'
            : 'border-transparent hover:bg-surface'} {sel.has(m.id) ? 'bg-brand/10' : ''}"
        >
          <button class="min-w-0 flex-1 py-2 pl-3 text-left" onclick={(e) => click(m.id, e)}>
            <div class="flex items-baseline gap-2">
              <span class="min-w-0 flex-1 truncate text-xs font-semibold">{senderName(m.from)}</span>
              <span class="shrink-0 font-mono text-[10px] text-accent-dim">{m.date}</span>
            </div>
            <div class="truncate">{m.subject}</div>
          </button>
          <div class="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
            {#if dupes > 0}
              <button
                class="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                title="Select all {dupes + 1} from this sender"
                onclick={() => (ws.selection = new Set([...sel, ...sameSender(m.id)]))}>+{dupes}</button
              >
            {/if}
            <button
              class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
              onclick={() => ws.mark(scope(m.id), 'archive')}>A</button
            >
            <button
              class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
              onclick={() => ws.mark(scope(m.id), 'trash')}>D</button
            >
          </div>
        </li>
      {/each}
    </ul>
    <div class="flex items-center gap-2 border-t border-white/5 px-3 py-2">
      <span class="font-mono text-[11px] text-accent-dim">{sel.size} selected</span>
      <button
        class="ml-auto rounded bg-surface-hover px-3 py-1 font-mono text-[11px] hover:bg-brand hover:text-black disabled:opacity-30"
        disabled={sel.size === 0}
        onclick={() => ws.mark([...sel], 'archive')}>ARCHIVE</button
      >
      <button
        class="rounded bg-surface-hover px-3 py-1 font-mono text-[11px] hover:bg-danger disabled:opacity-30"
        disabled={sel.size === 0}
        onclick={() => ws.mark([...sel], 'trash')}>DELETE</button
      >
    </div>
  </section>

  <!-- READER -->
  <section class="flex min-h-0 flex-col bg-black/20">
    {#if current}
      <div class="flex items-center gap-2 px-4 py-2">
        <div class="min-w-0 flex-1">
          <div class="truncate text-xs font-semibold">{senderName(current.from)}</div>
          <div class="truncate font-mono text-[10px] text-accent-dim">{senderAddr(current.from)}</div>
        </div>
        <button
          class="shrink-0 rounded px-2 py-1 font-mono text-[10px] text-accent-dim hover:bg-surface-hover hover:text-accent"
          title="Save a sender rule and stage every message it matches"
          onclick={() => { ws.addRule(current.from, 'archive'); ws.runQuery() }}>ALWAYS ARCHIVE</button
        >
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <h2 class="text-lg leading-snug">{current.subject}</h2>
        <div class="mt-1 font-mono text-[10px] text-accent-dim">{current.date}</div>
        <p class="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-accent-dim">{current.body}</p>
      </div>
      <div class="flex gap-2 border-t border-white/5 p-3">
        <button
          class="flex-1 rounded-md bg-surface-hover py-2 font-mono text-[11px] hover:bg-brand hover:text-black"
          onclick={() => ws.mark(scope(current.id), 'archive')}>ARCHIVE — A</button
        >
        <button
          class="flex-1 rounded-md bg-surface-hover py-2 font-mono text-[11px] hover:bg-danger"
          onclick={() => ws.mark(scope(current.id), 'trash')}>DELETE — D</button
        >
      </div>
    {:else}
      <div class="grid flex-1 place-items-center text-sm text-accent-dim">Inbox empty</div>
    {/if}
  </section>

  <!-- STAGED -->
  <section class="flex min-h-0 flex-col bg-black/40">
    <div class="flex items-center gap-2 px-3 py-2">
      <span class="font-mono text-[11px] tracking-widest text-accent-dim">STAGED</span>
      <span class="font-mono text-[11px] text-accent-dim">{staged.length}</span>
      <button
        class="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
        disabled={staged.length === 0}
        onclick={() => ws.unmarkAll()}>clear</button
      >
    </div>
    <ul class="min-h-0 flex-1 overflow-y-auto">
      {#each staged as m (m.id)}
        {@const a = ws.marks[m.id]}
        <li
          class="group flex items-center gap-2 border-l-2 py-1.5 pl-2 pr-2 text-xs {a === 'archive'
            ? 'border-brand'
            : 'border-danger'}"
        >
          <span class="min-w-0 flex-1 truncate">{m.subject}</span>
          <button
            class="shrink-0 font-mono text-[10px] text-accent-dim opacity-0 group-hover:opacity-100 hover:text-accent"
            onclick={() => ws.unmark([m.id])}>×</button
          >
        </li>
      {:else}
        <li class="px-3 py-6 text-center text-xs text-accent-dim">
          Nothing staged yet. A / D on any row.
        </li>
      {/each}
    </ul>
    <div class="border-t border-white/5 p-3">
      <button
        class="w-full rounded-md bg-brand py-2 font-mono text-[11px] text-black disabled:opacity-30"
        disabled={staged.length === 0}
        onclick={() => ws.applyAll()}>APPLY {staged.length} — ENTER</button
      >
    </div>
  </section>
</div>
