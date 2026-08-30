<script lang="ts">
  // PROTOTYPE — shared list used by variants 16-20.
  // Round three tests staging areas, so the list is held constant: it is variant 12's
  // sender bands (graded 8) with two fixes from the round-two feedback —
  //  * selection is an explicit checkbox, never background colour alone (11 scored 7
  //    because unselecting gave no confirmation), plus a redundant left border;
  //  * every row carries 13's "A D | ALWAYS A ALWAYS D" control, which was the part
  //    of 13 worth keeping.
  import type { EmailMsg, MarkAction } from '../types'
  import { ws } from './store.svelte'
  import { senderAddr, senderName } from './fixtures'

  type Band = { key: string; from: string; msgs: EmailMsg[] }
  let { showHeader = true }: { showHeader?: boolean } = $props()

  const bands = $derived.by(() => {
    const by = new Map<string, Band>()
    for (const m of ws.filtered) {
      if (ws.marks[m.id]) continue
      const key = senderAddr(m.from)
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()].sort(
      (a, b) => b.msgs.length - a.msgs.length || a.key.localeCompare(b.key)
    )
  })

  let open = $state<Set<string>>(new Set())
  const sel = $derived(ws.selection)
  const ids = (b: Band): string[] => b.msgs.map((m) => m.id)

  function toggleBand(k: string): void {
    const next = new Set(open)
    next.has(k) ? next.delete(k) : next.add(k)
    open = next
  }

  function setSel(list: string[], on: boolean): void {
    const next = new Set(sel)
    for (const id of list) (on ? next.add(id) : next.delete(id))
    ws.selection = next
  }

  const bandState = (b: Band): 'all' | 'some' | 'none' => {
    const n = ids(b).filter((id) => sel.has(id)).length
    return n === 0 ? 'none' : n === ids(b).length ? 'all' : 'some'
  }

  /** Act on the selection when the clicked row is part of it, else just that row. */
  const scope = (list: string[]): string[] =>
    sel.size && list.some((id) => sel.has(id)) ? [...sel] : list

  function always(from: string, action: MarkAction): void {
    ws.addRule(from, action)
    const key = senderAddr(from)
    ws.mark(
      ws.inbox.filter((m) => senderAddr(m.from) === key && !ws.marks[m.id]).map((m) => m.id),
      action,
      true
    )
  }
</script>

{#snippet check(on: boolean, partial: boolean, onclick: () => void, label: string)}
  <button
    class="grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] leading-none transition-colors {on
      ? 'border-brand bg-brand text-black'
      : partial
        ? 'border-brand text-brand'
        : 'border-white/25 text-transparent hover:border-white/60'}"
    aria-label={label}
    {onclick}
  >
    {on ? '✓' : partial ? '–' : '·'}
  </button>
{/snippet}

