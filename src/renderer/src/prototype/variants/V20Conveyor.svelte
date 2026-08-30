<script lang="ts">
  // PROTOTYPE — Variant 20: Conveyor. (staging study 5 of 5)
  // Staging idea: staging as a lane you can watch fill. A narrow rail down the right
  // edge holds one tile per staged message, newest at the top, tinted by action and
  // clustered by sender — so the shape of the pending batch is readable at a glance
  // even at 200 messages, without reading a single word. Hover a cluster to see it,
  // click to put it back. The rail doubles as the Apply button.
  import type { EmailMsg } from '../../types'
  import { ws } from '../store.svelte'
  import TriageList from '../TriageList.svelte'
  import { senderAddr, senderName } from '../fixtures'

  type Cluster = { key: string; from: string; msgs: EmailMsg[] }

  const staged = $derived(ws.inbox.filter((m) => ws.marks[m.id]))
  const clusters = $derived.by(() => {
    const by = new Map<string, Cluster>()
    for (const m of staged) {
      const key = senderAddr(m.from) + ':' + ws.marks[m.id]
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()]
  })

  let hover = $state<string | null>(null)
  const hovered = $derived(clusters.find((c) => c.key === hover))
  const nArchive = $derived(staged.filter((m) => ws.marks[m.id] === 'archive').length)
</script>

<div class="relative grid h-full grid-cols-[minmax(0,1fr)_92px] divide-x divide-white/5">
  <TriageList />

  <!-- the conveyor -->
  <aside class="relative flex min-h-0 flex-col bg-black/50">
    <div class="px-2 py-2 text-center">
      <div class="font-mono text-[9px] tracking-widest text-accent-dim">STAGED</div>
      <div class="mt-0.5 text-xl leading-none">{staged.length}</div>
      <div class="mt-1 flex justify-center gap-1.5 font-mono text-[9px]">
        <span class="text-brand">{nArchive}</span>
        <span class="text-accent-dim">/</span>
        <span class="text-danger">{staged.length - nArchive}</span>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
      <div class="flex flex-col gap-1.5">
        {#each clusters as c (c.key)}
          {@const a = ws.marks[c.msgs[0].id]}
          <button
            class="flex flex-col gap-px rounded-md border p-1 transition-all {hover === c.key
              ? a === 'archive'
                ? 'border-brand bg-brand/20'
                : 'border-danger bg-danger/20'
              : 'border-white/8 hover:border-white/25'}"
            title="{c.msgs.length} from {senderName(c.from)} — click to put back"
            onmouseenter={() => (hover = c.key)}
            onmouseleave={() => (hover = null)}
            onclick={() => ws.unmark(c.msgs.map((m) => m.id))}
          >
            {#each c.msgs as m (m.id)}
              <span
                class="h-2 w-full rounded-[2px]"
                style="background:{a === 'archive' ? '#d6ff00' : '#ff3333'};opacity:{hover === c.key
                  ? 1
                  : 0.55}"
              ></span>
            {/each}
            <span class="mt-0.5 truncate font-mono text-[8px] text-accent-dim">
              {senderName(c.from)}
            </span>
          </button>
        {:else}
          <div class="px-1 py-6 text-center font-mono text-[9px] leading-relaxed text-accent-dim">
            staged mail stacks up here
          </div>
        {/each}
      </div>
    </div>

    <button
      class="m-2 rounded-md bg-brand py-3 font-mono text-[10px] leading-tight text-black disabled:opacity-30"
      disabled={staged.length === 0}
      onclick={() => ws.applyAll()}
    >
      APPLY<br />{staged.length}
    </button>
    <button
      class="mx-2 mb-2 font-mono text-[9px] text-accent-dim hover:text-accent disabled:opacity-30"
      disabled={staged.length === 0}
      onclick={() => ws.unmarkAll()}>clear</button
    >
  </aside>

  <!-- peek for the hovered cluster, so the rail stays narrow -->
  {#if hovered}
    <div
      class="pointer-events-none absolute bottom-4 right-28 z-30 max-w-sm rounded-lg border border-white/15 bg-surface p-3 shadow-2xl"
    >
      <div class="flex items-baseline gap-2">
        <span class="text-sm font-semibold">{senderName(hovered.from)}</span>
        <span
          class="font-mono text-[10px] {ws.marks[hovered.msgs[0].id] === 'archive'
            ? 'text-brand'
            : 'text-danger'}">{ws.marks[hovered.msgs[0].id]}</span
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
      <div class="mt-2 font-mono text-[9px] text-accent-dim">click to put back in the Inbox</div>
    </div>
  {/if}
</div>
