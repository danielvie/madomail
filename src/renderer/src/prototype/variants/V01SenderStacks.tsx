// PROTOTYPE — Variant 1: Sender Stacks.
// Premise: the unit of triage is the sender, not the message. Rows collapse into
// one stack per sender, so 4 UW CIRCLE mails are one decision, not four.
import { useMemo, useState } from 'react'
import type { EmailMsg } from '../../types'
import { initials, senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'

type Stack = { key: string; from: string; msgs: EmailMsg[] }

export default function V01SenderStacks() {
  const ws = useWorkspace()
  const [open, setOpen] = useState<string | null>(null)
  const stacks = useMemo(() => {
    const by = new Map<string, Stack>()
    for (const message of ws.filtered) {
      const key = senderAddr(message.from)
      if (!by.has(key)) by.set(key, { key, from: message.from, msgs: [] })
      by.get(key)!.msgs.push(message)
    }
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length)
  }, [ws.filtered])
  const stackMark = (stack: Stack): string | null => {
    const marks = stack.msgs.map((message) => ws.marks[message.id])
    if (marks.every((mark) => mark === 'archive')) return 'archive'
    if (marks.every((mark) => mark === 'trash')) return 'trash'
    return marks.some(Boolean) ? 'mixed' : null
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
        <h1 className="font-mono text-xs tracking-widest text-accent-dim">SENDER STACKS</h1>
        <input
          className="ml-auto w-72 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim focus:ring-1 focus:ring-brand/50"
          placeholder="Filter senders..."
          value={ws.search}
          onChange={(event) => ws.setSearch(event.target.value)}
        />
        <span className="font-mono text-xs text-accent-dim">
          {stacks.length} senders · {ws.filtered.length} messages
        </span>
        <button
          className="rounded-md bg-brand px-3 py-1.5 font-mono text-xs text-black disabled:opacity-30"
          disabled={ws.markedCount === 0}
          onClick={() => ws.applyAll()}
        >
          APPLY {ws.markedCount || ''}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 pb-20">
        <div className="grid items-start gap-3 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
          {stacks.map((stack) => {
            const mark = stackMark(stack)
            const rule = ws.ruleFor(stack.from)
            return (
              <div
                key={stack.key}
                className={`rounded-xl border p-4 transition-colors ${mark === 'archive' ? 'border-brand/50 bg-brand/5' : mark === 'trash' ? 'border-danger/50 bg-danger/5' : 'border-white/8 bg-surface hover:border-white/20'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-active font-mono text-xs">
                    {initials(stack.from)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{senderName(stack.from)}</div>
                    <div className="truncate font-mono text-[11px] text-accent-dim">
                      {senderAddr(stack.from)}
                    </div>
                  </div>
                  <div className="shrink-0 rounded-md bg-surface-active px-2 py-0.5 font-mono text-xs">
                    {stack.msgs.length}
                  </div>
                </div>

                {rule && (
                  <div className="mt-3 font-mono text-[10px] tracking-wider text-accent-dim">
                    RULE · {rule.action.toUpperCase()} · {rule.from}
                  </div>
                )}

                <button
                  className="mt-3 w-full text-left"
                  onClick={() => setOpen((current) => (current === stack.key ? null : stack.key))}
                >
                  <div className="truncate text-xs text-accent-dim">
                    {open === stack.key ? 'Hide' : stack.msgs[0].subject}
                  </div>
                </button>

                {open === stack.key && (
                  <ul className="mt-2 space-y-1 border-l border-white/10 pl-3">
                    {stack.msgs.map((message) => (
                      <li key={message.id} className="flex items-baseline gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                        <span className="shrink-0 font-mono text-[10px] text-accent-dim">
                          {message.date}
                        </span>
                        <button
                          className="shrink-0 font-mono text-[10px] text-accent-dim hover:text-brand"
                          onClick={() => ws.mark([message.id], 'archive')}
                        >
                          A
                        </button>
                        <button
                          className="shrink-0 font-mono text-[10px] text-accent-dim hover:text-danger"
                          onClick={() => ws.mark([message.id], 'trash')}
                        >
                          D
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    className="flex-1 rounded-md bg-surface-hover py-1.5 font-mono text-[11px] hover:bg-brand hover:text-black"
                    onClick={() =>
                      ws.mark(
                        stack.msgs.map((message) => message.id),
                        'archive'
                      )
                    }
                  >
                    ARCHIVE ALL
                  </button>
                  <button
                    className="flex-1 rounded-md bg-surface-hover py-1.5 font-mono text-[11px] hover:bg-danger"
                    onClick={() =>
                      ws.mark(
                        stack.msgs.map((message) => message.id),
                        'trash'
                      )
                    }
                  >
                    DELETE ALL
                  </button>
                  <button
                    className="rounded-md bg-surface-hover px-2 py-1.5 font-mono text-[11px] hover:bg-surface-active"
                    title="Save a sender rule for this sender"
                    onClick={() => ws.addRule(stack.from, 'archive')}
                  >
                    +RULE
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
