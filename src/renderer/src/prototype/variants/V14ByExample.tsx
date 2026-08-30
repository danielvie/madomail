// PROTOTYPE — Variant 14: By Example. (answers "decide faster from the entry page")
// Premise: no session, no rounds, no start button. The list is live on load. Touch one
// message and the app immediately offers the batch it belongs to — same sender, or the
// same subject shape sent repeatedly — so one decision clears many. The proposal is a
// bar, not a screen: accept it, narrow it to just this message, or ignore it and move on.
import { useMemo, useState } from 'react'
import type { EmailMsg, MarkAction } from '../../types'
import { senderAddr, senderName, subjectShape } from '../fixtures'
import { useWorkspace } from '../store'

type Proposal = { basis: 'sender' | 'subject'; label: string; msgs: EmailMsg[] }

export default function V14ByExample() {
  const ws = useWorkspace()
  const [focus, setFocus] = useState<string | null>(null)
  const live = ws.filtered.filter((message) => !ws.marks[message.id])
  const staged = ws.inbox.filter((message) => ws.marks[message.id])
  const proposal = useMemo<Proposal | null>(() => {
    const message = live.find((item) => item.id === focus)
    if (!message) return null
    const shape = subjectShape(message.subject)
    const bySubject = live.filter((item) => subjectShape(item.subject) === shape)
    if (bySubject.length > 1) {
      return { basis: 'subject', label: `"${message.subject}"`, msgs: bySubject }
    }
    const key = senderAddr(message.from)
    const bySender = live.filter((item) => senderAddr(item.from) === key)
    if (bySender.length > 1) {
      return { basis: 'sender', label: senderName(message.from), msgs: bySender }
    }
    return null
  }, [live, focus])
  const accept = (action: MarkAction, all: boolean) => {
    const ids = all && proposal ? proposal.msgs.map((message) => message.id) : focus ? [focus] : []
    ws.mark(ids, action)
    setFocus(null)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-white/5 px-4 py-2.5">
        <input
          className="w-64 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
          placeholder="Filter..."
          value={ws.search}
          onChange={(event) => ws.setSearch(event.target.value)}
        />
        <span className="font-mono text-[11px] text-accent-dim">{live.length} undecided</span>
        <span className="font-mono text-[11px] text-brand">
          {staged.filter((message) => ws.marks[message.id] === 'archive').length} archive
        </span>
        <span className="font-mono text-[11px] text-danger">
          {staged.filter((message) => ws.marks[message.id] === 'trash').length} delete
        </span>
        <button
          className="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
          disabled={staged.length === 0}
          onClick={() => ws.unmarkAll()}
        >
          undo all
        </button>
        <button
          className="rounded-md bg-brand px-4 py-1.5 font-mono text-[11px] text-black disabled:opacity-30"
          disabled={staged.length === 0}
          onClick={() => ws.applyAll()}
        >
          APPLY {staged.length}
        </button>
      </header>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {live.map((message) => {
          const inProposal = proposal?.msgs.some((item) => item.id === message.id) ?? false
          return (
            <li key={message.id}>
              <button
                className={`flex w-full items-center gap-3 border-b border-white/5 px-4 py-2 text-left text-sm ${focus === message.id ? 'bg-surface-hover' : inProposal ? 'bg-brand/10' : 'hover:bg-surface'}`}
                onClick={() => setFocus((current) => (current === message.id ? null : message.id))}
              >
                <span className="w-[28ch] shrink-0 truncate font-semibold">
                  {senderName(message.from)}
                </span>
                <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                <span className="w-[24ch] shrink-0 truncate text-xs text-accent-dim">
                  {message.snippet}
                </span>
                <span className="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim">
                  {message.date}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div
        className={`border-t transition-colors ${proposal ? 'border-brand/40 bg-brand/5' : 'border-white/10 bg-black/40'}`}
      >
        {proposal ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0">
              <div className="font-mono text-[10px] tracking-widest text-brand">
                {proposal.msgs.length} MESSAGES ·{' '}
                {proposal.basis === 'subject' ? 'SAME SUBJECT, SENT REPEATEDLY' : 'SAME SENDER'}
              </div>
              <div className="mt-0.5 truncate text-sm">{proposal.label}</div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <button
                className="rounded-md bg-brand px-4 py-2 font-mono text-[11px] text-black"
                onClick={() => accept('archive', true)}
              >
                ARCHIVE ALL {proposal.msgs.length}
              </button>
              <button
                className="rounded-md bg-danger px-4 py-2 font-mono text-[11px] text-black"
                onClick={() => accept('trash', true)}
              >
                DELETE ALL {proposal.msgs.length}
              </button>
              <span className="mx-1 h-6 w-px bg-white/10" />
              <button
                className="rounded-md bg-surface-hover px-3 py-2 font-mono text-[11px] hover:bg-surface-active"
                onClick={() => accept('archive', false)}
              >
                just this one — A
              </button>
              <button
                className="rounded-md bg-surface-hover px-3 py-2 font-mono text-[11px] hover:bg-surface-active"
                onClick={() => accept('trash', false)}
              >
                D
              </button>
              <button
                className="px-2 font-mono text-[11px] text-accent-dim hover:text-accent"
                onClick={() => setFocus(null)}
              >
                dismiss
              </button>
            </div>
          </div>
        ) : focus ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="font-mono text-[11px] text-accent-dim">
              Nothing else looks like this one — a single decision.
            </span>
            <div className="ml-auto flex gap-2">
              <button
                className="rounded-md bg-surface-hover px-4 py-2 font-mono text-[11px] hover:bg-brand hover:text-black"
                onClick={() => accept('archive', false)}
              >
                ARCHIVE
              </button>
              <button
                className="rounded-md bg-surface-hover px-4 py-2 font-mono text-[11px] hover:bg-danger"
                onClick={() => accept('trash', false)}
              >
                DELETE
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 font-mono text-[11px] text-accent-dim">
            Click any row — Mado offers the whole batch it belongs to.
          </div>
        )}
      </div>
    </div>
  )
}
