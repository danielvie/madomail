<script lang="ts">
  import type { MarkAction } from '../types';

  let {
    from,
    action,
    onFromChange,
    onActionChange,
    onCancel,
    onSave
  }: {
    from: string;
    action: MarkAction;
    onFromChange: (value: string) => void;
    onActionChange: (value: MarkAction) => void;
    onCancel: () => void;
    onSave: () => void;
  } = $props();
</script>

<div class="fixed inset-0 z-50 bg-canvas/60 flex items-center justify-center p-4" onclick={onCancel}>
  <div class="w-full max-w-md rounded-xl border border-line bg-panel shadow-2xl" onclick={(e) => e.stopPropagation()}>
    <div class="border-b border-line px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
      Marked Item
    </div>
    <div class="p-4 flex flex-col gap-4">
      <label class="flex flex-col gap-2">
        <span class="font-mono text-[10px] uppercase tracking-wider text-ink-dim">From</span>
        <input
          type="text"
          value={from}
          oninput={(event) => onFromChange(event.currentTarget.value)}
          class="w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
        />
      </label>

      <div class="flex flex-col gap-2">
        <span class="font-mono text-[10px] uppercase tracking-wider text-ink-dim">Mark</span>
        <div class="grid grid-cols-2 gap-2">
          <button onclick={() => onActionChange('archive')} class="rounded-lg border px-3 py-2 font-mono text-[10px] uppercase transition-all {action === 'archive' ? 'border-brand bg-brand text-on-brand' : 'border-line bg-panel2 text-ink-dim hover:text-ink'}">Archive</button>
          <button onclick={() => onActionChange('trash')} class="rounded-lg border px-3 py-2 font-mono text-[10px] uppercase transition-all {action === 'trash' ? 'border-danger bg-danger text-on-danger' : 'border-line bg-panel2 text-ink-dim hover:text-ink'}">Delete</button>
        </div>
      </div>

      <div class="flex justify-between gap-2 pt-2">
        <button onclick={onCancel} class="px-3 py-2 rounded-lg bg-panel3 text-ink-dim hover:text-ink font-mono text-[10px] uppercase">Cancel</button>
        <button onclick={onSave} disabled={!from.trim()} class="px-4 py-2 rounded-lg bg-brand text-on-brand font-mono text-[10px] font-bold uppercase disabled:opacity-30">Save</button>
      </div>
    </div>
  </div>
</div>
