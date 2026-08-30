<script lang="ts">
  let {
    error,
    authCode,
    actionInProgress,
    onAuthCodeChange,
    onAuthorize
  }: {
    error: string;
    authCode: string;
    actionInProgress: boolean;
    onAuthCodeChange: (value: string) => void;
    onAuthorize: () => void;
  } = $props();
</script>

<div class="mb-4 p-4 bg-danger/10 border border-danger/50 text-danger rounded-lg text-xs font-mono shrink-0 whitespace-pre-wrap break-all leading-relaxed flex flex-col gap-3">
  <div>
    <strong>ERROR:</strong>
    {@html error.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="underline hover:text-white transition-colors">$1</a>')}
  </div>

  {#if error.includes('TOKEN REQUIRED')}
    <div class="flex gap-2 items-center p-2 bg-danger/20 rounded border border-danger/30">
      <input
        type="text"
        value={authCode}
        oninput={(event) => onAuthCodeChange(event.currentTarget.value)}
        placeholder="Paste authorization code here..."
        class="flex-1 bg-panel text-danger px-3 py-1.5 rounded border border-danger/50 focus:outline-none focus:border-brand text-xs"
      />
      <button
        onclick={onAuthorize}
        disabled={!authCode || actionInProgress}
        class="px-4 py-1.5 bg-brand text-on-brand font-bold rounded uppercase text-[10px] hover:bg-brand/80 transition-all disabled:opacity-50"
      >
        Authorize
      </button>
    </div>
  {/if}
</div>
