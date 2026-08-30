// PROTOTYPE — Variant 3: Commander.
// Premise: make the pending marks a real place. Inbox on the left, a staging pane on
// the right holding everything you have decided but not yet sent to Gmail.
import { useState } from 'react'
import { senderName } from '../fixtures'
import { useWorkspace } from '../store'

export default function V03Commander() {
  const ws = useWorkspace()
  const [cursor, setCursor] = useState(0)
  const [pane, setPane] = useState<'left' | 'right'>('left')
  const staged = ws.inbox.filter((message) => ws.marks[message.id])
  const pending = ws.filtered.filter((message) => !ws.marks[message.id])
  const selection = ws.selection
  const targets = (id: string) => (selection.size && selection.has(id) ? [...selection] : [id])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
        <span className="font-mono text-xs tracking-widest text-accent-dim">COMMANDER</span>
        <input
          className="w-64 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
          placeholder="Filter..."
          value={ws.search}
          onChange={(event) => ws.setSearch(event.target.value)}
        />
        <button
          className="rounded-md border border-white/10 px-3 py-1.5 font-mono text-xs hover:bg-surface-hover"
          onClick={() => ws.runQuery()}
        >
          RUN QUERY
        </button>
        <label className="flex items-center gap-2 font-mono text-xs text-accent-dim">
          <input
            type="checkbox"
            checked={ws.autoApply}
            onChange={(event) => ws.setAutoApply(event.target.checked)}
            className="accent-[#d6ff00]"
          />{' '}
          auto-apply
        </label>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2 divide-x divide-white/5">
        <div
          className={`flex min-h-0 flex-col ${pane === 'left' ? '' : 'opacity-60'}`}
          onFocus={() => setPane('left')}
        >
          <div className="flex items-center justify-between px-4 py-2 font-mono text-[11px] text-accent-dim">
            <span>INBOX · {pending.length}</span>
            <span>{selection.size} selected</span>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto pb-20">
            {pending.map((message, index) => (
              <li key={message.id}>
                <button
                  className={`flex w-full items-center gap-3 border-l-2 px-4 py-2 text-left text-sm ${cursor === index && pane === 'left' ? 'border-brand bg-surface-hover' : 'border-transparent hover:bg-surface'} ${selection.has(message.id) ? 'bg-brand/10' : ''}`}
                  onClick={() => {
                    setCursor(index)
                    setPane('left')
                    ws.toggle(message.id)
                  }}
                >
                  <span className="w-40 shrink-0 truncate text-xs">{senderName(message.from)}</span>
                  <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                  <span className="shrink-0 font-mono text-[10px] text-accent-dim">
                    {message.date}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 border-t border-white/5 p-3">
            <button
              className="flex-1 rounded-md bg-surface-hover py-2 font-mono text-xs hover:bg-brand hover:text-black disabled:opacity-30"
              disabled={selection.size === 0}
              onClick={() => ws.mark([...selection], 'archive')}
            >
              STAGE ARCHIVE →
            </button>
            <button
              className="flex-1 rounded-md bg-surface-hover py-2 font-mono text-xs hover:bg-danger disabled:opacity-30"
              disabled={selection.size === 0}
              onClick={() => ws.mark([...selection], 'trash')}
            >
              STAGE DELETE →
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-col bg-black/30" onFocus={() => setPane('right')}>
          <div className="flex items-center justify-between px-4 py-2 font-mono text-[11px] text-accent-dim">
            <span>STAGED · {staged.length}</span>
            <button className="hover:text-accent" onClick={() => ws.unmarkAll()}>
              clear all
            </button>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto pb-20">
            {staged.length > 0 ? (
              staged.map((message) => {
                const action = ws.marks[message.id]
                return (
                  <li
                    key={message.id}
                    className={`flex items-center gap-3 border-l-2 px-4 py-2 text-sm ${action === 'archive' ? 'border-brand' : 'border-danger'}`}
                  >
                    <span
                      className={`w-16 shrink-0 font-mono text-[10px] ${action === 'archive' ? 'text-brand' : 'text-danger'}`}
                    >
                      {action === 'archive' ? 'ARCHIVE' : 'DELETE'}
                    </span>
                    <span className="w-32 shrink-0 truncate text-xs text-accent-dim">
                      {senderName(message.from)}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                    <button
                      className="shrink-0 font-mono text-[10px] text-accent-dim hover:text-accent"
                      onClick={() => ws.unmark(targets(message.id))}
                    >
                      ←
                    </button>
                  </li>
                )
              })
            ) : (
              <li className="px-4 py-10 text-center text-sm text-accent-dim">
                Nothing staged. Select messages on the left and stage an action.
              </li>
            )}
          </ul>
          <div className="border-t border-white/5 p-3">
            <button
              className="w-full rounded-md bg-brand py-2 font-mono text-xs text-black disabled:opacity-30"
              disabled={staged.length === 0}
              onClick={() => ws.applyAll()}
            >
              APPLY ALL TO GMAIL ({staged.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
