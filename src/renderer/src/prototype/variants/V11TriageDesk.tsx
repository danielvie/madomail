// PROTOTYPE — Variant 11: Triage Desk. (from feedback on 3 + 7)
// Premise: keep Commander's staging column and give it a reading pane, so you never
// leave the screen to find out what something is. Inbox | Reader | Staged.
// Bulk first: shift-click ranges, "+N from this sender" on every row.
import { useEffect, useState } from 'react'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'

export default function V11TriageDesk() {
  const ws = useWorkspace()
  const [cursorId, setCursorId] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<string | null>(null)
  const pending = ws.filtered.filter((message) => !ws.marks[message.id])
  const staged = ws.inbox.filter((message) => ws.marks[message.id])
  const current = ws.inbox.find((message) => message.id === cursorId) ?? pending[0]
  const selection = ws.selection

  const sameSender = (id: string) => {
    const message = ws.inbox.find((item) => item.id === id)
    if (!message) return []
    const key = senderAddr(message.from)
    return pending.filter((item) => senderAddr(item.from) === key).map((item) => item.id)
  }
  const click = (id: string, event: React.MouseEvent) => {
    setCursorId(id)
    if (event.shiftKey && anchor) {
      const ids = pending.map((message) => message.id)
      const [a, b] = [ids.indexOf(anchor), ids.indexOf(id)].sort((x, y) => x - y)
      ws.setSelection(new Set([...selection, ...ids.slice(a, b + 1)]))
    } else {
      setAnchor(id)
      ws.toggle(id)
    }
  }
  const scope = (id: string) => (selection.size && selection.has(id) ? [...selection] : [id])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.target instanceof HTMLInputElement) return
      const ids = pending.map((message) => message.id)
      const index = ids.indexOf(current?.id ?? '')
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setCursorId(ids[Math.min(index + 1, ids.length - 1)])
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setCursorId(ids[Math.max(0, index - 1)])
      } else if (event.key === 'a' && current) {
        ws.mark(scope(current.id), 'archive')
      } else if (event.key === 'd' && current) {
        ws.mark(scope(current.id), 'trash')
      } else if (event.key === 'Enter') {
        ws.applyAll()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, pending, selection, anchor, ws])

  return (
    <div className="grid h-full grid-cols-[minmax(0,1.15fr)_minmax(0,1.25fr)_minmax(260px,0.75fr)] divide-x divide-white/5">
      <section className="flex min-h-0 flex-col">
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            className="min-w-0 flex-1 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
            placeholder="Filter..."
            value={ws.search}
            onChange={(event) => ws.setSearch(event.target.value)}
          />
          <span className="shrink-0 font-mono text-[11px] text-accent-dim">{pending.length}</span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {pending.map((message) => {
            const duplicates = sameSender(message.id).length - 1
            return (
              <li
                key={message.id}
                className={`group flex items-center gap-2 border-l-2 pr-2 text-sm ${current?.id === message.id ? 'border-brand bg-surface-hover' : 'border-transparent hover:bg-surface'} ${selection.has(message.id) ? 'bg-brand/10' : ''}`}
              >
                <button
                  className="min-w-0 flex-1 py-2 pl-3 text-left"
                  onClick={(event) => click(message.id, event)}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                      {senderName(message.from)}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-accent-dim">
                      {message.date}
                    </span>
                  </div>
                  <div className="truncate">{message.subject}</div>
                </button>
                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
                  {duplicates > 0 && (
                    <button
                      className="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                      title={`Select all ${duplicates + 1} from this sender`}
                      onClick={() =>
                        ws.setSelection(new Set([...selection, ...sameSender(message.id)]))
                      }
                    >
                      +{duplicates}
                    </button>
                  )}
                  <button
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                    onClick={() => ws.mark(scope(message.id), 'archive')}
                  >
                    A
                  </button>
                  <button
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
                    onClick={() => ws.mark(scope(message.id), 'trash')}
                  >
                    D
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex items-center gap-2 border-t border-white/5 px-3 py-2">
          <span className="font-mono text-[11px] text-accent-dim">{selection.size} selected</span>
          <button
            className="ml-auto rounded bg-surface-hover px-3 py-1 font-mono text-[11px] hover:bg-brand hover:text-black disabled:opacity-30"
            disabled={selection.size === 0}
            onClick={() => ws.mark([...selection], 'archive')}
          >
            ARCHIVE
          </button>
          <button
            className="rounded bg-surface-hover px-3 py-1 font-mono text-[11px] hover:bg-danger disabled:opacity-30"
            disabled={selection.size === 0}
            onClick={() => ws.mark([...selection], 'trash')}
          >
            DELETE
          </button>
        </div>
      </section>

      <section className="flex min-h-0 flex-col bg-black/20">
        {current ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold">{senderName(current.from)}</div>
                <div className="truncate font-mono text-[10px] text-accent-dim">
                  {senderAddr(current.from)}
                </div>
              </div>
              <button
                className="shrink-0 rounded px-2 py-1 font-mono text-[10px] text-accent-dim hover:bg-surface-hover hover:text-accent"
                title="Save a sender rule and stage every message it matches"
                onClick={() => {
                  ws.addRule(current.from, 'archive')
                  ws.runQuery()
                }}
              >
                ALWAYS ARCHIVE
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
              <h2 className="text-lg leading-snug">{current.subject}</h2>
              <div className="mt-1 font-mono text-[10px] text-accent-dim">{current.date}</div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-accent-dim">
                {current.body}
              </p>
            </div>
            <div className="flex gap-2 border-t border-white/5 p-3">
              <button
                className="flex-1 rounded-md bg-surface-hover py-2 font-mono text-[11px] hover:bg-brand hover:text-black"
                onClick={() => ws.mark(scope(current.id), 'archive')}
              >
                ARCHIVE — A
              </button>
              <button
                className="flex-1 rounded-md bg-surface-hover py-2 font-mono text-[11px] hover:bg-danger"
                onClick={() => ws.mark(scope(current.id), 'trash')}
              >
                DELETE — D
              </button>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-accent-dim">Inbox empty</div>
        )}
      </section>

      <section className="flex min-h-0 flex-col bg-black/40">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="font-mono text-[11px] tracking-widest text-accent-dim">STAGED</span>
          <span className="font-mono text-[11px] text-accent-dim">{staged.length}</span>
          <button
            className="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
            disabled={staged.length === 0}
            onClick={() => ws.unmarkAll()}
          >
            clear
          </button>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {staged.length > 0 ? (
            staged.map((message) => {
              const action = ws.marks[message.id]
              return (
                <li
                  key={message.id}
                  className={`group flex items-center gap-2 border-l-2 py-1.5 pl-2 pr-2 text-xs ${action === 'archive' ? 'border-brand' : 'border-danger'}`}
                >
                  <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                  <button
                    className="shrink-0 font-mono text-[10px] text-accent-dim opacity-0 group-hover:opacity-100 hover:text-accent"
                    onClick={() => ws.unmark([message.id])}
                  >
                    ×
                  </button>
                </li>
              )
            })
          ) : (
            <li className="px-3 py-6 text-center text-xs text-accent-dim">
              Nothing staged yet. A / D on any row.
            </li>
          )}
        </ul>
        <div className="border-t border-white/5 p-3">
          <button
            className="w-full rounded-md bg-brand py-2 font-mono text-[11px] text-black disabled:opacity-30"
            disabled={staged.length === 0}
            onClick={() => ws.applyAll()}
          >
            APPLY {staged.length} — ENTER
          </button>
        </div>
      </section>
    </div>
  )
}
