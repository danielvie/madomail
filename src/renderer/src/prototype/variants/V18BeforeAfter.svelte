<script lang="ts">
  // PROTOTYPE — Variant 18: Before / After. (staging study 3 of 5)
  // Staging idea: show the *outcome*, not the queue. Top pane is the Inbox as it will
  // look once you apply; bottom pane is what leaves. The two panes trade rows, and the
  // headline number is what you actually care about — how small the Inbox gets.
  import type { EmailMsg } from '../../types'
  import { ws } from '../store.svelte'
  import TriageList from '../TriageList.svelte'
  import { senderAddr, senderName } from '../fixtures'

  const leaving = $derived(ws.inbox.filter((m) => ws.marks[m.id]))
  const staying = $derived(ws.inbox.length - leaving.length)
  const pct = $derived(Math.round((leaving.length / Math.max(1, ws.inbox.length)) * 100))

  const groups = $derived.by(() => {
    const by = new Map<string, { key: string; from: string; msgs: EmailMsg[] }>()
    for (const m of leaving) {
      const key = senderAddr(m.from) + ':' + ws.marks[m.id]
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length)
  })
</script>

<div class="flex h-full flex-col">
  <!-- outcome headline -->
  <header class="flex items-center gap-4 border-b border-white/5 px-4 py-2.5">
    <div class="flex items-baseline gap-2">
      <span class="font-mono text-[11px] tracking-widest text-accent-dim">INBOX AFTER APPLY</span>
      <span class="text-2xl font-light">{staying}</span>
      <span class="font-mono text-[11px] text-accent-dim">was {ws.inbox.length}</span>
    </div>
    <div class="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface">
      <div class="bg-white/25" style="width:{100 - pct}%"></div>
      <div
        class="bg-brand"
        style="width:{(leaving.filter((m) => ws.marks[m.id] === 'archive').length /
          Math.max(1, ws.inbox.length)) *
          100}%"
      ></div>
      <div
        class="bg-danger"
        style="width:{(leaving.filter((m) => ws.marks[m.id] === 'trash').length /
          Math.max(1, ws.inbox.length)) *
          100}%"
      ></div>
    </div>
    <button
      class="shrink-0 rounded-md bg-brand px-4 py-1.5 font-mono text-[11px] text-black disabled:opacity-30"
      disabled={leaving.length === 0}
      onclick={() => ws.applyAll()}>APPLY — CLEAR {pct}%</button
    >
  </header>

  <!-- what stays -->
  <div class="flex min-h-0 flex-1 flex-col">
    <TriageList />
  </div>

  <!-- what leaves -->
  <!-- collapses to a hint line until something is staged, so an empty batch costs no room -->
  <section
    class="flex max-h-[45%] flex-none flex-col border-t-2 border-brand/30 bg-black/50"
  >
    <div class="flex items-center gap-3 px-3 py-1.5">
      <span class="font-mono text-[11px] tracking-widest text-accent-dim">LEAVING THE INBOX</span>
      <span class="font-mono text-[11px]">{leaving.length}</span>
      <button
        class="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
        disabled={leaving.length === 0}
        onclick={() => ws.unmarkAll()}>keep everything</button
      >
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
      <div class="flex flex-wrap gap-2">
        {#each groups as g (g.key)}
          {@const a = ws.marks[g.msgs[0].id]}
          <button
            class="group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors {a ===
            'archive'
              ? 'border-brand/40 bg-brand/10 hover:border-brand'
              : 'border-danger/40 bg-danger/10 hover:border-danger'}"
            title="Put back in the Inbox"
            onclick={() => ws.unmark(g.msgs.map((m) => m.id))}
          >
            <span class="font-mono text-[9px] {a === 'archive' ? 'text-brand' : 'text-danger'}"
              >{a === 'archive' ? 'ARCH' : 'DEL'}</span
            >
            <span class="max-w-[24ch] truncate">{senderName(g.from)}</span>
            <span class="rounded-full bg-black/40 px-1.5 font-mono text-[10px]">{g.msgs.length}</span>
            <span class="font-mono text-[10px] text-accent-dim group-hover:text-accent">×</span>
          </button>
        {:else}
          <span class="px-1 py-4 font-mono text-[11px] text-accent-dim">
            Nothing staged. Rows you archive or delete collect here as chips — click one to put it back.
          </span>
        {/each}
      </div>
    </div>
  </section>
</div>
