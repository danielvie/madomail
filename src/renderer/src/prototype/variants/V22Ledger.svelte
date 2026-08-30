<script lang="ts">
  // PROTOTYPE — Variant 22: Ledger. (17 + 20, plus the three-button selection)
  // 17 was the right information in too much space; 20 was the right space carrying too
  // little information. This is the same narrow column as 20, but every line does four
  // jobs at once: a tinted bar whose length *is* the count (the shape you could read at
  // a glance in 20), the sender's name, the action, and where it came from — rule or
  // hand. One line per sender-and-action, ~22px, undo on the line itself.
  import type { EmailMsg } from '../../types'
  import { ws } from '../store.svelte'
  import TriageRows from '../TriageRows.svelte'
  import { senderAddr, senderName } from '../fixtures'

  type Line = { key: string; from: string; action: 'archive' | 'trash'; msgs: EmailMsg[]; byRule: boolean }

  const lines = $derived.by(() => {
    const by = new Map<string, Line>()
    for (const m of ws.inbox) {
      const action = ws.marks[m.id]
      if (!action) continue
      const key = senderAddr(m.from) + ':' + action
      if (!by.has(key))
        by.set(key, { key, from: m.from, action, msgs: [], byRule: !!ws.ruleFor(m.from) })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()].sort(
      (a, b) => a.action.localeCompare(b.action) || b.msgs.length - a.msgs.length
    )
  })

  const staged = $derived(ws.markedCount)
  const nArchive = $derived(Object.values(ws.marks).filter((a) => a === 'archive').length)
  const nTrash = $derived(staged - nArchive)
  let hover = $state<string | null>(null)
  const hovered = $derived(lines.find((l) => l.key === hover))
</script>

<div class="relative grid h-full grid-cols-[minmax(0,1fr)_250px] divide-x divide-white/5">
  <TriageRows />

  <aside class="flex min-h-0 flex-col bg-black/45">
    <!-- summary: the whole batch in three numbers and one bar -->
    <div class="px-3 py-2">
      <div class="flex items-baseline gap-2">
        <span class="text-xl leading-none">{staged}</span>
        <span class="font-mono text-[10px] tracking-widest text-accent-dim">STAGED</span>
        <span class="ml-auto font-mono text-[10px] text-accent-dim">
          {lines.length}
          {lines.length === 1 ? 'group' : 'groups'}
        </span>
      </div>
      <div class="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-surface">
        <div class="bg-brand" style="width:{(nArchive / Math.max(1, staged)) * 100}%"></div>
        <div class="bg-danger" style="width:{(nTrash / Math.max(1, staged)) * 100}%"></div>
      </div>
      <div class="mt-1 flex gap-3 font-mono text-[10px]">
        <span class="text-brand">{nArchive} archive</span>
        <span class="text-danger">{nTrash} delete</span>
        {#if staged}
          <button
            class="ml-auto text-accent-dim hover:text-accent"
            onclick={() => ws.unmarkAll()}>clear</button
          >
        {/if}
      </div>
    </div>

    <!-- one dense line per sender+action -->
    <ul class="min-h-0 flex-1 overflow-y-auto border-t border-white/5">
      {#each lines as l (l.key)}
        {@const colour = l.action === 'archive' ? '#d6ff00' : '#ff3333'}
        <li>
          <button
            class="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-surface"
            onmouseenter={() => (hover = l.key)}
            onmouseleave={() => (hover = null)}
            onclick={() => ws.unmark(l.msgs.map((m) => m.id))}
            title="{l.msgs.length} from {senderName(l.from)} — click to put back"
          >
            <!-- the bar's length is the count: the batch shape, still readable -->
            <span class="flex h-3 w-14 shrink-0 items-center gap-px">
              {#each { length: Math.min(l.msgs.length, 10) } as _}
                <span
                  class="h-3 w-1 shrink-0 rounded-[1px]"
                  style="background:{colour};opacity:{hover === l.key ? 1 : 0.6}"
                ></span>
              {/each}
              {#if l.msgs.length > 10}
                <span class="ml-0.5 font-mono text-[8px]" style="color:{colour}">+</span>
              {/if}
            </span>
            <span class="min-w-0 flex-1 truncate text-[11px]">{senderName(l.from)}</span>
            {#if l.byRule}
              <span class="shrink-0 font-mono text-[8px] text-accent-dim">RULE</span>
            {/if}
            <span class="w-5 shrink-0 text-right font-mono text-[10px]">{l.msgs.length}</span>
            <span class="w-2 shrink-0 font-mono text-[10px] text-accent-dim">×</span>
          </button>
        </li>
      {:else}
        <li class="px-3 py-8 text-center font-mono text-[10px] leading-relaxed text-accent-dim">
          Nothing staged.<br />Each archive or delete adds one line here.
        </li>
      {/each}
    </ul>

    <div class="border-t border-white/10 p-2">
      <button
        class="w-full rounded-md bg-brand py-2 font-mono text-[11px] text-black disabled:opacity-30"
        disabled={staged === 0}
        onclick={() => ws.applyAll()}
      >
        APPLY {nArchive}A / {nTrash}D
      </button>
    </div>
  </aside>

  {#if hovered}
    <div
      class="pointer-events-none absolute bottom-14 right-[260px] z-30 max-w-sm rounded-lg border border-white/15 bg-surface p-3 shadow-2xl"
    >
      <div class="flex items-baseline gap-2">
        <span class="text-sm font-semibold">{senderName(hovered.from)}</span>
        <span
          class="font-mono text-[10px] {hovered.action === 'archive' ? 'text-brand' : 'text-danger'}"
          >{hovered.action}</span
        >
        <span class="ml-auto font-mono text-[10px] text-accent-dim">{hovered.msgs.length}</span>
      </div>
      <ul class="mt-2 space-y-0.5">
        {#each hovered.msgs.slice(0, 6) as m (m.id)}
          <li class="truncate text-xs text-accent-dim">{m.subject}</li>
        {/each}
        {#if hovered.msgs.length > 6}
          <li class="font-mono text-[10px] text-accent-dim">+{hovered.msgs.length - 6} more</li>
        {/if}
      </ul>
    </div>
  {/if}
</div>
