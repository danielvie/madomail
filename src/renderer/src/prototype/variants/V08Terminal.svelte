<script lang="ts">
  // PROTOTYPE — Variant 8: Terminal.
  // Premise: lean all the way into the density the current design half-wants. Monospace
  // everywhere, vim motion, a status line, and a ":" command prompt. No buttons.
  import { ws } from '../store.svelte'
  import { senderName } from '../fixtures'

  let cursor = $state(0)
  let cmd = $state<string | null>(null)
  let msg = $state('mado-mail 0.1 — j/k move, a archive, d delete, x select, : command')

  const rows = $derived(ws.filtered)
  const row = $derived(rows[Math.min(cursor, rows.length - 1)])

  function run(line: string): void {
    const [name, ...rest] = line.trim().split(/\s+/)
    const arg = rest.join(' ')
    if (name === 'apply') { const n = ws.markedCount; ws.applyAll(); msg = 'applied ' + n + ' marks to gmail' }
    else if (name === 'query') msg = 'rule query marked ' + ws.runQuery() + ' messages'
    else if (name === 'unmark') { ws.unmarkAll(); msg = 'cleared all pending marks' }
    else if (name === 'rule') { if (row) { ws.addRule(row.from, arg === 'd' ? 'trash' : 'archive'); msg = 'saved sender rule' } }
    else if (name === 'search') { ws.search = arg; msg = 'filter: ' + (arg || '(none)') }
    else if (name === 'refresh') { ws.reset(); msg = 'inbox reloaded' }
    else msg = 'unknown command: ' + name
  }

  function onKey(e: KeyboardEvent): void {
    if (e.altKey) return
    if (cmd !== null) {
      if (e.key === 'Enter') { run(cmd); cmd = null }
      else if (e.key === 'Escape') cmd = null
      return
    }
    const k = e.key
    if (k === 'j') cursor = Math.min(cursor + 1, rows.length - 1)
    else if (k === 'k') cursor = Math.max(0, cursor - 1)
    else if (k === 'g') cursor = 0
    else if (k === 'G') cursor = rows.length - 1
    else if (k === 'x' && row) ws.toggle(row.id)
    else if (k === 'a' && row) { ws.mark(ws.selection.size ? [...ws.selection] : [row.id], 'archive'); msg = 'marked archive' }
    else if (k === 'd' && row) { ws.mark(ws.selection.size ? [...ws.selection] : [row.id], 'trash'); msg = 'marked delete' }
    else if (k === 'u' && row) ws.unmark([row.id])
    else if (k === ':') { e.preventDefault(); cmd = '' }
  }
</script>

<svelte:window onkeydown={onKey} />

<div class="flex h-full flex-col bg-[#08080a] font-mono text-[13px] leading-[1.45]">
  <div class="flex gap-4 border-b border-white/10 px-3 py-1 text-accent-dim">
    <span class="text-brand">INBOX</span>
    <span>{rows.length} msgs</span>
    <span>{ws.selection.size} sel</span>
    <span>{ws.markedCount} marked</span>
    <span class="ml-auto">{ws.autoApply ? 'auto-apply:on' : 'auto-apply:off'}</span>
  </div>

  <div class="min-h-0 flex-1 overflow-y-auto pb-16">
    {#each rows as m, i (m.id)}
      {@const a = ws.marks[m.id]}
      <div
        class="flex gap-2 whitespace-pre px-3 {i === cursor
          ? 'bg-surface-active text-accent'
          : 'text-accent-dim'}"
      >
        <span class="w-8 shrink-0 text-right opacity-50">{String(i + 1).padStart(3, ' ')}</span>
        <span class="w-3 shrink-0 text-brand">{ws.selection.has(m.id) ? '*' : ' '}</span>
        <span
          class="w-2 shrink-0 {a === 'archive' ? 'text-brand' : a === 'trash' ? 'text-danger' : ''}"
          >{a === 'archive' ? 'A' : a === 'trash' ? 'D' : ' '}</span
        >
        <span class="w-[26ch] shrink-0 truncate">{senderName(m.from)}</span>
        <span class="min-w-0 flex-1 truncate {i === cursor ? '' : 'text-accent'}">{m.subject}</span>
        <span class="w-[16ch] shrink-0 text-right opacity-60">{m.date}</span>
      </div>
    {/each}
  </div>

  {#if row}
    <div class="border-t border-white/10 bg-black/60 px-3 py-2 text-accent-dim">
      <div class="truncate text-accent">{row.subject}</div>
      <div class="mt-0.5 line-clamp-2 opacity-70">{row.snippet}</div>
    </div>
  {/if}

  <div class="border-t border-white/10 px-3 py-1">
    {#if cmd !== null}
      <div class="flex">
        <span class="text-brand">:</span>
        <input
          class="flex-1 bg-transparent outline-none"
          bind:value={cmd}
          autofocus
          placeholder="apply | query | unmark | rule [a|d] | search <text> | refresh"
        />
      </div>
    {:else}
      <span class="text-accent-dim">{msg}</span>
    {/if}
  </div>
</div>
