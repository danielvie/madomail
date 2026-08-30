<script lang="ts">
  // PROTOTYPE — Variant 9: Rule Cockpit.
  // Premise: invert the app. Sender rules are the primary object and the Inbox is only
  // the dry-run diff they produce. You tune rules until the residue is small enough.
  import type { MarkAction } from '../../types'
  import { ws } from '../store.svelte'
  import { senderName } from '../fixtures'

  let selectedRule = $state<string | null>(null)
  let draft = $state('')

  const matchesOf = (text: string): typeof ws.inbox =>
    ws.inbox.filter((m) => m.from.toLowerCase().includes(text.toLowerCase()))

  const covered = $derived(ws.inbox.filter((m) => ws.ruleFor(m.from)))
  const residue = $derived(ws.inbox.filter((m) => !ws.ruleFor(m.from)))
  const preview = $derived(draft.trim() ? matchesOf(draft.trim()) : [])
  const focused = $derived(ws.rules.find((r) => r.id === selectedRule))
</script>

<div class="grid h-full grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)] divide-x divide-white/5">
  <!-- rules -->
  <div class="flex min-h-0 flex-col">
    <header class="px-5 py-4">
      <h1 class="text-lg font-semibold">Sender rules</h1>
      <p class="mt-1 text-xs text-accent-dim">
        {ws.rules.length} rules cover {covered.length} of {ws.inbox.length} messages
        ({Math.round((covered.length / Math.max(1, ws.inbox.length)) * 100)}%)
      </p>
      <div class="mt-3 flex h-2 overflow-hidden rounded-full bg-surface">
        <div
          class="bg-brand"
          style="width:{(covered.filter((m) => ws.ruleFor(m.from)?.action === 'archive').length /
            Math.max(1, ws.inbox.length)) * 100}%"
        ></div>
        <div
          class="bg-danger"
          style="width:{(covered.filter((m) => ws.ruleFor(m.from)?.action === 'trash').length /
            Math.max(1, ws.inbox.length)) * 100}%"
        ></div>
      </div>
    </header>

    <div class="px-5 pb-3">
      <input
        class="w-full rounded-md bg-surface px-3 py-2 text-sm outline-none placeholder:text-accent-dim focus:ring-1 focus:ring-brand/50"
        placeholder="New rule: sender text to match..."
        bind:value={draft}
      />
      {#if draft.trim()}
        <div class="mt-2 flex items-center gap-2 text-xs">
          <span class="text-accent-dim">would match {preview.length} messages</span>
          <button
            class="ml-auto rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-black"
            onclick={() => { ws.rules.push({ id: 'r' + Date.now(), from: draft.trim(), action: 'archive' }); draft = '' }}
            >+ ARCHIVE</button
          >
          <button
            class="rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-danger"
            onclick={() => { ws.rules.push({ id: 'r' + Date.now(), from: draft.trim(), action: 'trash' }); draft = '' }}
            >+ DELETE</button
          >
        </div>
      {/if}
    </div>

    <ul class="min-h-0 flex-1 overflow-y-auto px-3 pb-20">
      {#each ws.rules as r (r.id)}
        {@const n = matchesOf(r.from).length}
        <li
          class="mb-1 rounded-lg border px-3 py-2.5 {selectedRule === r.id
            ? 'border-white/25 bg-surface-hover'
            : 'border-transparent hover:bg-surface'}"
        >
          <button
            class="flex w-full items-center gap-2 text-left"
            onclick={() => (selectedRule = selectedRule === r.id ? null : r.id)}
          >
            <span
              class="size-2 shrink-0 rounded-full"
              style="background:{r.action === 'archive' ? '#d6ff00' : '#ff3333'}"
            ></span>
            <span class="min-w-0 flex-1 truncate font-mono text-xs">{r.from}</span>
            <span class="shrink-0 font-mono text-[10px] text-accent-dim">{n} match</span>
          </button>
          {#if selectedRule === r.id}
            <div class="mt-2 flex gap-2">
              {#each ['archive', 'trash'] as const as a}
                <button
                  class="rounded px-2 py-1 font-mono text-[10px] {r.action === a
                    ? 'bg-surface-active'
                    : 'text-accent-dim hover:bg-surface-hover'}"
                  onclick={() => (r.action = a as MarkAction)}>{a}</button
                >
              {/each}
              <button
                class="ml-auto rounded px-2 py-1 font-mono text-[10px] text-danger hover:bg-danger/20"
                onclick={() => ws.removeRule(r.id)}>remove</button
              >
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </div>

  <!-- dry run -->
  <div class="flex min-h-0 flex-col bg-black/25">
    <header class="flex items-center gap-3 px-5 py-4">
      <h2 class="text-sm font-semibold">
        {focused ? 'Matched by "' + focused.from + '"' : 'Not covered by any rule'}
      </h2>
      <span class="font-mono text-xs text-accent-dim">
        {focused ? matchesOf(focused.from).length : residue.length} messages
      </span>
      <button
        class="ml-auto rounded-md bg-brand px-4 py-1.5 font-mono text-xs text-black"
        onclick={() => { const n = ws.runQuery(); ws.applyAll(); void n }}
      >
        RUN &amp; APPLY
      </button>
    </header>

    <ul class="min-h-0 flex-1 overflow-y-auto px-3 pb-20">
      {#each focused ? matchesOf(focused.from) : residue as m (m.id)}
        {@const rule = ws.ruleFor(m.from)}
        <li class="group flex items-center gap-3 rounded px-2 py-2 text-sm hover:bg-surface">
          <span
            class="w-16 shrink-0 font-mono text-[10px] {rule
              ? rule.action === 'archive'
                ? 'text-brand'
                : 'text-danger'
              : 'text-accent-dim'}">{rule ? rule.action : '—'}</span
          >
          <span class="w-40 shrink-0 truncate text-xs text-accent-dim">{senderName(m.from)}</span>
          <span class="min-w-0 flex-1 truncate">{m.subject}</span>
          {#if !rule}
            <button
              class="shrink-0 rounded px-2 py-0.5 font-mono text-[10px] opacity-0 group-hover:opacity-100 hover:bg-surface-active"
              onclick={() => ws.addRule(m.from, 'archive')}>make a rule</button
            >
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</div>
