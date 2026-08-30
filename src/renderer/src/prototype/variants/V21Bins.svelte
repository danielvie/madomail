<script lang="ts">
  // PROTOTYPE — Variant 21: Bins. (16, graded 9, plus the three-button selection)
  // Unchanged from 16: two named bins, always on screen, grouped by sender, and an
  // Apply that spells out both counts. Tightened only where 16 wasted room — the bins
  // now size to their contents and show a per-bin sender count on the header line.
  import type { EmailMsg, MarkAction } from '../../types'
  import { ws } from '../store.svelte'
  import TriageRows from '../TriageRows.svelte'
  import { senderAddr, senderName } from '../fixtures'

  type Group = { key: string; from: string; msgs: EmailMsg[] }

  const groupsFor = (action: MarkAction): Group[] => {
    const by = new Map<string, Group>()
    for (const m of ws.inbox) {
      if (ws.marks[m.id] !== action) continue
      const key = senderAddr(m.from)
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length)
  }

  const archive = $derived(groupsFor('archive'))
  const trash = $derived(groupsFor('trash'))
  const total = $derived(ws.markedCount)
  const count = (g: Group[]): number => g.reduce((n, x) => n + x.msgs.length, 0)
</script>

<div class="grid h-full grid-cols-[minmax(0,1fr)_330px] divide-x divide-white/5">
  <TriageRows />

  <aside class="flex min-h-0 flex-col bg-black/40">
    <div class="flex items-baseline gap-2 px-3 py-2">
      <span class="font-mono text-[11px] tracking-widest text-accent-dim">STAGING</span>
      <span class="font-mono text-[11px] text-accent-dim">{total} pending</span>
      <button
        class="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
        disabled={total === 0}
        onclick={() => ws.unmarkAll()}>empty both</button
      >
    </div>

    {#snippet bin(title: string, colour: string, groups: Group[])}
      <div class="flex min-h-0 flex-1 flex-col">
        <div
          class="flex items-center gap-2 border-y border-white/5 px-3 py-1.5"
          style="background:{colour}12"
        >
          <span class="size-2 rounded-full" style="background:{colour}"></span>
          <span class="font-mono text-[11px] tracking-widest" style="color:{colour}">{title}</span>
          <span class="font-mono text-[10px] text-accent-dim">
            {groups.length}
            {groups.length === 1 ? 'sender' : 'senders'}
          </span>
          <span class="ml-auto font-mono text-sm">{count(groups)}</span>
        </div>
        <ul class="min-h-0 flex-1 overflow-y-auto">
          {#each groups as g (g.key)}
            <li class="group flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-surface">
              <span class="min-w-0 flex-1 truncate">
                {senderName(g.from)}
                {#if g.msgs.length === 1}
                  <span class="text-accent-dim"> — {g.msgs[0].subject}</span>
                {/if}
              </span>
              {#if g.msgs.length > 1}
                <span class="shrink-0 rounded bg-surface-active px-1.5 font-mono text-[10px]"
                  >{g.msgs.length}</span
                >
              {/if}
              <button
                class="shrink-0 font-mono text-[10px] text-accent-dim opacity-0 group-hover:opacity-100 hover:text-accent"
                title="Put back in the Inbox"
                onclick={() => ws.unmark(g.msgs.map((m) => m.id))}>put back</button
              >
            </li>
          {:else}
            <li class="px-3 py-6 text-center font-mono text-[10px] text-accent-dim">empty</li>
          {/each}
        </ul>
      </div>
    {/snippet}

    {@render bin('TO ARCHIVE', '#d6ff00', archive)}
    {@render bin('TO DELETE', '#ff3333', trash)}

    <div class="border-t border-white/10 p-3">
      <button
        class="w-full rounded-md bg-brand py-2.5 font-mono text-[11px] text-black disabled:opacity-30"
        disabled={total === 0}
        onclick={() => ws.applyAll()}
      >
        APPLY — {count(archive)} ARCHIVE, {count(trash)} DELETE
      </button>
    </div>
  </aside>
</div>
