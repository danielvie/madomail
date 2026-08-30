<script lang="ts">
  // PROMOTED — this is no longer a variant sketch. It renders the real components from
  // src/renderer/src/components, driven by the prototype's fixture store instead of
  // Gmail, so colour themes can be judged against realistic content without credentials.
  import StagingBins from '../../components/StagingBins.svelte'
  import TriageRows from '../../components/TriageRows.svelte'
  import { ws } from '../store.svelte'

  import { senderAddr } from '../../lib/sender'

  const undecided = $derived(ws.filtered.filter((m) => !ws.marks[m.id]))
  const senders = $derived(new Set(undecided.map((m) => senderAddr(m.from))).size)
</script>

<div class="flex h-full flex-col">
  <!-- mirrors the real App.svelte header so themes are judged on the whole chrome -->
  <header class="flex items-center gap-2 border-b border-line px-3 py-2">
    <input
      class="w-52 rounded-md border border-line bg-panel px-3 py-1.5 text-sm outline-none placeholder:text-ink-dim"
      placeholder="Filter..."
      bind:value={ws.search}
    />
    <button
      class="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2"
      onclick={() => ws.runQuery()}>RUN QUERY</button
    >
    <button class="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2"
      >RULES</button
    >
    <button
      class="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2"
      onclick={() => ws.reset()}>REFRESH</button
    >
    <span class="font-mono text-[11px] text-ink-dim">
      {senders} senders · {undecided.length} undecided
    </span>
    {#if ws.selection.size}
      <span class="flex items-center gap-2">
        <span class="font-mono text-[11px] text-brand">{ws.selection.size} selected</span>
        <button
          class="rounded bg-panel2 px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-on-brand"
          onclick={() => ws.mark([...ws.selection], 'archive')}>ARCHIVE</button
        >
        <button
          class="rounded bg-panel2 px-2 py-1 font-mono text-[10px] hover:bg-danger hover:text-on-danger"
          onclick={() => ws.mark([...ws.selection], 'trash')}>DELETE</button
        >
        <button
          class="font-mono text-[10px] text-ink-dim hover:text-ink"
          onclick={() => (ws.selection = new Set())}>clear</button
        >
      </span>
    {/if}
    <label class="ml-auto flex items-center gap-2 font-mono text-[10px] text-ink-dim">
      <input type="checkbox" bind:checked={ws.autoApply} /> auto-apply
    </label>
  </header>

  <div class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] divide-x divide-line">
  <TriageRows
    emails={undecided}
    selection={ws.selection}
    rules={ws.rules}
    onselect={(next) => (ws.selection = next)}
    onmark={(ids, action) => ws.mark(ids, action)}
    onalways={(from, action) => {
      ws.addRule(from, action)
      ws.runQuery()
    }}
  />
  <StagingBins
    emails={ws.inbox}
    marks={ws.marks}
    rules={ws.rules}
    onunmark={(ids) => ws.unmark(ids)}
    onunmarkall={() => ws.unmarkAll()}
    onapply={() => ws.applyAll()}
    />
  </div>
</div>
