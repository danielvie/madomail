<script lang="ts">
  // PROTOTYPE — Variant 4: Digest.
  // Premise: most Inbox rows are noise that never deserved a row. Group by day, and
  // fold everything a rule already covers into a single summary line per day.
  import type { EmailMsg } from '../../types'
  import { ws } from '../store.svelte'
  import { dayOf, senderName } from '../fixtures'

  type Day = { day: string; kept: EmailMsg[]; noise: EmailMsg[] }

  const days = $derived.by(() => {
    const by = new Map<string, Day>()
    for (const m of ws.filtered) {
      const d = dayOf(m.date)
      if (!by.has(d)) by.set(d, { day: d, kept: [], noise: [] })
      const bucket = by.get(d)!
      if (ws.ruleFor(m.from)) bucket.noise.push(m)
      else bucket.kept.push(m)
    }
    const at = (d: string): number => Date.parse(d + ' 2026')
    return [...by.values()].sort((a, b) => at(b.day) - at(a.day))
  })

  let expanded = $state<Set<string>>(new Set())
  const toggleDay = (d: string): void => {
    const next = new Set(expanded)
    next.has(d) ? next.delete(d) : next.add(d)
    expanded = next
  }
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center gap-3 border-b border-white/5 px-8 py-5">
    <h1 class="text-xl font-semibold">Digest</h1>
    <span class="font-mono text-xs text-accent-dim">
      {ws.filtered.length} messages · {days.length} days
    </span>
    <input
      class="ml-auto w-64 rounded-full bg-surface px-4 py-1.5 text-sm outline-none placeholder:text-accent-dim"
      placeholder="Search..."
      bind:value={ws.search}
    />
    <button
      class="rounded-full bg-brand px-4 py-1.5 font-mono text-xs text-black disabled:opacity-30"
      disabled={ws.markedCount === 0}
      onclick={() => ws.applyAll()}>APPLY {ws.markedCount || ''}</button
    >
  </header>

  <div class="min-h-0 flex-1 overflow-y-auto px-8 pb-24">
    {#each days as d (d.day)}
      <section class="border-b border-white/5 py-6">
        <div class="mb-3 flex items-baseline gap-3">
          <h2 class="font-mono text-sm tracking-widest text-brand">{d.day.toUpperCase()}</h2>
          <span class="font-mono text-[11px] text-accent-dim">
            {d.kept.length} to read · {d.noise.length} covered by rules
          </span>
        </div>

        {#if d.noise.length}
          <div class="mb-3 rounded-lg border border-white/5 bg-surface/50 px-4 py-2.5">
            <button
              class="flex w-full items-center gap-3 text-left"
              onclick={() => toggleDay(d.day)}
            >
              <span class="font-mono text-[11px] text-accent-dim">
                {expanded.has(d.day) ? '▾' : '▸'}
                {d.noise.length} messages matched by your sender rules
              </span>
              <span class="ml-auto flex gap-2">
                <span
                  class="rounded px-2 py-0.5 font-mono text-[10px] text-black"
                  style="background:#d6ff00"
                >
                  {d.noise.filter((m) => ws.ruleFor(m.from)?.action === 'archive').length} archive
                </span>
                <span class="rounded bg-danger px-2 py-0.5 font-mono text-[10px]">
                  {d.noise.filter((m) => ws.ruleFor(m.from)?.action === 'trash').length} delete
                </span>
              </span>
            </button>
            {#if expanded.has(d.day)}
              <ul class="mt-2 space-y-1 border-t border-white/5 pt-2">
                {#each d.noise as m (m.id)}
                  <li class="flex gap-3 text-xs text-accent-dim">
                    <span class="w-40 shrink-0 truncate">{senderName(m.from)}</span>
                    <span class="min-w-0 flex-1 truncate">{m.subject}</span>
                    <button class="hover:text-accent" onclick={() => ws.unmark([m.id])}>keep</button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        {/if}

        <ul class="space-y-2">
          {#each d.kept as m (m.id)}
            {@const a = ws.marks[m.id]}
            <li
              class="group flex items-start gap-4 rounded-lg px-4 py-3 hover:bg-surface {a
                ? 'opacity-40'
                : ''}"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline gap-2">
                  <span class="truncate text-sm font-semibold">{senderName(m.from)}</span>
                  <span class="font-mono text-[10px] text-accent-dim">{m.date.split(', ')[1]}</span>
                  {#if a}
                    <span
                      class="font-mono text-[10px] {a === 'archive' ? 'text-brand' : 'text-danger'}"
                      >{a}</span
                    >
                  {/if}
                </div>
                <div class="truncate text-sm">{m.subject}</div>
                <div class="truncate text-xs text-accent-dim">{m.snippet}</div>
              </div>
              <div class="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  class="rounded px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-black"
                  onclick={() => ws.mark([m.id], 'archive')}>ARCHIVE</button
                >
                <button
                  class="rounded px-2 py-1 font-mono text-[10px] hover:bg-danger"
                  onclick={() => ws.mark([m.id], 'trash')}>DELETE</button
                >
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </div>
</div>
