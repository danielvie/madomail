<script lang="ts">
  let { error }: { error: string } = $props()

  let copied = $state(false)

  async function copyError() {
    try {
      await navigator.clipboard.writeText(error)
      copied = true
      setTimeout(() => {
        copied = false
      }, 1200)
    } catch (copy_error) {
      console.error('Failed to copy error message', copy_error)
    }
  }
</script>

<div
  class="mb-4 rounded-lg border border-danger/50 bg-danger/10 p-4 text-danger text-xs font-mono shrink-0 whitespace-pre-wrap break-all leading-relaxed"
>
  <div class="mb-3 flex items-start justify-between gap-3">
    <strong>ERROR:</strong>
    <button
      type="button"
      onclick={copyError}
      class="rounded border border-danger/40 bg-danger/10 px-2 py-1 text-[10px] uppercase tracking-wider text-danger transition-all hover:bg-danger/20 hover:text-white"
    >
      {copied ? 'Copied' : 'Copy Msg'}
    </button>
  </div>

  <div>
    {@html error.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="underline hover:text-white transition-colors">$1</a>'
    )}
  </div>
</div>
