<script lang="ts">
  import type { ViewMode } from '../types'

  let {
    searchQuery,
    autoApply,
    viewMode,
    emailCount,
    selectedCount,
    markedCount,
    markedItemCount,
    actionInProgress,
    loading,
    onSearchChange,
    onAutoApplyChange,
    onToggleView,
    onRunQuery,
    onMarkArchive,
    onMarkTrash,
    onUnmark,
    onApplyAll,
    onRefresh
  }: {
    searchQuery: string
    autoApply: boolean
    viewMode: ViewMode
    emailCount: number
    selectedCount: number
    markedCount: number
    markedItemCount: number
    actionInProgress: boolean
    loading: boolean
    onSearchChange: (value: string) => void
    onAutoApplyChange: (value: boolean) => void
    onToggleView: () => void
    onRunQuery: () => void
    onMarkArchive: () => void
    onMarkTrash: () => void
    onUnmark: () => void
    onApplyAll: () => void
    onRefresh: () => void
  } = $props()
</script>

<header
  class="flex justify-between items-center mb-6 gap-4 shrink-0 p-2 rounded-xl bg-surface border border-surface-active shadow-sm"
>
  <div class="flex items-center gap-3 w-3/12 relative">
    <svg
      class="w-5 h-5 absolute left-3 text-accent-dim pointer-events-none"
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
      value={searchQuery}
      oninput={(event) => onSearchChange(event.currentTarget.value)}
      placeholder="Search..."
      class="w-full bg-surface-hover text-accent pl-10 pr-10 py-2 rounded-lg border border-transparent focus:border-brand focus:outline-none transition-all placeholder:text-accent-dim text-sm"
    />
    {#if searchQuery}
      <button
        aria-label="Clear search"
        onclick={() => onSearchChange('')}
        class="absolute right-3 text-accent-dim hover:text-brand transition-colors p-1"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

  <div class="flex items-center gap-4">
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={autoApply}
        onchange={(event) => onAutoApplyChange(event.currentTarget.checked)}
        class="w-4 h-4 accent-brand bg-surface border-surface-active rounded"
      />
      <span
        class="text-[10px] font-mono uppercase tracking-wider {autoApply
          ? 'text-brand'
          : 'text-accent-dim'}">Auto-Apply</span
      >
    </label>

    <div class="flex items-center gap-2">
      <div class="text-[10px] text-accent-dim font-mono flex flex-col items-end mr-2">
        <span>{emailCount} emails</span>
        <span>{selectedCount} selected</span>
        <span class="text-brand/80">{markedCount} marked</span>
      </div>
      <button
        onclick={onToggleView}
        disabled={actionInProgress}
        class="w-16 px-2 py-1.5 bg-surface-active text-accent rounded-lg border border-accent/20 hover:bg-surface-hover transition-all disabled:opacity-20 text-xs font-mono font-bold uppercase shadow-sm"
      >
        {viewMode === 'emails' ? 'List' : 'Inbox'}
      </button>
      <button
        onclick={onRunQuery}
        disabled={markedItemCount === 0 || actionInProgress || loading}
        class="px-3 py-1.5 bg-surface-hover text-brand rounded-lg border border-brand/40 hover:bg-brand/10 transition-all disabled:opacity-20 text-xs font-mono font-bold uppercase shadow-sm"
        >Run_Query</button
      >
      <button
        onclick={onMarkArchive}
        disabled={selectedCount === 0 || actionInProgress}
        class="px-3 py-1.5 bg-brand text-base rounded-lg border border-brand/50 hover:bg-brand/80 transition-all disabled:opacity-20 text-xs font-mono font-bold uppercase shadow-sm"
        >ARCHIVE_SEL</button
      >
      <button
        onclick={onMarkTrash}
        disabled={selectedCount === 0 || actionInProgress}
        class="px-3 py-1.5 bg-danger text-white rounded-lg border border-danger/50 hover:bg-danger/80 transition-all disabled:opacity-20 text-xs font-mono font-bold uppercase shadow-sm"
        >DELETE_SEL</button
      >
      <button
        onclick={onUnmark}
        disabled={(selectedCount === 0 && markedCount === 0) || actionInProgress}
        class="px-3 py-1.5 bg-surface-active text-accent rounded-lg border border-accent/20 hover:bg-surface-active/80 transition-all disabled:opacity-20 text-xs font-mono font-bold uppercase shadow-sm"
      >
        {selectedCount === 0 && markedCount > 0 ? 'UNMARK_ALL' : 'UNMARK_SEL'}
      </button>
      <div class="w-px h-6 bg-surface-active mx-1"></div>
      <button
        onclick={onApplyAll}
        disabled={markedCount === 0 || actionInProgress}
        class="px-4 py-1.5 bg-brand text-base rounded-lg border border-brand/50 hover:bg-brand/80 transition-all disabled:opacity-20 font-bold shadow-[0_0_15px_rgba(214,255,0,0.15)] text-xs font-mono uppercase"
        >Apply_All</button
      >
    </div>

    <button
      aria-label="Refresh"
      onclick={onRefresh}
      disabled={loading}
      class="p-2 bg-surface-hover text-accent-dim rounded-lg hover:text-brand transition-all"
      title="Refresh"
    >
      <svg
        class="w-5 h-5 {loading ? 'animate-spin' : ''}"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  </div>
</header>
