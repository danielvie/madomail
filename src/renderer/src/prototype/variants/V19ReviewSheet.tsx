// PROTOTYPE — Variant 19: Review Sheet. (staging study 4 of 5)
// Staging idea: the opposite bet. While triaging you get a single honest counter and
// nothing else — the full width stays on the Inbox. The staging area appears once, as
// a full-screen review you must pass through before anything reaches Gmail, with a
// checkbox beside every group so the last word is "drop this from the batch".
import { useState } from 'react'
import type { EmailMsg, MarkAction } from '../../types'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'
import TriageList from '../TriageList'

type Group = { key: string; from: string; action: MarkAction; msgs: EmailMsg[] }

export default function V19ReviewSheet() {
  const ws = useWorkspace()
  const [reviewing, setReviewing] = useState(false)
  const [dropped, setDropped] = useState<Set<string>>(new Set())
  const staged = ws.inbox.filter((message) => ws.marks[message.id])
  const groups = (() => {
    const by = new Map<string, Group>()
    for (const message of staged) {
      const action = ws.marks[message.id]
      const key = senderAddr(message.from) + ':' + action
      if (!by.has(key)) by.set(key, { key, from: message.from, action, msgs: [] })
      by.get(key)!.msgs.push(message)
    }
    return [...by.values()].sort(
      (a, b) => a.action.localeCompare(b.action) || b.msgs.length - a.msgs.length
    )
  })()
  const keeping = staged.filter((message) => !dropped.has(message.id))
  const toggleDrop = (ids: string[]) =>
    setDropped((current) => {
      const next = new Set(current)
      const allDropped = ids.every((id) => next.has(id))
      ids.forEach((id) => (allDropped ? next.delete(id) : next.add(id)))
      return next
    })
  const confirm = () => {
    if (dropped.size) ws.unmark([...dropped])
    ws.applyAll()
    setDropped(new Set())
    setReviewing(false)
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <TriageList />
      </div>
      <div className="flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-2.5">
        {staged.length > 0 ? (
          <>
            <span className="font-mono text-[11px] text-brand">
              {staged.filter((message) => ws.marks[message.id] === 'archive').length} to archive
            </span>
            <span className="font-mono text-[11px] text-danger">
              {staged.filter((message) => ws.marks[message.id] === 'trash').length} to delete
            </span>
            <span className="font-mono text-[11px] text-accent-dim">
              across {new Set(staged.map((message) => senderAddr(message.from))).size} senders
            </span>
            <button
              className="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent"
              onClick={() => ws.unmarkAll()}
            >
              discard
            </button>
            <button
              className="rounded-md bg-brand px-5 py-1.5 font-mono text-[11px] text-black"
              onClick={() => setReviewing(true)}
            >
              REVIEW {staged.length} →
            </button>
          </>
        ) : (
          <span className="font-mono text-[11px] text-accent-dim">
            Nothing staged. The full window stays on the Inbox until you have something to review.
          </span>
        )}
      </div>

      {reviewing && (
        <div className="absolute inset-0 z-40 flex flex-col bg-base/95 backdrop-blur">
          <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-lg">Review before applying</h2>
              <p className="mt-0.5 font-mono text-[11px] text-accent-dim">
                {keeping.length} of {staged.length} will be sent to Gmail · uncheck anything to put
                it back
              </p>
            </div>
            <button
              className="ml-auto font-mono text-[11px] text-accent-dim hover:text-accent"
              onClick={() => setReviewing(false)}
            >
              ← keep triaging
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {(['archive', 'trash'] as MarkAction[]).map((action) => {
              const actionGroups = groups.filter((group) => group.action === action)
              if (!actionGroups.length) return null
              return (
                <div key={action} className="mb-6">
                  <div className="mb-2 flex items-baseline gap-2">
                    <span
                      className="font-mono text-[11px] tracking-widest"
                      style={{ color: action === 'archive' ? '#d6ff00' : '#ff3333' }}
                    >
                      {action === 'archive' ? 'ARCHIVE' : 'MOVE TO TRASH'}
                    </span>
                    <span className="font-mono text-[11px] text-accent-dim">
                      {actionGroups.reduce(
                        (count, group) =>
                          count + group.msgs.filter((message) => !dropped.has(message.id)).length,
                        0
                      )}{' '}
                      messages
                    </span>
                  </div>
                  <ul className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/8">
                    {actionGroups.map((group) => {
                      const ids = group.msgs.map((message) => message.id)
                      const off = ids.every((id) => dropped.has(id))
                      return (
                        <li
                          key={group.key}
                          className={`flex items-center gap-3 px-4 py-2.5 ${off ? 'bg-black/40 opacity-45' : 'bg-surface/40'}`}
                        >
                          <button
                            className={`grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] leading-none ${off ? 'border-white/25 text-transparent' : 'border-brand bg-brand text-black'}`}
                            onClick={() => toggleDrop(ids)}
                          >
                            {off ? '·' : '✓'}
                          </button>
                          <span
                            className={`w-[30ch] shrink-0 truncate text-sm font-semibold ${off ? 'line-through' : ''}`}
                          >
                            {senderName(group.from)}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm text-accent-dim">
                            {group.msgs.length > 1
                              ? `${group.msgs.length} messages`
                              : group.msgs[0].subject}
                          </span>
                          {ws.ruleFor(group.from) && (
                            <span className="shrink-0 rounded bg-surface-active px-1.5 font-mono text-[9px] text-accent-dim">
                              BY RULE
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>

          <footer className="flex items-center gap-3 border-t border-white/10 px-6 py-4">
            {dropped.size > 0 && (
              <span className="font-mono text-[11px] text-accent-dim">
                {dropped.size} put back in the Inbox
              </span>
            )}
            <button
              className="ml-auto rounded-md px-4 py-2 font-mono text-[11px] text-accent-dim hover:text-accent"
              onClick={() => setReviewing(false)}
            >
              cancel
            </button>
            <button
              className="rounded-md bg-brand px-6 py-2 font-mono text-[11px] text-black disabled:opacity-30"
              disabled={keeping.length === 0}
              onClick={confirm}
            >
              SEND {keeping.length} TO GMAIL
            </button>
          </footer>
        </div>
      )}
    </div>
  )
}
