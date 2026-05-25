<script lang="ts">
  import type { MarkedItem } from '../types'

  let {
    markedItems,
    invalidFolderPaths,
    onEdit,
    onDelete
  }: {
    markedItems: MarkedItem[]
    invalidFolderPaths: Set<string>
    onEdit: (item: MarkedItem) => void
    onDelete: (id: string) => void
  } = $props()

  let filterQuery = $state('')

  const filteredItems = $derived(
    markedItems.filter((item) => {
      const normalized = filterQuery.toLowerCase()
      return (
        item.from.toLowerCase().includes(normalized) ||
        item.folderPath.toLowerCase().includes(normalized)
      )
    })
  )
</script>

<div
  class="p-2 border-b border-surface-active bg-surface-active/10 flex items-center gap-2 shrink-0"
>
  <svg
    class="w-3.5 h-3.5 text-accent-dim ml-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
  <input
    type="text"
    bind:value={filterQuery}
    placeholder="Filter rules..."
    class="bg-transparent text-accent text-[11px] font-mono outline-none w-full h-5 placeholder:text-accent-dim/50 uppercase tracking-tighter"
  />
  {#if filterQuery}
    <button
      aria-label="Clear rule filter"
      onclick={() => (filterQuery = '')}
      class="text-accent-dim hover:text-accent p-1"
    >
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  {/if}
</div>

<div
  class="grid grid-cols-[1fr_1.2fr_120px] gap-0 border-b border-surface-active bg-surface-active/30 font-mono text-[10px] text-accent-dim uppercase tracking-widest shrink-0"
>
  <div class="p-3 truncate">FROM MATCH</div>
  <div class="p-3">DESTINATION</div>
  <div class="p-3 text-right">ACTION</div>
</div>

<div class="flex-1 overflow-y-auto overflow-x-hidden relative">
  {#if filteredItems.length === 0}
    <div
      class="absolute inset-0 flex items-center justify-center text-accent-dim font-mono text-[10px]"
    >
      {filterQuery ? 'NO_MATCHING_RULES' : 'NO_MARKED_RULES'}
    </div>
  {:else}
    {#each filteredItems as item (item.id)}
      {@const invalid = invalidFolderPaths.has(item.folderPath.toLowerCase())}
      <div
        class="grid grid-cols-[1fr_1.2fr_120px] gap-0 border-b border-surface-active text-sm hover:bg-surface-hover/50 {invalid
          ? 'opacity-60 italic'
          : ''}"
      >
        <div class="p-3 truncate text-accent/90">{item.from}</div>
        <div
          class="p-3 truncate font-mono text-[11px] uppercase text-brand"
          title={item.folderPath}
        >
          {item.folderPath}
        </div>
        <div class="p-2 flex justify-end gap-2">
          <button
            onclick={() => onEdit(item)}
            class="px-2 py-1 rounded bg-surface-active text-accent-dim hover:text-accent font-mono text-[10px] uppercase"
            >Edit</button
          >
          <button
            onclick={() => onDelete(item.id)}
            class="px-2 py-1 rounded bg-danger/10 text-danger hover:bg-danger/20 font-mono text-[10px] uppercase"
            >Drop</button
          >
        </div>
      </div>
    {/each}
  {/if}
</div>
