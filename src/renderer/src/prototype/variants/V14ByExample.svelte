<script lang="ts">
  // PROTOTYPE — Variant 14: By Example. (answers "decide faster from the entry page")
  // Premise: no session, no rounds, no start button. The list is live on load. Touch one
  // message and the app immediately offers the batch it belongs to — same sender, or the
  // same subject shape sent repeatedly — so one decision clears many. The proposal is a
  // bar, not a screen: accept it, narrow it to just this message, or ignore it and move on.
  import type { EmailMsg } from '../../types'
  import type { MarkAction } from '../../types'
  import { ws } from '../store.svelte'
  import { senderAddr, senderName, subjectShape } from '../fixtures'

  type Proposal = { basis: 'sender' | 'subject'; label: string; msgs: EmailMsg[] }

  let focus = $state<string | null>(null)

  const live = $derived(ws.filtered.filter((m) => !ws.marks[m.id]))
  const staged = $derived(ws.inbox.filter((m) => ws.marks[m.id]))

  const proposal = $derived.by((): Proposal | null => {
    const m = live.find((x) => x.id === focus)
    if (!m) return null
    const shape = subjectShape(m.subject)
    const bySubject = live.filter((x) => subjectShape(x.subject) === shape)
    // A repeated subject is the stronger signal — that is a blast, not correspondence.
    if (bySubject.length > 1)
      return { basis: 'subject', label: '"' + m.subject + '"', msgs: bySubject }
    const key = senderAddr(m.from)
    const bySender = live.filter((x) => senderAddr(x.from) === key)
    if (bySender.length > 1) return { basis: 'sender', label: senderName(m.from), msgs: bySender }
    return null
  })

  function accept(action: MarkAction, all: boolean): void {
    const ids = all && proposal ? proposal.msgs.map((m) => m.id) : focus ? [focus] : []
    ws.mark(ids, action)
    focus = null
  }
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center gap-3 border-b border-white/5 px-4 py-2.5">
    <input
      class="w-64 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
      placeholder="Filter..."
      bind:value={ws.search}
    />
    <span class="font-mono text-[11px] text-accent-dim">{live.length} undecided</span>
    <span class="font-mono text-[11px] text-brand"
      >{staged.filter((m) => ws.marks[m.id] === 'archive').length} archive</span
    >
    <span class="font-mono text-[11px] text-danger"
      >{staged.filter((m) => ws.marks[m.id] === 'trash').length} delete</span
    >
    <button
      class="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
      disabled={staged.length === 0}
      onclick={() => ws.unmarkAll()}>undo all</button
    >
    <button
      class="rounded-md bg-brand px-4 py-1.5 font-mono text-[11px] text-black disabled:opacity-30"
      disabled={staged.length === 0}
      onclick={() => ws.applyAll()}>APPLY {staged.length}</button
    >
  </header>

  <ul class="min-h-0 flex-1 overflow-y-auto">
    {#each live as m (m.id)}
      {@const inProposal = proposal?.msgs.some((x) => x.id === m.id) ?? false}
      <li>
        <button
          class="flex w-full items-center gap-3 border-b border-white/5 px-4 py-2 text-left text-sm {focus ===
          m.id
            ? 'bg-surface-hover'
            : inProposal
              ? 'bg-brand/10'
              : 'hover:bg-surface'}"
          onclick={() => (focus = focus === m.id ? null : m.id)}
        >
          <span class="w-[28ch] shrink-0 truncate font-semibold">{senderName(m.from)}</span>
          <span class="min-w-0 flex-1 truncate">{m.subject}</span>
          <span class="w-[24ch] shrink-0 truncate text-xs text-accent-dim">{m.snippet}</span>
          <span class="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim"
            >{m.date}</span
          >
        </button>
      </li>
    {/each}
  </ul>

  <!-- proposal bar: appears in place, never covers the list content you are judging -->
  <div
    class="border-t transition-colors {proposal
      ? 'border-brand/40 bg-brand/5'
      : 'border-white/10 bg-black/40'}"
  >
    {#if proposal}
      <div class="flex items-center gap-3 px-4 py-3">
        <div class="min-w-0">
          <div class="font-mono text-[10px] tracking-widest text-brand">
            {proposal.msgs.length} MESSAGES · {proposal.basis === 'subject'
              ? 'SAME SUBJECT, SENT REPEATEDLY'
              : 'SAME SENDER'}
          </div>
          <div class="mt-0.5 truncate text-sm">{proposal.label}</div>
        </div>
        <div class="ml-auto flex shrink-0 items-center gap-2">
          <button
            class="rounded-md bg-brand px-4 py-2 font-mono text-[11px] text-black"
            onclick={() => accept('archive', true)}
            >ARCHIVE ALL {proposal.msgs.length}</button
          >
          <button
            class="rounded-md bg-danger px-4 py-2 font-mono text-[11px] text-black"
            onclick={() => accept('trash', true)}
            >DELETE ALL {proposal.msgs.length}</button
          >
          <span class="mx-1 h-6 w-px bg-white/10"></span>
          <button
            class="rounded-md bg-surface-hover px-3 py-2 font-mono text-[11px] hover:bg-surface-active"
            onclick={() => accept('archive', false)}>just this one — A</button
          >
          <button
            class="rounded-md bg-surface-hover px-3 py-2 font-mono text-[11px] hover:bg-surface-active"
            onclick={() => accept('trash', false)}>D</button
          >
          <button
            class="px-2 font-mono text-[11px] text-accent-dim hover:text-accent"
            onclick={() => (focus = null)}>dismiss</button
          >
        </div>
      </div>
    {:else if focus}
      <div class="flex items-center gap-3 px-4 py-3">
        <span class="font-mono text-[11px] text-accent-dim">
          Nothing else looks like this one — a single decision.
        </span>
        <div class="ml-auto flex gap-2">
          <button
            class="rounded-md bg-surface-hover px-4 py-2 font-mono text-[11px] hover:bg-brand hover:text-black"
            onclick={() => accept('archive', false)}>ARCHIVE</button
          >
          <button
            class="rounded-md bg-surface-hover px-4 py-2 font-mono text-[11px] hover:bg-danger"
            onclick={() => accept('trash', false)}>DELETE</button
          >
        </div>
      </div>
    {:else}
      <div class="px-4 py-3 font-mono text-[11px] text-accent-dim">
        Click any row — Mado offers the whole batch it belongs to.
      </div>
    {/if}
  </div>
</div>
