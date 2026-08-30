// PROTOTYPE — Variant 18: Before / After. (staging study 3 of 5)
// Staging idea: show the *outcome*, not the queue. Top pane is the Inbox as it will
// look once you apply; bottom pane is what leaves. The two panes trade rows, and the
// headline number is what you actually care about — how small the Inbox gets.
import { useMemo } from 'react'
import type { EmailMsg } from '../../types'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'
import TriageList from '../TriageList'

type Group = { key: string; from: string; msgs: EmailMsg[] }

export default function V18BeforeAfter() {
  const ws = useWorkspace()
  const leaving = ws.inbox.filter((message) => ws.marks[message.id])
  const staying = ws.inbox.length - leaving.length
  const percent = Math.round((leaving.length / Math.max(1, ws.inbox.length)) * 100)
  const archiveLeaving = leaving.filter((message) => ws.marks[message.id] === 'archive').length
  const trashLeaving = leaving.filter((message) => ws.marks[message.id] === 'trash').length
  const groups = useMemo(() => {
    const by = new Map<string, Group>()
    for (const message of leaving) {
      const key = senderAddr(message.from) + ':' + ws.marks[message.id]
      if (!by.has(key)) by.set(key, { key, from: message.from, msgs: [] })
      by.get(key)!.msgs.push(message)
    }
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length)
  }, [leaving, ws.marks])

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b border-white/5 px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] tracking-widest text-accent-dim">
            INBOX AFTER APPLY
          </span>
          <span className="text-2xl font-light">{staying}</span>
          <span className="font-mono text-[11px] text-accent-dim">was {ws.inbox.length}</span>
        </div>
        <div className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface">
          <div className="bg-white/25" style={{ width: `${100 - percent}%` }} />
          <div
            className="bg-brand"
            style={{ width: `${(archiveLeaving / Math.max(1, ws.inbox.length)) * 100}%` }}
          />
          <div
            className="bg-danger"
            style={{ width: `${(trashLeaving / Math.max(1, ws.inbox.length)) * 100}%` }}
          />
        </div>
        <button
          className="shrink-0 rounded-md bg-brand px-4 py-1.5 font-mono text-[11px] text-black disabled:opacity-30"
          disabled={leaving.length === 0}
          onClick={() => ws.applyAll()}
        >
          APPLY — CLEAR {percent}%
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <TriageList />
      </div>

      <section className="flex max-h-[45%] flex-none flex-col border-t-2 border-brand/30 bg-black/50">
        <div className="flex items-center gap-3 px-3 py-1.5">
          <span className="font-mono text-[11px] tracking-widest text-accent-dim">
            LEAVING THE INBOX
          </span>
          <span className="font-mono text-[11px]">{leaving.length}</span>
          <button
            className="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
            disabled={leaving.length === 0}
            onClick={() => ws.unmarkAll()}
          >
            keep everything
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <div className="flex flex-wrap gap-2">
            {groups.length > 0 ? (
              groups.map((group) => {
                const action = ws.marks[group.msgs[0].id]
                return (
                  <button
                    key={group.key}
                    className={`group flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${action === 'archive' ? 'border-brand/40 bg-brand/10 hover:border-brand' : 'border-danger/40 bg-danger/10 hover:border-danger'}`}
                    title="Put back in the Inbox"
                    onClick={() => ws.unmark(group.msgs.map((message) => message.id))}
                  >
                    <span
                      className={`font-mono text-[9px] ${action === 'archive' ? 'text-brand' : 'text-danger'}`}
                    >
                      {action === 'archive' ? 'ARCH' : 'DEL'}
                    </span>
                    <span className="max-w-[24ch] truncate">{senderName(group.from)}</span>
                    <span className="rounded-full bg-black/40 px-1.5 font-mono text-[10px]">
                      {group.msgs.length}
                    </span>
                    <span className="font-mono text-[10px] text-accent-dim group-hover:text-accent">
                      ×
                    </span>
                  </button>
                )
              })
            ) : (
              <span className="px-1 py-4 font-mono text-[11px] text-accent-dim">
                Nothing staged. Rows you archive or delete collect here as chips — click one to put
                it back.
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
