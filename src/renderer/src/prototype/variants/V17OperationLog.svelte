<script lang="ts">
  // PROTOTYPE — Variant 17: Operation Log. (staging study 2 of 5)
  // Staging idea: you did not make 32 decisions, you made 6 moves. So stage *moves*,
  // not messages — "archived 4 from UW CIRCLE", newest on top, each one undoable on its
  // own. The pending set stays legible no matter how many messages it holds.
  import { ws } from '../store.svelte'
  import TriageList from '../TriageList.svelte'

  const log = $derived([...ws.ops].reverse())
  const total = $derived(ws.markedCount)
  const nArchive = $derived(Object.values(ws.marks).filter((a) => a === 'archive').length)
  const nTrash = $derived(total - nArchive)
  let expanded = $state<string | null>(null)
</script>

<div class="flex h-full flex-col">
  <div class="min-h-0 flex-1">
    <TriageList />
  </div>

  <!-- staging: a log, docked, growing upward -->
  <section class="flex max-h-[45%] min-h-[9rem] flex-col border-t border-white/10 bg-black/50">
    <div class="flex items-center gap-3 border-b border-white/5 px-3 py-2">
      <span class="font-mono text-[11px] tracking-widest text-accent-dim">STAGED WORK</span>
      <span class="font-mono text-[11px] text-accent-dim">
        {ws.ops.length}
        {ws.ops.length === 1 ? 'move' : 'moves'} · {total} messages
      </span>
      <span class="ml-auto flex items-center gap-3">
        <span class="font-mono text-[11px] text-brand">{nArchive} archive</span>
        <span class="font-mono text-[11px] text-danger">{nTrash} delete</span>
        <button
          class="font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
          disabled={total === 0}
          onclick={() => ws.unmarkAll()}>undo everything</button
        >
        <button
          class="rounded-md bg-brand px-4 py-1.5 font-mono text-[11px] text-black disabled:opacity-30"
          disabled={total === 0}
          onclick={() => ws.applyAll()}>APPLY {total}</button
        >
      </span>
    </div>

    <ol class="min-h-0 flex-1 overflow-y-auto">
      {#each log as op, i (op.id)}
        <li class="border-b border-white/5">
          <div class="group flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface">
            <span class="w-6 shrink-0 text-right font-mono text-[10px] text-accent-dim"
              >{log.length - i}</span
            >
            <span
              class="w-[9ch] shrink-0 font-mono text-[10px] {op.action === 'archive'
                ? 'text-brand'
                : 'text-danger'}">{op.action === 'archive' ? 'ARCHIVE' : 'DELETE'}</span
            >
            <button
              class="min-w-0 flex-1 truncate text-left"
              onclick={() => (expanded = expanded === op.id ? null : op.id)}
            >
              {op.label}
              {#if op.ids.length > 1}
                <span class="ml-1 font-mono text-[10px] text-accent-dim"
                  >{expanded === op.id ? '▾' : '▸'} {op.ids.length}</span
                >
              {/if}
            </button>
            {#if op.viaRule}
              <span class="shrink-0 rounded bg-surface-active px-1.5 font-mono text-[9px] text-accent-dim"
                >BY RULE</span
              >
            {/if}
            <button
              class="shrink-0 rounded px-2 py-0.5 font-mono text-[10px] text-accent-dim opacity-0 group-hover:opacity-100 hover:bg-surface-active hover:text-accent"
              onclick={() => ws.undoOp(op.id)}>UNDO</button
            >
          </div>
          {#if expanded === op.id}
            <ul class="bg-black/40 pb-1">
              {#each ws.inbox.filter((m) => op.ids.includes(m.id)) as m (m.id)}
                <li class="flex items-center gap-3 px-3 py-1 text-xs">
                  <span class="w-6 shrink-0"></span>
                  <span class="w-[9ch] shrink-0"></span>
                  <span class="min-w-0 flex-1 truncate text-accent-dim">{m.subject}</span>
                  <button
                    class="shrink-0 font-mono text-[10px] text-accent-dim hover:text-accent"
                    onclick={() => ws.unmark([m.id])}>put back</button
                  >
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {:else}
        <li class="px-3 py-8 text-center font-mono text-[11px] text-accent-dim">
          No moves yet. Every archive or delete lands here as one undoable step.
        </li>
      {/each}
    </ol>
  </section>
</div>
