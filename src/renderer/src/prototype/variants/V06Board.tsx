// PROTOTYPE — Variant 6: Board.
// Premise: pending marks are literally columns. Drag a message from Inbox into
// Archive or Delete; Apply All flushes both columns to Gmail.
import { useState } from 'react'
import type { EmailMsg, MarkAction } from '../../types'
import { senderName } from '../fixtures'
import { useWorkspace } from '../store'

export default function V06Board() {
  const ws = useWorkspace()
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const inbox = ws.filtered.filter((message) => !ws.marks[message.id])
  const archive = ws.inbox.filter((message) => ws.marks[message.id] === 'archive')
  const trash = ws.inbox.filter((message) => ws.marks[message.id] === 'trash')

  const drop = (target: MarkAction | 'inbox') => {
    if (!dragging) return
    if (target === 'inbox') ws.unmark([dragging])
    else ws.mark([dragging], target)
    setDragging(null)
    setOver(null)
  }
  const cycle = (id: string) => {
    const action = ws.marks[id]
    if (!action) ws.mark([id], 'archive')
    else if (action === 'archive') ws.mark([id], 'trash')
    else ws.unmark([id])
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
        <span className="font-mono text-xs tracking-widest text-accent-dim">BOARD</span>
        <input
          className="w-56 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
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
        <button
          className="ml-auto rounded-md bg-brand px-4 py-1.5 font-mono text-xs text-black disabled:opacity-30"
          disabled={ws.markedCount === 0}
          onClick={() => ws.applyAll()}
        >
          APPLY ALL ({ws.markedCount})
        </button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-3 gap-4 p-4 pb-20">
        <BoardColumn
          title="INBOX"
          accent="#8b8b92"
          items={inbox}
          target="inbox"
          dragging={dragging}
          over={over}
          setDragging={setDragging}
          setOver={setOver}
          onDrop={drop}
          onCycle={cycle}
        />
        <BoardColumn
          title="ARCHIVE"
          accent="#d6ff00"
          items={archive}
          target="archive"
          dragging={dragging}
          over={over}
          setDragging={setDragging}
          setOver={setOver}
          onDrop={drop}
          onCycle={cycle}
        />
        <BoardColumn
          title="DELETE"
          accent="#ff3333"
          items={trash}
          target="trash"
          dragging={dragging}
          over={over}
          setDragging={setDragging}
          setOver={setOver}
          onDrop={drop}
          onCycle={cycle}
        />
      </div>
    </div>
  )
}

type BoardColumnProps = {
  title: string
  accent: string
  items: EmailMsg[]
  target: MarkAction | 'inbox'
  dragging: string | null
  over: string | null
  setDragging: (id: string | null) => void
  setOver: (target: string | null) => void
  onDrop: (target: MarkAction | 'inbox') => void
  onCycle: (id: string) => void
}

function BoardColumn({
  title,
  accent,
  items,
  target,
  dragging,
  over,
  setDragging,
  setOver,
  onDrop,
  onCycle
}: BoardColumnProps) {
  return (
    <section
      role="list"
      className={`flex min-h-0 flex-col rounded-xl border transition-colors ${over === target ? 'border-brand bg-brand/5' : 'border-white/8 bg-surface/40'}`}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(target)
      }}
      onDragLeave={() => over === target && setOver(null)}
      onDrop={() => onDrop(target)}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="font-mono text-xs tracking-widest" style={{ color: accent }}>
          {title}
        </span>
        <span className="font-mono text-xs text-accent-dim">{items.length}</span>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3">
        {items.length > 0 ? (
          items.map((message) => (
            <div
              key={message.id}
              role="listitem"
              draggable
              onDragStart={() => setDragging(message.id)}
              onDragEnd={() => setDragging(null)}
              onClick={() => onCycle(message.id)}
              onKeyDown={(event) => event.key === 'Enter' && onCycle(message.id)}
              tabIndex={0}
              className={`cursor-grab rounded-lg border border-white/8 bg-surface p-3 active:cursor-grabbing ${dragging === message.id ? 'opacity-40' : 'hover:border-white/20'}`}
            >
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                  {senderName(message.from)}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-accent-dim">
                  {message.date}
                </span>
              </div>
              <div className="mt-1 line-clamp-2 text-sm">{message.subject}</div>
            </div>
          ))
        ) : (
          <div className="px-2 py-8 text-center font-mono text-[11px] text-accent-dim">
            drag cards here — or click a card to cycle it
          </div>
        )}
      </div>
    </section>
  )
}
