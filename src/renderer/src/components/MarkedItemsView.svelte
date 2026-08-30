<script lang="ts">
  import type { MarkedItem } from '../types';

  let {
    markedItems,
    onEdit,
    onDelete
  }: {
    markedItems: MarkedItem[];
    onEdit: (item: MarkedItem) => void;
    onDelete: (id: string) => void;
  } = $props();

  let filterQuery = $state('');

  const filteredItems = $derived(
    markedItems.filter((item) =>
      item.from.toLowerCase().includes(filterQuery.toLowerCase())
    )
  );

</script>

<div class="p-2 border-b border-line bg-panel3/10 flex items-center gap-2 shrink-0">
  <svg class="w-3.5 h-3.5 text-ink-dim ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
  <input
    type="text"
    bind:value={filterQuery}
    placeholder="Filter items..."
    class="bg-transparent text-ink text-[11px] font-mono outline-none w-full h-5 placeholder:text-ink-dim/50 uppercase tracking-tighter"
  />
  {#if filterQuery}
    <button onclick={() => filterQuery = ''} class="text-ink-dim hover:text-ink p-1">
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>

<div class="grid grid-cols-[1fr_140px_120px] gap-0 border-b border-line bg-panel3/30 font-mono text-[10px] text-ink-dim uppercase tracking-widest shrink-0">
  <div class="p-3 truncate">FROM MATCH</div>
  <div class="p-3">MARK</div>
  <div class="p-3 text-right">ACTION</div>
</div>

<div class="flex-1 overflow-y-auto overflow-x-hidden relative">
  {#if filteredItems.length === 0}
    <div class="absolute inset-0 flex items-center justify-center text-ink-dim font-mono text-[10px]">
      {filterQuery ? 'NO_MATCHING_ITEMS' : 'NO_MARKED_ITEMS'}
    </div>
  {:else}
    {#each filteredItems as item (item.id)}
      <div class="grid grid-cols-[1fr_140px_120px] gap-0 border-b border-line text-sm hover:bg-panel2/50">
        <div class="p-3 truncate text-ink/90">{item.from}</div>
        <div class="p-3 font-mono text-[11px] uppercase {item.action === 'archive' ? 'text-brand' : 'text-danger'}">{item.action === 'archive' ? 'Archive' : 'Delete'}</div>
        <div class="p-2 flex justify-end gap-2">
          <button onclick={() => onEdit(item)} class="px-2 py-1 rounded bg-panel3 text-ink-dim hover:text-ink font-mono text-[10px] uppercase">Edit</button>
          <button onclick={() => onDelete(item.id)} class="px-2 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20 font-mono text-[10px] uppercase">Drop</button>
        </div>
      </div>
    {/each}
  {/if}
</div>
