<script lang="ts">
  import { onMount } from 'svelte';
  import type { EmailMsg, MarkAction, SortKey } from '../types';

  let {
    emails,
    loading,
    selectedIds,
    markedActions,
    sortKey,
    sortDesc,
    gridStyle,
    resizable,
    onFitColumns,
    onSort,
    onRowClick,
    onRowRightClick,
    onRowMouseDown,
    onRowMouseMove,
    onRowMouseLeave
  }: {
    emails: EmailMsg[];
    loading: boolean;
    selectedIds: Set<string>;
    markedActions: Record<string, MarkAction>;
    sortKey: SortKey;
    sortDesc: boolean;
    gridStyle: string;
    resizable: (node: HTMLElement, index: number) => unknown;
    onFitColumns: () => void;
    onSort: (key: SortKey) => void;
    onRowClick: (event: MouseEvent | KeyboardEvent, email: EmailMsg) => void;
    onRowRightClick: (event: MouseEvent, id: string) => void;
    onRowMouseDown: (event: MouseEvent, id: string) => void;
    onRowMouseMove: (event: MouseEvent, email: EmailMsg) => void;
    onRowMouseLeave: () => void;
  } = $props();

  let altPressed = $state(false);

  onMount(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Alt') altPressed = true;
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') altPressed = false;
    };
    const handleBlur = () => {
      altPressed = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  });
</script>

<div class="grid gap-0 p-0 border-b border-surface-active bg-surface-active/30 font-mono text-[10px] text-accent-dim uppercase tracking-widest shrink-0" style={gridStyle}>
  <div
    role="button"
    tabindex="0"
    class="p-3 cursor-pointer hover:text-accent select-none truncate"
    onclick={() => onSort('from')}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSort('from'); }}
  >
    FROM {#if sortKey === 'from'}<span class="text-brand">{sortDesc ? '↓' : '↑'}</span>{/if}
  </div>
  <div use:resizable={0} class="cursor-col-resize hover:bg-brand/20 transition-colors w-1 bg-surface-active/50"></div>

  <div
    role="button"
    tabindex="0"
    class="p-3 cursor-pointer hover:text-accent select-none truncate"
    onclick={() => onSort('subject')}
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSort('subject'); }}
  >
    <div class="flex items-center">
      <span> SUBJECT {#if sortKey === 'subject'}<span class="text-brand">{sortDesc ? '↓' : '↑'}</span>{/if} </span>
      <span class="grow text-end">
        <button
          onclick={onFitColumns}
          disabled={loading || emails.length === 0}
          class="px-2 py-1 rounded bg-surface-hover text-accent-dim border border-accent/10 hover:text-brand hover:border-brand/30 transition-all disabled:opacity-20 font-mono text-[10px] uppercase"
        >
          Fit columns
        </button>
      </span>
    </div>
  </div>
  <div use:resizable={1} class="cursor-col-resize hover:bg-brand/20 transition-colors w-1 bg-surface-active/50"></div>

  <div class="p-2 flex items-center justify-end gap-2">
    
    <button
      type="button"
      class="cursor-pointer hover:text-accent select-none text-right"
      onclick={() => onSort('date')}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSort('date'); }}
    >
      {#if sortKey === 'date'}<span class="text-brand">{sortDesc ? '↓' : '↑'}</span>{/if} DATE
    </button>
  </div>
</div>

<div class="flex-1 overflow-y-auto overflow-x-hidden relative">
  {#if loading && emails.length === 0}
    <div class="absolute inset-0 flex items-center justify-center text-accent-dim font-mono text-[10px] animate-pulse">CONNECTING...</div>
  {:else if emails.length === 0}
    <div class="absolute inset-0 flex items-center justify-center text-accent-dim font-mono text-[10px]">NO_DATA</div>
  {:else}
    {#each emails as email (email.id)}
      <div
        role="button"
        tabindex="0"
        class="grid gap-0 p-0 border-b border-surface-active cursor-pointer transition-all hover:bg-surface-hover/50 text-sm group relative
               {altPressed ? 'hover:cursor-cell hover:ring-1 hover:ring-brand/60 hover:ring-inset' : ''}
               {selectedIds.has(email.id) ? 'bg-surface-active' : ''}"
        style={gridStyle}
        onclick={(e) => onRowClick(e, email)}
        oncontextmenu={(e) => onRowRightClick(e, email.id)}
        onmousedown={(e) => onRowMouseDown(e, email.id)}
        onmousemove={(e) => onRowMouseMove(e, email)}
        onmouseleave={onRowMouseLeave}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onRowClick(e, email); }}
      >
        {#if markedActions[email.id]}
          <div class="absolute left-0 top-0 bottom-0 w-1 {markedActions[email.id] === 'archive' ? 'bg-brand' : 'bg-danger'} z-10"></div>
        {/if}

        <div class="p-3 truncate font-medium flex items-center gap-2">
          {#if markedActions[email.id]}
            <span class="text-[11px] px-1 rounded bg-surface-active font-mono {markedActions[email.id] === 'archive' ? 'text-brand' : 'text-danger'}">
              {markedActions[email.id] === 'archive' ? 'A' : 'D'}
            </span>
          {/if}
          <span class="truncate {selectedIds.has(email.id) ? 'text-brand' : 'text-accent/90'}">{email.from}</span>
        </div>
        <div class="bg-transparent w-1"></div>

        <div
          class="p-3 truncate flex items-center gap-2"
        >
          <span class="truncate {selectedIds.has(email.id) ? 'text-accent' : 'text-accent/80'}">{email.subject || '(No Subject)'}</span>
        </div>
        <div class="bg-transparent w-1"></div>

        <div class="p-3 text-right text-accent-dim font-mono text-[11px] whitespace-nowrap self-center">
          {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    {/each}
  {/if}
</div>
