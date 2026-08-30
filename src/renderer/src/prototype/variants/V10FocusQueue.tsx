// PROTOTYPE — Variant 10: Focus Queue.
// Premise: triage is a session, not a screen you live in. Five at a time, a visible
// finish line, and one confirmation at the end of each batch.
import { useState } from 'react'
import type { EmailMsg, MarkAction } from '../../types'
import { senderName } from '../fixtures'
import { useWorkspace } from '../store'

const BATCH = 5

export default function V10FocusQueue() {
  const ws = useWorkspace()
  const [queue, setQueue] = useState<string[]>(() => ws.inbox.map((message) => message.id))
  const [started, setStarted] = useState(false)
  const [round, setRound] = useState(0)
  const total = ws.inbox.length
  const batch = queue
    .slice(0, BATCH)
    .map((id) => ws.inbox.find((message) => message.id === id))
    .filter((message): message is EmailMsg => Boolean(message))
  const left = queue.length
  const decided = batch.filter((message) => Boolean(ws.marks[message.id])).length

  const decide = (id: string, action: MarkAction) => ws.mark([id], action)
  const keep = (id: string) => setQueue((current) => current.filter((item) => item !== id))
  const commitBatch = () => {
    const markedIds = new Set(Object.keys(ws.marks))
    ws.applyAll()
    setQueue((current) => current.filter((id) => !markedIds.has(id)))
    setRound((current) => current + 1)
  }
  const startWithRules = () => {
    ws.runQuery()
    setStarted(true)
  }
  const runAgain = () => {
    ws.reset()
    setQueue(ws.inbox.map((message) => message.id))
    setStarted(false)
    setRound(0)
  }

  return (
    <div className="flex h-full flex-col items-center overflow-y-auto">
      {!started ? (
        <div className="m-auto max-w-md text-center">
          <div className="font-mono text-xs tracking-widest text-brand">TRIAGE SESSION</div>
          <h1 className="mt-4 text-4xl font-light">{total} messages</h1>
          <p className="mt-4 text-sm leading-relaxed text-accent-dim">
            Five at a time. Decide archive or delete for each, then send the batch to Gmail. Roughly{' '}
            {Math.ceil(total / BATCH)} rounds.
          </p>
          <button
            className="mt-8 rounded-full bg-brand px-8 py-3 font-mono text-sm text-black"
            onClick={() => setStarted(true)}
          >
            START
          </button>
          <button
            className="mt-3 block w-full font-mono text-xs text-accent-dim hover:text-accent"
            onClick={startWithRules}
          >
            apply my sender rules first
          </button>
        </div>
      ) : left === 0 ? (
        <div className="m-auto text-center">
          <div className="text-5xl">Inbox zero</div>
          <div className="mt-4 font-mono text-xs text-accent-dim">
            {ws.applied.length} messages sent to Gmail this session
          </div>
          <button
            className="mt-8 rounded-full border border-white/15 px-6 py-2 font-mono text-xs hover:bg-surface-hover"
            onClick={runAgain}
          >
            run again
          </button>
        </div>
      ) : (
        <div className="w-full max-w-3xl px-6 pb-16 pt-10">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tracking-widest text-accent-dim">
              ROUND {round + 1}
            </span>
            <span className="ml-auto font-mono text-xs text-accent-dim">
              {left} left of {total}
            </span>
          </div>
          <div className="mt-2 flex h-1.5 gap-1">
            {Array.from({ length: Math.ceil(total / BATCH) }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 rounded-full ${index < round ? 'bg-brand' : index === round ? 'bg-brand/40' : 'bg-surface'}`}
              />
            ))}
          </div>

          <ul className="mt-8 space-y-3">
            {batch.map((message) => {
              const action = ws.marks[message.id]
              return (
                <li
                  key={message.id}
                  className={`rounded-xl border p-4 transition-colors ${action === 'archive' ? 'border-brand/50 bg-brand/5' : action === 'trash' ? 'border-danger/50 bg-danger/5' : 'border-white/8 bg-surface'}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold">{senderName(message.from)}</span>
                    <span className="ml-auto font-mono text-[10px] text-accent-dim">
                      {message.date}
                    </span>
                  </div>
                  <div className="mt-1 text-[15px]">{message.subject}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-accent-dim">{message.snippet}</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      className={`flex-1 rounded-lg py-2 font-mono text-[11px] ${action === 'archive' ? 'bg-brand text-black' : 'bg-surface-hover hover:bg-surface-active'}`}
                      onClick={() => decide(message.id, 'archive')}
                    >
                      ARCHIVE
                    </button>
                    <button
                      className={`flex-1 rounded-lg py-2 font-mono text-[11px] ${action === 'trash' ? 'bg-danger text-black' : 'bg-surface-hover hover:bg-surface-active'}`}
                      onClick={() => decide(message.id, 'trash')}
                    >
                      DELETE
                    </button>
                    <button
                      className="rounded-lg px-4 py-2 font-mono text-[11px] text-accent-dim hover:text-accent"
                      onClick={() => keep(message.id)}
                    >
                      KEEP
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="sticky bottom-0 mt-6 flex items-center gap-3 bg-base py-4">
            <span className="font-mono text-xs text-accent-dim">
              {decided} of {batch.length} decided
            </span>
            <button
              className="ml-auto rounded-full bg-brand px-6 py-2.5 font-mono text-xs text-black disabled:opacity-30"
              disabled={ws.markedCount === 0}
              onClick={commitBatch}
            >
              SEND BATCH TO GMAIL ({ws.markedCount})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
