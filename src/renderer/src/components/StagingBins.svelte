<script lang="ts">
  // Staging: two named bins so Archive and Delete never mix, one dense line per sender
  // (bar length = count), a hover peek that tracks the line, and an explicit put-back
  // control — the line itself is inert, so nothing is undone by a stray click.
  import type { EmailMsg, MarkAction, MarkedItem } from '../types'
  import { senderAddr, senderName } from '../lib/sender'

  type Line = { key: string; from: string; msgs: EmailMsg[]; byRule: boolean }

  let {
    emails,
    marks,
    rules,
    busy = false,
    onunmark,
    onunmarkall,
    onapply
  }: {
    emails: EmailMsg[]
    marks: Record<string, MarkAction>
    rules: MarkedItem[]
    busy?: boolean
    onunmark: (ids: string[]) => void
    onunmarkall: () => void
    onapply: () => void
  } = $props()

  const ruleFor = (from: string): MarkedItem | undefined =>
    rules.find((r) => r.from.trim() && from.toLowerCase().includes(r.from.trim().toLowerCase()))

  const linesFor = (action: MarkAction): Line[] => {
    const by = new Map<string, Line>()
    for (const m of emails) {
      if (marks[m.id] !== action) continue
      const key = senderAddr(m.from)
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [], byRule: !!ruleFor(m.from) })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length)
  }

  const archive = $derived(linesFor('archive'))
  const trash = $derived(linesFor('trash'))
  const total = $derived(Object.keys(marks).length)
  const count = (ls: Line[]): number => ls.reduce((n, l) => n + l.msgs.length, 0)

  let hover = $state<string | null>(null)
  let hoverY = $state(0)
  const hovered = $derived([...archive, ...trash].find((l) => l.key + ':' + marks[l.msgs[0].id] === hover))

  function peek(e: MouseEvent, key: string): void {
    hover = key
    hoverY = (e.currentTarget as HTMLElement).getBoundingClientRect().top
  }
</script>

<aside class="relative flex min-h-0 flex-col bg-panel">
  <div class="flex items-baseline gap-2 px-3 py-2">
    <span class="font-mono text-[11px] tracking-widest text-ink-dim">STAGING</span>
    <span class="font-mono text-[11px] text-ink-dim">{total} pending</span>
    <button
      class="ml-auto font-mono text-[10px] text-ink-dim hover:text-ink disabled:opacity-30"
      disabled={total === 0}
      onclick={onunmarkall}>empty both</button
    >
  </div>

  {#snippet bin(title: string, action: MarkAction, ls: Line[])}
    <!-- Tailwind scans literal strings, so the tone classes are spelled out. -->
    {@const isArchive = action === 'archive'}
    {@const dot = isArchive ? 'bg-brand' : 'bg-danger'}
    {@const label = isArchive ? 'text-brand' : 'text-danger'}
    <div class="flex min-h-0 flex-1 flex-col">
      <div
        class="flex items-center gap-2 border-y border-line px-3 py-1.5 {action === 'archive'
          ? 'bg-brand/10'
          : 'bg-danger/10'}"
      >
        <span class="size-2 shrink-0 rounded-full {dot}"></span>
        <span class="font-mono text-[11px] tracking-widest {label}">{title}</span>
        <span class="font-mono text-[10px] text-ink-dim">
          {ls.length}
          {ls.length === 1 ? 'sender' : 'senders'}
        </span>
        <span class="ml-auto font-mono text-sm">{count(ls)}</span>
      </div>

      <ul class="min-h-0 flex-1 overflow-y-auto">
        {#each ls as l (l.key)}
          {@const k = l.key + ':' + action}
          <li
            class="flex items-center gap-2 px-2 py-1 {hover === k ? 'bg-panel2' : ''}"
            onmouseenter={(e) => peek(e, k)}
            onmouseleave={() => (hover = null)}
          >
            <span class="flex h-3 w-12 shrink-0 items-center gap-px">
              {#each { length: Math.min(l.msgs.length, 9) } as _}
                <span
                  class="h-3 w-1 shrink-0 rounded-[1px] {dot} {hover === k
                    ? 'opacity-100'
                    : 'opacity-60'}"
                ></span>
              {/each}
              {#if l.msgs.length > 9}
                <span class="ml-0.5 font-mono text-[8px] {label}">+</span>
              {/if}
            </span>
            <span class="min-w-0 flex-1 truncate text-[11px]">{senderName(l.from)}</span>
            {#if l.byRule}
              <span class="shrink-0 font-mono text-[8px] text-ink-dim">RULE</span>
            {/if}
            <span class="w-5 shrink-0 text-right font-mono text-[10px]">{l.msgs.length}</span>
            <button
              class="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] text-ink-dim hover:bg-panel3 hover:text-ink"
              title="Put {l.msgs.length} back in the Inbox"
              onclick={() => onunmark(l.msgs.map((m) => m.id))}>↩</button
            >
          </li>
        {:else}
          <li class="px-3 py-5 text-center font-mono text-[10px] text-ink-dim">empty</li>
        {/each}
      </ul>
    </div>
  {/snippet}

  {@render bin('TO ARCHIVE', 'archive', archive)}
  {@render bin('TO DELETE', 'trash', trash)}

  <div class="border-t border-line p-3">
    <button
      class="w-full rounded-md bg-brand py-2.5 font-mono text-[11px] text-on-brand disabled:opacity-30"
      disabled={total === 0 || busy}
      onclick={onapply}
    >
      {busy ? 'APPLYING…' : `APPLY — ${count(archive)} ARCHIVE, ${count(trash)} DELETE`}
    </button>
  </div>

  {#if hovered}
    {@const a = marks[hovered.msgs[0].id]}
    <div
      class="pointer-events-none fixed right-[310px] z-30 w-80 rounded-lg border border-line bg-panel p-3 shadow-2xl"
      style="top:{Math.min(Math.max(hoverY - 8, 8), window.innerHeight - 220)}px"
    >
      <div class="flex items-baseline gap-2">
        <span class="min-w-0 truncate text-sm font-semibold">{senderName(hovered.from)}</span>
        <span class="font-mono text-[10px] {a === 'archive' ? 'text-brand' : 'text-danger'}"
          >{a === 'archive' ? 'archive' : 'delete'}</span
        >
        <span class="ml-auto shrink-0 font-mono text-[10px] text-ink-dim">{hovered.msgs.length}</span>
      </div>
      <div class="mt-0.5 truncate font-mono text-[10px] text-ink-dim">
        {senderAddr(hovered.from)}
      </div>
      <ul class="mt-2 space-y-1 border-t border-line pt-2">
        {#each hovered.msgs.slice(0, 6) as m (m.id)}
          <li>
            <div class="truncate text-xs">{m.subject}</div>
            <div class="truncate text-[11px] text-ink-dim">{m.snippet}</div>
          </li>
        {/each}
        {#if hovered.msgs.length > 6}
          <li class="font-mono text-[10px] text-ink-dim">+{hovered.msgs.length - 6} more</li>
        {/if}
      </ul>
    </div>
  {/if}
</aside>
