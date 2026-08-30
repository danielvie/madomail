<script lang="ts">
  // PROTOTYPE — Variant 19: Review Sheet. (staging study 4 of 5)
  // Staging idea: the opposite bet. While triaging you get a single honest counter and
  // nothing else — the full width stays on the Inbox. The staging area appears once, as
  // a full-screen review you must pass through before anything reaches Gmail, with a
  // checkbox beside every group so the last word is "drop this from the batch".
  import type { EmailMsg, MarkAction } from '../../types'
  import { ws } from '../store.svelte'
  import TriageList from '../TriageList.svelte'
  import { senderAddr, senderName } from '../fixtures'

  let reviewing = $state(false)
  let dropped = $state<Set<string>>(new Set())

  const staged = $derived(ws.inbox.filter((m) => ws.marks[m.id]))
  const groups = $derived.by(() => {
    const by = new Map<string, { key: string; from: string; action: MarkAction; msgs: EmailMsg[] }>()
    for (const m of staged) {
      const action = ws.marks[m.id]
      const key = senderAddr(m.from) + ':' + action
      if (!by.has(key)) by.set(key, { key, from: m.from, action, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()].sort(
      (a, b) => a.action.localeCompare(b.action) || b.msgs.length - a.msgs.length
    )
  })

  const keeping = $derived(staged.filter((m) => !dropped.has(m.id)))

  function toggleDrop(ids: string[]): void {
    const next = new Set(dropped)
    const allDropped = ids.every((id) => next.has(id))
    for (const id of ids) (allDropped ? next.delete(id) : next.add(id))
    dropped = next
  }

  function confirm(): void {
    if (dropped.size) ws.unmark([...dropped])
    ws.applyAll()
    dropped = new Set()
    reviewing = false
  }
</script>

<div class="relative flex h-full flex-col">
  <div class="min-h-0 flex-1">
    <TriageList />
  </div>

  <!-- the only staging surface while you work: one line -->
  <div class="flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-2.5">
    {#if staged.length}
      <span class="font-mono text-[11px] text-brand"
        >{staged.filter((m) => ws.marks[m.id] === 'archive').length} to archive</span
      >
      <span class="font-mono text-[11px] text-danger"
        >{staged.filter((m) => ws.marks[m.id] === 'trash').length} to delete</span
      >
      <span class="font-mono text-[11px] text-accent-dim">
        across {new Set(staged.map((m) => senderAddr(m.from))).size} senders
      </span>
      <button
        class="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent"
        onclick={() => ws.unmarkAll()}>discard</button
      >
      <button
        class="rounded-md bg-brand px-5 py-1.5 font-mono text-[11px] text-black"
        onclick={() => (reviewing = true)}>REVIEW {staged.length} →</button
      >
    {:else}
      <span class="font-mono text-[11px] text-accent-dim">
        Nothing staged. The full window stays on the Inbox until you have something to review.
      </span>
    {/if}
  </div>

  {#if reviewing}
    <div class="absolute inset-0 z-40 flex flex-col bg-base/95 backdrop-blur">
      <header class="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        <div>
          <h2 class="text-lg">Review before applying</h2>
          <p class="mt-0.5 font-mono text-[11px] text-accent-dim">
            {keeping.length} of {staged.length} will be sent to Gmail · uncheck anything to put it back
          </p>
        </div>
        <button
          class="ml-auto font-mono text-[11px] text-accent-dim hover:text-accent"
          onclick={() => (reviewing = false)}>← keep triaging</button
        >
      </header>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {#each ['archive', 'trash'] as const as action}
          {@const gs = groups.filter((g) => g.action === action)}
          {#if gs.length}
            <div class="mb-6">
              <div class="mb-2 flex items-baseline gap-2">
                <span
                  class="font-mono text-[11px] tracking-widest"
                  style="color:{action === 'archive' ? '#d6ff00' : '#ff3333'}"
                  >{action === 'archive' ? 'ARCHIVE' : 'MOVE TO TRASH'}</span
                >
                <span class="font-mono text-[11px] text-accent-dim">
                  {gs.reduce((n, g) => n + g.msgs.filter((m) => !dropped.has(m.id)).length, 0)} messages
                </span>
              </div>
              <ul class="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/8">
                {#each gs as g (g.key)}
                  {@const ids = g.msgs.map((m) => m.id)}
                  {@const off = ids.every((id) => dropped.has(id))}
                  <li
                    class="flex items-center gap-3 px-4 py-2.5 {off
                      ? 'bg-black/40 opacity-45'
                      : 'bg-surface/40'}"
                  >
                    <button
                      class="grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] leading-none {off
                        ? 'border-white/25 text-transparent'
                        : 'border-brand bg-brand text-black'}"
                      onclick={() => toggleDrop(ids)}>{off ? '·' : '✓'}</button
                    >
                    <span class="w-[30ch] shrink-0 truncate text-sm font-semibold {off ? 'line-through' : ''}"
                      >{senderName(g.from)}</span
                    >
                    <span class="min-w-0 flex-1 truncate text-sm text-accent-dim">
                      {g.msgs.length > 1 ? g.msgs.length + ' messages' : g.msgs[0].subject}
                    </span>
                    {#if ws.ruleFor(g.from)}
                      <span
                        class="shrink-0 rounded bg-surface-active px-1.5 font-mono text-[9px] text-accent-dim"
                        >BY RULE</span
                      >
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        {/each}
      </div>

      <footer class="flex items-center gap-3 border-t border-white/10 px-6 py-4">
        {#if dropped.size}
          <span class="font-mono text-[11px] text-accent-dim"
            >{dropped.size} put back in the Inbox</span
          >
        {/if}
        <button
          class="ml-auto rounded-md px-4 py-2 font-mono text-[11px] text-accent-dim hover:text-accent"
          onclick={() => (reviewing = false)}>cancel</button
        >
        <button
          class="rounded-md bg-brand px-6 py-2 font-mono text-[11px] text-black disabled:opacity-30"
          disabled={keeping.length === 0}
          onclick={confirm}>SEND {keeping.length} TO GMAIL</button
        >
      </footer>
    </div>
  {/if}
</div>
