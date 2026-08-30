// PROTOTYPE — Variant 15: Marked Table. (the conservative control)
// Premise: the density of today's table is not the problem — the lack of feedback is.
// Same table, four changes: marked rows stay in place and are painted, so you can see
// what you decided and change your mind; shift-click selects a range; a sender chip
// grabs every message from that sender; the footer is a running ledger, not a counter.
import { useState } from 'react'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'

export default function V15MarkedTable() {
  const ws = useWorkspace()
  const [anchor, setAnchor] = useState<string | null>(null)
  const [peek, setPeek] = useState<string | null>(null)
  const rows = ws.filtered
  const selection = ws.selection
  const staged = ws.inbox.filter((message) => ws.marks[message.id])
  const scope = (id: string) => (selection.size && selection.has(id) ? [...selection] : [id])
  const click = (id: string, event: React.MouseEvent) => {
    if (event.shiftKey && anchor) {
      const ids = rows.map((message) => message.id)
      const [a, b] = [ids.indexOf(anchor), ids.indexOf(id)].sort((x, y) => x - y)
      ws.setSelection(new Set([...selection, ...ids.slice(a, b + 1)]))
    } else {
      setAnchor(id)
      ws.toggle(id)
    }
  }
  const senderIds = (from: string) =>
    rows
      .filter((message) => senderAddr(message.from) === senderAddr(from))
      .map((message) => message.id)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <input
          className="w-72 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
          placeholder="Search..."
          value={ws.search}
          onChange={(event) => ws.setSearch(event.target.value)}
        />
        <button
          className="rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] hover:bg-surface-hover"
          onClick={() => ws.runQuery()}
        >
          RUN QUERY
        </button>
        <span className="font-mono text-[11px] text-accent-dim">{rows.length} messages</span>
        <label className="ml-auto flex items-center gap-2 font-mono text-[11px] text-accent-dim">
          <input
            type="checkbox"
            checked={ws.autoApply}
            onChange={(event) => ws.setAutoApply(event.target.checked)}
            className="accent-[#d6ff00]"
          />{' '}
          auto-apply
        </label>
      </header>

      <div className="flex gap-3 border-b border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim">
        <span className="w-5 shrink-0" />
        <span className="w-[30ch] shrink-0">FROM</span>
        <span className="min-w-0 flex-1">SUBJECT</span>
        <span className="w-[16ch] shrink-0 text-right">DATE</span>
        <span className="w-[13ch] shrink-0" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((message) => {
          const action = ws.marks[message.id]
          const selected = selection.has(message.id)
          return (
            <div
              key={message.id}
              className={`group flex items-center gap-3 border-b border-white/5 px-3 text-sm ${action === 'archive' ? 'bg-brand/10' : action === 'trash' ? 'bg-danger/10' : selected ? 'bg-surface-active' : 'hover:bg-surface'}`}
            >
              <span
                className={`w-5 shrink-0 font-mono text-[10px] ${action === 'archive' ? 'text-brand' : action === 'trash' ? 'text-danger' : 'text-accent-dim'}`}
              >
                {action === 'archive' ? 'A' : action === 'trash' ? 'D' : ''}
              </span>
              <button
                className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left"
                onClick={(event) => click(message.id, event)}
                onMouseEnter={() => setPeek(message.id)}
                onMouseLeave={() => setPeek(null)}
              >
                <span
                  className={`w-[30ch] shrink-0 truncate font-semibold ${action ? 'line-through opacity-60' : ''}`}
                >
                  {senderName(message.from)}
                </span>
                <span
                  className={`min-w-0 flex-1 truncate ${action ? 'line-through opacity-60' : ''}`}
                >
                  {message.subject}
                </span>
                <span className="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim">
                  {message.date}
                </span>
              </button>
              <span className="flex w-[13ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
                {action ? (
                  <button
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-surface-active"
                    onClick={() => ws.unmark(scope(message.id))}
                  >
                    UNDO
                  </button>
                ) : (
                  <>
                    <button
                      className="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-surface-hover"
                      title={`Select all ${senderIds(message.from).length} from ${senderName(message.from)}`}
                      onClick={() =>
                        ws.setSelection(new Set([...selection, ...senderIds(message.from)]))
                      }
                    >
                      ⋮{senderIds(message.from).length}
                    </button>
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
                  </>
                )}
              </span>
            </div>
          )
        })}
      </div>

      {peek &&
        (() => {
          const message = ws.inbox.find((item) => item.id === peek)
          return message ? (
            <div className="border-t border-white/5 bg-black/50 px-3 py-1.5">
              <div className="truncate text-xs">{message.subject}</div>
              <div className="truncate text-[11px] text-accent-dim">{message.snippet}</div>
            </div>
          ) : null
        })()}

      <div className="flex items-center gap-3 border-t border-white/10 bg-black/60 px-3 py-2">
        <span className="font-mono text-[11px] text-accent-dim">{selection.size} selected</span>
        <span className="font-mono text-[11px] text-brand">
          {staged.filter((message) => ws.marks[message.id] === 'archive').length} to archive
        </span>
        <span className="font-mono text-[11px] text-danger">
          {staged.filter((message) => ws.marks[message.id] === 'trash').length} to delete
        </span>
        <div className="ml-auto flex gap-2">
          <button
            className="rounded-md bg-surface-hover px-3 py-1 font-mono text-[11px] hover:bg-brand hover:text-black disabled:opacity-30"
            disabled={selection.size === 0}
            onClick={() => ws.mark([...selection], 'archive')}
          >
            ARCHIVE SEL
          </button>
          <button
            className="rounded-md bg-surface-hover px-3 py-1 font-mono text-[11px] hover:bg-danger disabled:opacity-30"
            disabled={selection.size === 0}
            onClick={() => ws.mark([...selection], 'trash')}
          >
            DELETE SEL
          </button>
          <button
            className="rounded-md px-3 py-1 font-mono text-[11px] text-accent-dim hover:text-accent disabled:opacity-30"
            disabled={staged.length === 0}
            onClick={() => ws.unmarkAll()}
          >
            UNMARK ALL
          </button>
          <button
            className="rounded-md bg-brand px-4 py-1 font-mono text-[11px] text-black disabled:opacity-30"
            disabled={staged.length === 0}
            onClick={() => ws.applyAll()}
          >
            APPLY {staged.length}
          </button>
        </div>
      </div>
    </div>
  )
}
