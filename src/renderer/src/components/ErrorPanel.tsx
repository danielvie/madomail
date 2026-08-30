type Props = {
  error: string
  authCode: string
  actionInProgress: boolean
  onAuthCodeChange: (value: string) => void
  onAuthorize: () => void
}
export default function ErrorPanel({
  error,
  authCode,
  actionInProgress,
  onAuthCodeChange,
  onAuthorize
}: Props) {
  const parts = error.split(/(https?:\/\/[^\s]+)/g)
  return (
    <div className="mb-4 flex shrink-0 flex-col gap-3 whitespace-pre-wrap break-all rounded-lg border border-danger/50 bg-danger/10 p-4 font-mono text-xs leading-relaxed text-danger">
      <div>
        <strong>ERROR:</strong>{' '}
        {parts.map((part, i) =>
          /^https?:\/\//.test(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-white"
            >
              {part}
            </a>
          ) : (
            part
          )
        )}
      </div>
      {error.includes('TOKEN REQUIRED') && (
        <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/20 p-2">
          <input
            value={authCode}
            onChange={(e) => onAuthCodeChange(e.target.value)}
            placeholder="Paste authorization code here..."
            className="flex-1 rounded border border-danger/50 bg-panel px-3 py-1.5 text-danger outline-none"
          />
          <button
            onClick={onAuthorize}
            disabled={!authCode || actionInProgress}
            className="rounded bg-brand px-4 py-1.5 text-[10px] font-bold uppercase text-on-brand disabled:opacity-50"
          >
            Authorize
          </button>
        </div>
      )}
    </div>
  )
}
