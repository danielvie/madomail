// PROTOTYPE — Variant 7: Three Pane.
// Premise: replace the Ctrl-hover peek with a permanent reading pane, and give
// senders a real sidebar so filtering is a click instead of a typed query.
import { useMemo, useState } from 'react'
import { initials, senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'

export default function V07ThreePane() {
  const ws = useWorkspace()
  const [sender, setSender] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const senders = useMemo(() => {
    const by = new Map<string, { from: string; n: number }>()
    for (const message of ws.inbox) {
      const key = senderAddr(message.from)
      by.set(key, { from: message.from, n: (by.get(key)?.n ?? 0) + 1 })
    }
    return [...by.entries()].sort((a, b) => b[1].n - a[1].n)
  }, [ws.inbox])
  const list = ws.filtered.filter((message) => !sender || senderAddr(message.from) === sender)
  const current = ws.inbox.find((message) => message.id === openId) ?? list[0]

  return (
    <div className="grid h-full grid-cols-[220px_minmax(0,1fr)_minmax(0,1.1fr)] divide-x divide-white/5">
      <aside className="flex min-h-0 flex-col">
        <div className="px-4 py-3 font-mono text-[11px] tracking-widest text-accent-dim">
          SENDERS
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto pb-20">
          <button
            className={`flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm ${sender === null ? 'bg-surface-hover' : 'hover:bg-surface'}`}
            onClick={() => setSender(null)}
          >
            <span className="flex-1">All Inbox</span>
            <span className="font-mono text-[10px] text-accent-dim">{ws.inbox.length}</span>
          </button>
          {senders.map(([key, summary]) => {
            const rule = ws.ruleFor(summary.from)
            return (
              <button
                key={key}
                className={`flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm ${sender === key ? 'bg-surface-hover' : 'hover:bg-surface'}`}
                onClick={() => setSender(key)}
              >
                <span className="min-w-0 flex-1 truncate">{senderName(summary.from)}</span>
                {rule && (
                  <span
                    className="size-1.5 rounded-full"
                    style={{ background: rule.action === 'archive' ? '#d6ff00' : '#ff3333' }}
                    title={`rule: ${rule.action}`}
                  />
                )}
                <span className="font-mono text-[10px] text-accent-dim">{summary.n}</span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col">
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            className="flex-1 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
            placeholder="Search..."
            value={ws.search}
            onChange={(event) => ws.setSearch(event.target.value)}
          />
          <button
            className="rounded-md bg-brand px-3 py-1.5 font-mono text-xs text-black disabled:opacity-30"
            disabled={ws.markedCount === 0}
            onClick={() => ws.applyAll()}
          >
            APPLY {ws.markedCount || ''}
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto pb-20">
          {list.map((message) => {
            const action = ws.marks[message.id]
            return (
              <li key={message.id}>
                <button
                  className={`w-full border-b border-white/5 px-4 py-3 text-left ${current?.id === message.id ? 'bg-surface-hover' : 'hover:bg-surface'} ${action ? 'opacity-50' : ''}`}
                  onClick={() => setOpenId(message.id)}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {senderName(message.from)}
                    </span>
                    {action && (
                      <span
                        className={`font-mono text-[10px] ${action === 'archive' ? 'text-brand' : 'text-danger'}`}
                      >
                        {action}
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-[10px] text-accent-dim">
                      {message.date}
                    </span>
                  </div>
                  <div className="truncate text-sm">{message.subject}</div>
                  <div className="truncate text-xs text-accent-dim">{message.snippet}</div>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex min-h-0 flex-col bg-black/25">
        {current ? (
          <>
            <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
              <div className="grid size-8 place-items-center rounded-lg bg-surface-active font-mono text-[10px]">
                {initials(current.from)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{senderName(current.from)}</div>
                <div className="truncate font-mono text-[10px] text-accent-dim">
                  {senderAddr(current.from)}
                </div>
              </div>
              <button
                className="rounded-md px-3 py-1.5 font-mono text-[11px] hover:bg-brand hover:text-black"
                onClick={() => ws.mark([current.id], 'archive')}
              >
                ARCHIVE
              </button>
              <button
                className="rounded-md px-3 py-1.5 font-mono text-[11px] hover:bg-danger"
                onClick={() => ws.mark([current.id], 'trash')}
              >
                DELETE
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-20 pt-5">
              <h2 className="text-xl leading-snug">{current.subject}</h2>
              <div className="mt-1 font-mono text-[11px] text-accent-dim">{current.date}</div>
              <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-accent-dim">
                {current.body}
              </p>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-accent-dim">
            No message selected
          </div>
        )}
      </section>
    </div>
  )
}
