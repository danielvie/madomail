import type { EmailMsg } from '../types'

type Props = {
  email: EmailMsg | null
  onClose: () => void
  formatDate: (date: string) => string
}

export default function EmailReader({ email, onClose, formatDate }: Props) {
  if (!email) {
    return (
      <section
        aria-label="Email reader"
        className="h-full overflow-auto bg-panel px-4 py-4 text-sm text-ink-dim"
      >
        Click an email to read it here. Use the checkbox area to select messages.
      </section>
    )
  }

  return (
    <section
      aria-label="Email reader"
      className="flex h-full min-h-0 flex-col bg-panel"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2">
        <span className="font-mono text-[10px] tracking-widest text-ink-dim">READING</span>
        <button
          type="button"
          className="rounded px-2 py-1 font-mono text-[10px] text-ink-dim hover:bg-panel2 hover:text-ink"
          onClick={onClose}
          aria-label="Close email reader"
        >
          CLOSE ×
        </button>
      </header>
      <div key={email.id} className="min-h-0 flex-1 select-text overflow-y-auto px-5 py-4">
        <h2 className="break-words text-lg font-semibold">{email.subject || '(No subject)'}</h2>
        <div className="mt-1 break-words text-sm text-ink-dim">{email.from}</div>
        <div className="mt-1 font-mono text-[10px] text-ink-dim">{formatDate(email.date)}</div>
        <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">
          {email.body?.trim() || email.snippet?.trim() || 'No message body available.'}
        </div>
      </div>
    </section>
  )
}
