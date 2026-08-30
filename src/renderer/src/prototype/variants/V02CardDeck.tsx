// PROTOTYPE — Variant 2: Card Deck.
// Premise: no list at all. One message fills the screen; you decide and it is gone.
// Left = archive, right = delete, down = skip, U = undo. The peek is the whole UI.
import { useEffect, useState } from 'react'
import type { MarkAction } from '../../types'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'

type HistoryEntry = { id: string; action: MarkAction | 'skip' }

export default function V02CardDeck() {
  const ws = useWorkspace()
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [flash, setFlash] = useState<'archive' | 'trash' | null>(null)
  const deck = ws.inbox.filter((message) => !ws.marks[message.id])
  const card = deck[index]
  const done = ws.inbox.length - deck.length

  const decide = (action: MarkAction) => {
    if (!card) return
    setFlash(action)
    window.setTimeout(() => setFlash(null), 160)
    setHistory((current) => [...current, { id: card.id, action }])
    ws.mark([card.id], action)
    if (index >= deck.length - 1) setIndex(Math.max(0, deck.length - 2))
  }
  const skip = () => {
    if (!card) return
    setHistory((current) => [...current, { id: card.id, action: 'skip' }])
    setIndex((current) => (current + 1) % Math.max(1, deck.length))
  }
  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((current) => current.slice(0, -1))
    if (last.action !== 'skip') ws.unmark([last.id])
    setIndex(Math.max(0, index - 1))
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey) return
      if (event.key === 'ArrowLeft') decide('archive')
      else if (event.key === 'ArrowRight') decide('trash')
      else if (event.key === 'ArrowDown' || event.key === ' ') skip()
      else if (event.key.toLowerCase() === 'u') undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6">
      <div className="absolute inset-x-0 top-0 flex items-center gap-4 px-6 py-4">
        <span className="font-mono text-xs tracking-widest text-accent-dim">CARD DECK</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${(done / Math.max(1, ws.inbox.length)) * 100}%` }}
          />
        </div>
        <span className="font-mono text-xs text-accent-dim">
          {done} / {ws.inbox.length}
        </span>
        <button
          className="rounded-md bg-brand px-3 py-1 font-mono text-xs text-black disabled:opacity-30"
          disabled={ws.markedCount === 0}
          onClick={() => {
            ws.applyAll()
            setIndex(0)
            setHistory([])
          }}
        >
          APPLY {ws.markedCount || ''}
        </button>
      </div>

      {card ? (
        <>
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-x-6 -top-4 h-full rounded-2xl border border-white/5 bg-surface/40" />
            <div className="absolute inset-x-3 -top-2 h-full rounded-2xl border border-white/5 bg-surface/70" />
            <div
              className={`relative rounded-2xl border p-8 transition-colors duration-150 ${flash === 'archive' ? 'border-brand bg-brand/10' : flash === 'trash' ? 'border-danger bg-danger/10' : 'border-white/10 bg-surface'}`}
            >
              <div className="font-mono text-[11px] tracking-wider text-accent-dim">
                {card.date}
              </div>
              <div className="mt-4 text-lg font-semibold">{senderName(card.from)}</div>
              <div className="font-mono text-xs text-accent-dim">{senderAddr(card.from)}</div>
              <h2 className="mt-6 text-2xl leading-snug">{card.subject}</h2>
              <p className="mt-4 max-h-40 overflow-y-auto text-sm leading-relaxed text-accent-dim">
                {card.body}
              </p>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <button
              className="rounded-full border border-brand/40 px-6 py-2.5 font-mono text-xs text-brand hover:bg-brand hover:text-black"
              onClick={() => decide('archive')}
            >
              ← ARCHIVE
            </button>
            <button
              className="rounded-full border border-white/15 px-5 py-2.5 font-mono text-xs text-accent-dim hover:text-accent"
              onClick={skip}
            >
              ↓ SKIP
            </button>
            <button
              className="rounded-full border border-danger/40 px-6 py-2.5 font-mono text-xs text-danger hover:bg-danger hover:text-black"
              onClick={() => decide('trash')}
            >
              DELETE →
            </button>
            <button
              className="rounded-full px-4 py-2.5 font-mono text-xs text-accent-dim hover:text-accent disabled:opacity-30"
              disabled={history.length === 0}
              onClick={undo}
            >
              U UNDO
            </button>
          </div>
          <div className="mt-4 font-mono text-[11px] text-accent-dim">
            arrow keys decide · space skips · u undoes
          </div>
        </>
      ) : (
        <div className="text-center">
          <div className="text-4xl">Inbox clear</div>
          <div className="mt-3 font-mono text-xs text-accent-dim">
            {ws.markedCount} pending marks waiting for Apply All
          </div>
        </div>
      )}
    </div>
  )
}
