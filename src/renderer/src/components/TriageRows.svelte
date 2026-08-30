<script lang="ts">
  // The Inbox list: one row per sender band, expandable to messages.
  //
  // Selection follows the three-button model in lib/selection.ts — left toggles a row,
  // right selects the span back to the anchor, middle floods the contiguous run. The
  // checkbox is the state display, which is what makes unselecting legible.
  import type { EmailMsg, MarkAction, MarkedItem } from '../types'
  import { senderAddr, senderName } from '../lib/sender'
  import { flood, range, rowSelected, single, type Row } from '../lib/selection'

  type Band = { key: string; from: string; msgs: EmailMsg[] }
  type VRow = Row & { band: Band; msg?: EmailMsg; header: boolean }

  let {
    emails,
    selection,
    rules,
    onselect,
    onmark,
    onalways,
    formatDate = (d: string) => d
  }: {
    emails: EmailMsg[]
    selection: Set<string>
    rules: MarkedItem[]
    onselect: (next: Set<string>) => void
    onmark: (ids: string[], action: MarkAction) => void
    onalways: (from: string, action: MarkAction) => void
    formatDate?: (date: string) => string
  } = $props()

  let open = $state<Set<string>>(new Set())
  let anchor = $state<string | null>(null)

  const bands = $derived.by(() => {
    const by = new Map<string, Band>()
    for (const m of emails) {
      const key = senderAddr(m.from)
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    // Noisiest senders first: that is where the bulk decisions are.
    return [...by.values()].sort(
      (a, b) => b.msgs.length - a.msgs.length || a.key.localeCompare(b.key)
    )
  })

  const vrows = $derived.by(() => {
    const out: VRow[] = []
    for (const b of bands) {
      const expanded = b.msgs.length > 1 && open.has(b.key)
      if (expanded) {
        out.push({ key: 'h:' + b.key, ids: [], band: b, header: true })
        for (const m of b.msgs)
          out.push({ key: 'm:' + m.id, ids: [m.id], band: b, msg: m, header: false })
      } else {
        out.push({ key: 'b:' + b.key, ids: b.msgs.map((m) => m.id), band: b, header: false })
      }
    }
    return out
  })

  /** Rows the selection model may touch; expanded band headers are skipped. */
  const pickable = $derived(vrows.filter((r) => !r.header))
  const idxOf = (key: string): number => pickable.findIndex((r) => r.key === key)

  const ruleFor = (from: string): MarkedItem | undefined =>
    rules.find((r) => r.from.trim() && from.toLowerCase().includes(r.from.trim().toLowerCase()))

  function onLeft(key: string): void {
    const i = idxOf(key)
    if (i < 0) return
    onselect(single(pickable, i, selection))
    anchor = key
  }

  function onRight(e: MouseEvent, key: string): void {
    e.preventDefault()
    const i = idxOf(key)
    if (i < 0) return
    onselect(range(pickable, anchor ? idxOf(anchor) : -1, i, selection))
    anchor = key
  }

  function onMiddle(e: MouseEvent, key: string): void {
    if (e.button !== 1) return
    e.preventDefault()
    const i = idxOf(key)
    if (i < 0) return
    onselect(flood(pickable, i, selection))
    anchor = key
  }

  function toggleBand(k: string): void {
    const next = new Set(open)
    next.has(k) ? next.delete(k) : next.add(k)
    open = next
  }

  /** Act on the selection when the clicked row is part of it, else just that row. */
  const scope = (list: string[]): string[] =>
    selection.size && list.some((id) => selection.has(id)) ? [...selection] : list
</script>

{#snippet box(on: boolean, partial: boolean)}
  <span
    class="grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] leading-none {on
      ? 'border-brand bg-brand text-on-brand'
      : partial
        ? 'border-brand text-brand'
        : 'border-ink-dim/50 text-transparent'}"
  >
    {on ? '✓' : partial ? '–' : '·'}
  </span>
{/snippet}

{#snippet actions(list: string[], from: string, withAlways: boolean)}
  <span
    class="flex w-[24ch] shrink-0 items-center justify-end gap-1 opacity-0 group-hover:opacity-100"
  >
    <button
      class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-on-brand"
      title="Archive {list.length}"
      onclick={(e) => {
        e.stopPropagation()
        onmark(scope(list), 'archive')
      }}>A</button
    >
    <button
      class="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger hover:text-on-danger"
      title="Delete {list.length}"
      onclick={(e) => {
        e.stopPropagation()
        onmark(scope(list), 'trash')
      }}>D</button
    >
    {#if withAlways}
      <span class="mx-0.5 text-ink-dim">|</span>
      <button
        class="rounded bg-panel3 px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-on-brand"
        title="Always archive {senderAddr(from)}"
        onclick={(e) => {
          e.stopPropagation()
          onalways(from, 'archive')
        }}>ALWAYS A</button
      >
      <button
        class="rounded bg-panel3 px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger hover:text-on-danger"
        title="Always delete {senderAddr(from)}"
        onclick={(e) => {
          e.stopPropagation()
          onalways(from, 'trash')
        }}>ALWAYS D</button
      >
    {/if}
  </span>
{/snippet}

<div class="flex h-full min-h-0 flex-col">
  <div
    class="flex items-center gap-3 border-y border-line px-3 py-1.5 font-mono text-[10px] tracking-widest text-ink-dim"
  >
    <span class="w-4 shrink-0"></span>
    <span class="w-4 shrink-0"></span>
    <span class="w-[24ch] shrink-0">FROM</span>
    <span class="min-w-0 flex-1">SUBJECT</span>
    <span class="w-[17ch] shrink-0 whitespace-nowrap text-right">DATE</span>
    <span class="w-[24ch] shrink-0 text-right">THIS / ALWAYS</span>
  </div>

  <div class="min-h-0 flex-1 select-none overflow-y-auto">
    {#each vrows as r (r.key)}
      {#if r.header}
        <div
          class="group flex items-center gap-3 border-b border-l-2 border-line border-l-transparent bg-panel pr-3 text-sm"
        >
          <span class="w-4 shrink-0 pl-3"></span>
          <button
            class="w-4 shrink-0 font-mono text-[10px] text-ink-dim"
            onclick={() => toggleBand(r.band.key)}>▾</button
          >
          <span class="w-[24ch] shrink-0 truncate py-2 font-semibold">
            {senderName(r.band.from)}
            <span class="ml-1 rounded bg-panel3 px-1.5 font-mono text-[10px]"
              >{r.band.msgs.length}</span
            >
          </span>
          <span class="min-w-0 flex-1 truncate text-ink-dim">expanded — pick messages below</span>
          <span class="w-[17ch] shrink-0"></span>
          {@render actions(
            r.band.msgs.map((m) => m.id),
            r.band.from,
            true
          )}
        </div>
      {:else}
        {@const on = rowSelected(r, selection)}
        {@const some = !on && r.ids.some((id) => selection.has(id))}
        {@const multi = !r.msg && r.band.msgs.length > 1}
        {@const rule = ruleFor(r.band.from)}
        <div
          class="group flex items-center gap-3 border-b border-l-2 border-line pr-3 text-sm {on ||
          some
            ? 'border-l-brand bg-brand/10'
            : 'border-l-transparent hover:bg-panel2'} {multi && !(on || some)
            ? 'bg-panel'
            : ''} {r.msg && !(on || some) ? 'bg-panel/60' : ''}"
          role="row"
          tabindex="-1"
          onclick={() => onLeft(r.key)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onLeft(r.key)
            }
          }}
          oncontextmenu={(e) => onRight(e, r.key)}
          onmousedown={(e) => e.button === 1 && e.preventDefault()}
          onauxclick={(e) => onMiddle(e, r.key)}
        >
          <span class="pl-3">{@render box(on, some)}</span>
          <button
            class="w-4 shrink-0 font-mono text-[10px] text-ink-dim"
            onclick={(e) => {
              e.stopPropagation()
              if (multi) toggleBand(r.band.key)
            }}
          >
            {multi ? '▸' : ''}
          </button>
          <span class="w-[24ch] shrink-0 truncate py-2 font-semibold">
            {#if r.msg}
              <span class="text-ink-dim">·</span>
            {:else}
              {senderName(r.band.from)}
              {#if multi}<span class="ml-1 rounded bg-panel3 px-1.5 font-mono text-[10px]"
                  >{r.band.msgs.length}</span
                >{/if}
              {#if rule}<span
                  class="ml-1 font-mono text-[9px] {rule.action === 'archive'
                    ? 'text-brand'
                    : 'text-danger'}">RULE</span
                >{/if}
            {/if}
          </span>
          <span class="min-w-0 flex-1 truncate {multi ? 'text-ink-dim' : ''}">
            {r.msg
              ? r.msg.subject
              : multi
                ? r.band.msgs.length + ' messages — ' + r.band.msgs[0].subject
                : r.band.msgs[0].subject}
          </span>
          <span
            class="w-[17ch] shrink-0 whitespace-nowrap text-right font-mono text-[10px] text-ink-dim"
            >{formatDate((r.msg ?? r.band.msgs[0]).date)}</span
          >
          {@render actions(r.ids, r.band.from, !r.msg)}
        </div>
      {/if}
    {:else}
      <div class="px-3 py-16 text-center text-sm text-ink-dim">
        Nothing left undecided in the Inbox.
      </div>
    {/each}
  </div>

  <div
    class="flex items-center gap-4 border-t border-line px-3 py-1.5 font-mono text-[10px] text-ink-dim"
  >
    <span><b class="text-ink">left</b> select</span>
    <span><b class="text-ink">right</b> range from last click</span>
    <span><b class="text-ink">middle</b> fill / clear the run</span>
  </div>
</div>
