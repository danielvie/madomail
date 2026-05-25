<script lang="ts">
  import type { ViewMode } from '../types'

  let {
    searchQuery,
    folderFilter,
    selectedFolderPath,
    filteredFolders,
    recentFolders,
    viewMode,
    emailCount,
    selectedCount,
    assignedCount,
    markedItemCount,
    actionInProgress,
    loading,
    onSearchChange,
    onFolderFilterChange,
    onFolderPathChange,
    onRecentFolderClick,
    onToggleView,
    onRunQuery,
    onMoveSelected,
    onClearAssignments,
    onApplyRules,
    onRefresh
  }: {
    searchQuery: string
    folderFilter: string
    selectedFolderPath: string
    filteredFolders: { name: string; path: string }[]
    recentFolders: string[]
    viewMode: ViewMode
    emailCount: number
    selectedCount: number
    assignedCount: number
    markedItemCount: number
    actionInProgress: boolean
    loading: boolean
    onSearchChange: (value: string) => void
    onFolderFilterChange: (value: string) => void
    onFolderPathChange: (value: string) => void
    onRecentFolderClick: (folderPath: string) => void
    onToggleView: () => void
    onRunQuery: () => void
    onMoveSelected: () => void
    onClearAssignments: () => void
    onApplyRules: () => void
    onRefresh: () => void
  } = $props()
</script>

<header
  class="mb-6 flex shrink-0 flex-col gap-3 rounded-xl border border-surface-active bg-surface p-3 shadow-sm"
>
  <div class="flex items-center justify-between gap-4">
    <div class="relative w-3/12 min-w-[220px]">
      <svg
        class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-accent-dim"
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
        placeholder="Search inbox..."
        class="w-full rounded-lg border border-transparent bg-surface-hover py-2 pl-10 pr-10 text-sm text-accent placeholder:text-accent-dim focus:border-brand focus:outline-none"
      />
      {#if searchQuery}
        <button
          aria-label="Clear search"
          onclick={() => onSearchChange('')}
          class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-accent-dim transition-colors hover:text-brand"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

    <div class="flex items-center gap-3">
      <div class="mr-1 flex flex-col items-end font-mono text-[10px] text-accent-dim">
        <span>{emailCount} emails</span>
        <span>{selectedCount} selected</span>
        <span class="text-brand/80">{assignedCount} assigned</span>
        <span>{markedItemCount} rules</span>
      </div>

      <button
        onclick={onToggleView}
        disabled={actionInProgress}
        class="w-16 rounded-lg border border-accent/20 bg-surface-active px-2 py-1.5 text-xs font-bold uppercase text-accent shadow-sm transition-all hover:bg-surface-hover disabled:opacity-20"
      >
        {viewMode === 'emails' ? 'Rules' : 'Inbox'}
      </button>
      <button
        onclick={onRunQuery}
        disabled={markedItemCount === 0 || actionInProgress || loading}
        class="rounded-lg border border-brand/40 bg-surface-hover px-3 py-1.5 text-xs font-bold uppercase text-brand shadow-sm transition-all hover:bg-brand/10 disabled:opacity-20"
      >
        Run_Query
      </button>
      <button
        onclick={onMoveSelected}
        disabled={selectedCount === 0 || !selectedFolderPath || actionInProgress}
        class="rounded-lg border border-brand/50 bg-brand px-3 py-1.5 text-xs font-bold uppercase text-base shadow-sm transition-all hover:bg-brand/80 disabled:opacity-20"
      >
        Move_Selected
      </button>
      <button
        onclick={onClearAssignments}
        disabled={assignedCount === 0 || actionInProgress}
        class="rounded-lg border border-accent/20 bg-surface-active px-3 py-1.5 text-xs font-bold uppercase text-accent shadow-sm transition-all hover:bg-surface-hover disabled:opacity-20"
      >
        Clear_Assigned
      </button>
      <button
        onclick={onApplyRules}
        disabled={assignedCount === 0 || actionInProgress}
        class="rounded-lg border border-brand/50 bg-brand px-4 py-1.5 text-xs font-bold uppercase text-base shadow-[0_0_15px_rgba(214,255,0,0.15)] transition-all hover:bg-brand/80 disabled:opacity-20"
      >
        Apply_Rules
      </button>
      <button
        aria-label="Refresh"
        onclick={onRefresh}
        disabled={loading}
        class="rounded-lg bg-surface-hover p-2 text-accent-dim transition-all hover:text-brand"
        title="Refresh"
      >
        <svg
          class="h-5 w-5 {loading ? 'animate-spin' : ''}"
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
  </div>

  <div class="flex flex-wrap items-start gap-3">
    <div class="flex min-w-[220px] flex-1 flex-col gap-2">
      <label
        for="folder_filter"
        class="font-mono text-[10px] uppercase tracking-wider text-accent-dim">Folder filter</label
      >
      <input
        id="folder_filter"
        type="text"
        value={folderFilter}
        oninput={(event) => onFolderFilterChange(event.currentTarget.value)}
        placeholder="Filter folders..."
        class="rounded-lg border border-surface-active bg-surface-hover px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
      />
    </div>

    <div class="flex min-w-[280px] flex-[2] flex-col gap-2">
      <label
        for="move_target"
        class="font-mono text-[10px] uppercase tracking-wider text-accent-dim">Move target</label
      >
      <select
        id="move_target"
        value={selectedFolderPath}
        onchange={(event) => onFolderPathChange(event.currentTarget.value)}
        class="rounded-lg border border-surface-active bg-surface-hover px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
      >
        <option value="">Select folder...</option>
        {#each filteredFolders as folder}
          <option value={folder.path}>{folder.path}</option>
        {/each}
      </select>
    </div>

    <div class="flex min-w-[280px] flex-[2] flex-col gap-2">
      <div class="font-mono text-[10px] uppercase tracking-wider text-accent-dim">
        Recent targets
      </div>
      <div
        class="flex min-h-10 flex-wrap gap-2 rounded-lg border border-surface-active bg-surface-hover p-2"
      >
        {#if recentFolders.length === 0}
          <span class="px-2 py-1 font-mono text-[10px] uppercase text-accent-dim"
            >No recent folders</span
          >
        {:else}
          {#each recentFolders as folderPath}
            <button
              onclick={() => onRecentFolderClick(folderPath)}
              class="rounded-full border border-accent/20 bg-surface px-3 py-1 font-mono text-[10px] uppercase text-accent transition-all hover:border-brand/40 hover:text-brand"
              title={folderPath}
            >
              {folderPath.split('/').at(-1) ?? folderPath}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</header>
