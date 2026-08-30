<script lang="ts">
  // PROTOTYPE — Variant 1: Sender Stacks.
  // Premise: the unit of triage is the sender, not the message. Rows collapse into
  // one stack per sender, so 4 UW CIRCLE mails are one decision, not four.
  import type { EmailMsg } from '../../types'
  import { ws } from '../store.svelte'
  import { initials, senderAddr, senderName } from '../fixtures'

  type Stack = { key: string; from: string; msgs: EmailMsg[] }

  const stacks = $derived.by(() => {
    const by = new Map<string, Stack>()
    for (const m of ws.filtered) {
      const key = senderAddr(m.from)
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    }
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length)
  })

  let open = $state<string | null>(null)

  const stackMark = (s: Stack): string | null => {
    const marks = s.msgs.map((m) => ws.marks[m.id])
    if (marks.every((x) => x === 'archive')) return 'archive'
    if (marks.every((x) => x === 'trash')) return 'trash'
    return marks.some(Boolean) ? 'mixed' : null
  }
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center gap-3 border-b border-white/5 px-6 py-4">
    <h1 class="font-mono text-xs tracking-widest text-accent-dim">SENDER STACKS</h1>
    <input
      class="ml-auto w-72 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim focus:ring-1 focus:ring-brand/50"
      placeholder="Filter senders..."
      bind:value={ws.search}
    />
    <span class="font-mono text-xs text-accent-dim">
      {stacks.length} senders · {ws.filtered.length} messages
    </span>
    <button
      class="rounded-md bg-brand px-3 py-1.5 font-mono text-xs text-black disabled:opacity-30"
      disabled={ws.markedCount === 0}
      onclick={() => ws.applyAll()}
    >
      APPLY {ws.markedCount || ''}
    </button>
  </header>

  <div class="min-h-0 flex-1 overflow-y-auto px-6 py-4 pb-20">
    <div class="grid items-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
      {#each stacks as s (s.key)}
        {@const mark = stackMark(s)}
        {@const rule = ws.ruleFor(s.from)}
        <div
          class="rounded-xl border p-4 transition-colors {mark === 'archive'
            ? 'border-brand/50 bg-brand/5'
            : mark === 'trash'
              ? 'border-danger/50 bg-danger/5'
              : 'border-white/8 bg-surface hover:border-white/20'}"
        >
          <div class="flex items-start gap-3">
            <div
              class="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-active font-mono text-xs"
            >
              {initials(s.from)}
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold">{senderName(s.from)}</div>
              <div class="truncate font-mono text-[11px] text-accent-dim">{senderAddr(s.from)}</div>
            </div>
            <div class="shrink-0 rounded-md bg-surface-active px-2 py-0.5 font-mono text-xs">
              {s.msgs.length}
            </div>
          </div>

          {#if rule}
            <div class="mt-3 font-mono text-[10px] tracking-wider text-accent-dim">
              RULE · {rule.action.toUpperCase()} · {rule.from}
            </div>
          {/if}

          <button
            class="mt-3 w-full text-left"
            onclick={() => (open = open === s.key ? null : s.key)}
          >
            <div class="truncate text-xs text-accent-dim">
              {open === s.key ? 'Hide' : s.msgs[0].subject}
            </div>
          </button>

          {#if open === s.key}
            <ul class="mt-2 space-y-1 border-l border-white/10 pl-3">
              {#each s.msgs as m (m.id)}
                <li class="flex items-baseline gap-2 text-xs">
                  <span class="min-w-0 flex-1 truncate">{m.subject}</span>
                  <span class="shrink-0 font-mono text-[10px] text-accent-dim">{m.date}</span>
                  <button
                    class="shrink-0 font-mono text-[10px] text-accent-dim hover:text-brand"
                    onclick={() => ws.mark([m.id], 'archive')}>A</button
                  >
                  <button
                    class="shrink-0 font-mono text-[10px] text-accent-dim hover:text-danger"
                    onclick={() => ws.mark([m.id], 'trash')}>D</button
                  >
                </li>
              {/each}
            </ul>
          {/if}

          <div class="mt-4 flex gap-2">
            <button
              class="flex-1 rounded-md bg-surface-hover py-1.5 font-mono text-[11px] hover:bg-brand hover:text-black"
              onclick={() => ws.mark(s.msgs.map((m) => m.id), 'archive')}
            >
              ARCHIVE ALL
            </button>
            <button
              class="flex-1 rounded-md bg-surface-hover py-1.5 font-mono text-[11px] hover:bg-danger"
              onclick={() => ws.mark(s.msgs.map((m) => m.id), 'trash')}
            >
              DELETE ALL
            </button>
            <button
              class="rounded-md bg-surface-hover px-2 py-1.5 font-mono text-[11px] hover:bg-surface-active"
              title="Save a sender rule for this sender"
              onclick={() => ws.addRule(s.from, 'archive')}
            >
              +RULE
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
