<script lang="ts">
  import type { FolderOption } from '../types'

  let {
    from,
    folderFilter,
    folderPath,
    filteredFolders,
    folderValid,
    onFromChange,
    onFolderFilterChange,
    onFolderPathChange,
    onCancel,
    onSave
  }: {
    from: string
    folderFilter: string
    folderPath: string
    filteredFolders: FolderOption[]
    folderValid: boolean
    onFromChange: (value: string) => void
    onFolderFilterChange: (value: string) => void
    onFolderPathChange: (value: string) => void
    onCancel: () => void
    onSave: () => void
  } = $props()
</script>

<div class="fixed inset-0 z-50 bg-base/60 flex items-center justify-center p-4">
  <button
    type="button"
    aria-label="Close marked rule editor"
    class="absolute inset-0 cursor-default bg-transparent"
    onclick={onCancel}
  ></button>
  <div
    class="relative w-full max-w-lg rounded-xl border border-surface-active bg-surface shadow-2xl"
  >
    <div
      class="border-b border-surface-active px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-accent-dim"
    >
      Marked Rule
    </div>
    <div class="p-4 flex flex-col gap-4">
      <label class="flex flex-col gap-2">
        <label
          for="marked_rule_from"
          class="font-mono text-[10px] uppercase tracking-wider text-accent-dim">From match</label
        >
        <input
          id="marked_rule_from"
          type="text"
          value={from}
          oninput={(event) => onFromChange(event.currentTarget.value)}
          class="w-full rounded-lg border border-surface-active bg-surface-hover px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        />
      </label>

      <label class="flex flex-col gap-2">
        <label
          for="marked_rule_folder_filter"
          class="font-mono text-[10px] uppercase tracking-wider text-accent-dim"
          >Folder filter</label
        >
        <input
          id="marked_rule_folder_filter"
          type="text"
          value={folderFilter}
          oninput={(event) => onFolderFilterChange(event.currentTarget.value)}
          placeholder="Filter folders..."
          class="w-full rounded-lg border border-surface-active bg-surface-hover px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none"
        />
      </label>

      <label class="flex flex-col gap-2">
        <label
          for="marked_rule_folder_path"
          class="font-mono text-[10px] uppercase tracking-wider text-accent-dim"
          >Destination folder</label
        >
        <select
          id="marked_rule_folder_path"
          value={folderPath}
          onchange={(event) => onFolderPathChange(event.currentTarget.value)}
          class="w-full rounded-lg border px-3 py-2 text-sm text-accent focus:border-brand focus:outline-none {folderValid
            ? 'border-surface-active bg-surface-hover'
            : 'border-danger/60 bg-danger/10'}"
        >
          <option value="">Select folder...</option>
          {#each filteredFolders as folder}
            <option value={folder.path}>{folder.path}</option>
          {/each}
        </select>
        {#if folderPath && !folderValid}
          <span class="text-[10px] font-mono uppercase tracking-wider text-danger"
            >Selected folder is no longer available.</span
          >
        {/if}
      </label>

      <div class="flex justify-between gap-2 pt-2">
        <button
          onclick={onCancel}
          class="px-3 py-2 rounded-lg bg-surface-active text-accent-dim hover:text-accent font-mono text-[10px] uppercase"
          >Cancel</button
        >
        <button
          onclick={onSave}
          disabled={!from.trim() || !folderPath.trim()}
          class="px-4 py-2 rounded-lg bg-brand text-base font-mono text-[10px] font-bold uppercase disabled:opacity-30"
          >Save</button
        >
      </div>
    </div>
  </div>
</div>