<div class="flex h-full min-h-0 flex-col">
  {#if showHeader}
    <div class="flex items-center gap-2 px-3 py-2">
      <input
        class="w-56 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
        placeholder="Filter..."
        bind:value={ws.search}
      />
      <button
        class="rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[10px] hover:bg-surface-hover"
        onclick={() => ws.runQuery()}>RUN QUERY</button
      >
      <span class="font-mono text-[11px] text-accent-dim">
        {bands.length} senders · {bands.reduce((n, b) => n + b.msgs.length, 0)} undecided
      </span>
      {#if sel.size}
        <span class="ml-auto flex items-center gap-2">
          <span class="font-mono text-[11px] text-brand">{sel.size} selected</span>
          <button
            class="rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-black"
            onclick={() => ws.mark([...sel], 'archive')}>ARCHIVE</button
          >
          <button
            class="rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-danger"
            onclick={() => ws.mark([...sel], 'trash')}>DELETE</button
          >
          <button
            class="font-mono text-[10px] text-accent-dim hover:text-accent"
            onclick={() => (ws.selection = new Set())}>clear</button
          >
        </span>
      {/if}
    </div>
  {/if}

  <div
    class="flex items-center gap-3 border-y border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim"
  >
    <span class="w-4 shrink-0"></span>
    <span class="w-4 shrink-0"></span>
    <span class="w-[26ch] shrink-0">FROM</span>
    <span class="min-w-0 flex-1">SUBJECT</span>
    <span class="w-[17ch] shrink-0 whitespace-nowrap text-right">DATE</span>
    <span class="w-[24ch] shrink-0 text-right">THIS / ALWAYS</span>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto">
    {#each bands as b (b.key)}
      {@const multi = b.msgs.length > 1}
      {@const st = bandState(b)}
      {@const rule = ws.ruleFor(b.from)}
      <div
        class="group flex items-center gap-3 border-b border-white/5 border-l-2 pr-3 text-sm {st ===
        'none'
          ? 'border-l-transparent hover:bg-surface'
          : 'border-l-brand bg-brand/10'} {multi ? 'bg-surface/40' : ''}"
      >
        <span class="pl-3">
          {@render check(st === 'all', st === 'some', () => setSel(ids(b), st !== 'all'), 'Select ' + senderName(b.from))}
        </span>
        <button
          class="w-4 shrink-0 font-mono text-[10px] text-accent-dim"
          onclick={() => multi && toggleBand(b.key)}
        >
          {multi ? (open.has(b.key) ? '▾' : '▸') : ''}
        </button>
        <span class="w-[26ch] shrink-0 truncate py-2 font-semibold">
          {senderName(b.from)}
          {#if multi}<span class="ml-1 rounded bg-surface-active px-1.5 font-mono text-[10px]"
              >{b.msgs.length}</span
            >{/if}
          {#if rule}<span
              class="ml-1 font-mono text-[9px]"
              style="color:{rule.action === 'archive' ? '#d6ff00' : '#ff3333'}">RULE</span
            >{/if}
        </span>
        <span class="min-w-0 flex-1 truncate {multi ? 'text-accent-dim' : ''}">
          {multi ? b.msgs.length + ' messages — ' + b.msgs[0].subject : b.msgs[0].subject}
        </span>
        <span class="w-[17ch] shrink-0 whitespace-nowrap text-right font-mono text-[10px] text-accent-dim"
          >{b.msgs[0].date}</span
        >
        <span
          class="flex w-[24ch] shrink-0 items-center justify-end gap-1 opacity-0 group-hover:opacity-100"
        >
          <button
            class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
            title="Archive {b.msgs.length}"
            onclick={() => ws.mark(scope(ids(b)), 'archive')}>A</button
          >
          <button
            class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
            title="Delete {b.msgs.length}"
            onclick={() => ws.mark(scope(ids(b)), 'trash')}>D</button
          >
          <span class="mx-0.5 text-accent-dim">|</span>
          <button
            class="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
            title="Always archive {senderAddr(b.from)}"
            onclick={() => always(b.from, 'archive')}>ALWAYS A</button
          >
          <button
            class="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
            title="Always delete {senderAddr(b.from)}"
            onclick={() => always(b.from, 'trash')}>ALWAYS D</button
          >
        </span>
      </div>

      {#if multi && open.has(b.key)}
        {#each b.msgs as m (m.id)}
          <div
            class="group flex items-center gap-3 border-b border-white/5 border-l-2 bg-black/30 pr-3 text-sm {sel.has(
              m.id
            )
              ? 'border-l-brand bg-brand/10'
              : 'border-l-transparent hover:bg-surface'}"
          >
            <span class="pl-3">
              {@render check(sel.has(m.id), false, () => setSel([m.id], !sel.has(m.id)), 'Select message')}
            </span>
            <span class="w-4 shrink-0"></span>
            <span class="w-[26ch] shrink-0"></span>
            <span class="min-w-0 flex-1 truncate py-1.5">{m.subject}</span>
            <span class="w-[17ch] shrink-0 whitespace-nowrap text-right font-mono text-[10px] text-accent-dim"
              >{m.date}</span
            >
            <span class="flex w-[24ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
              <button
                class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                onclick={() => ws.mark(scope([m.id]), 'archive')}>A</button
              >
              <button
                class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
                onclick={() => ws.mark(scope([m.id]), 'trash')}>D</button
              >
            </span>
          </div>
        {/each}
      {/if}
    {:else}
      <div class="px-3 py-16 text-center text-sm text-accent-dim">
        Nothing left undecided in the Inbox.
      </div>
    {/each}
  </div>
</div>
