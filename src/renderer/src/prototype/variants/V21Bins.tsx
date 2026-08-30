// PROTOTYPE — Variant 21: Bins. (16, graded 9, plus the three-button selection)
// Unchanged from 16: two named bins, always on screen, grouped by sender, and an
// Apply that spells out both counts. Tightened only where 16 wasted room — the bins
// now size to their contents and show a per-bin sender count on the header line.
import { useMemo } from 'react'
import type { EmailMsg, MarkAction } from '../../types'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'
import PrototypeTriageRows from '../TriageRows'

type Group = { key: string; from: string; msgs: EmailMsg[] }

export default function V21Bins() {
  const ws = useWorkspace()
  const groupsFor = (action: MarkAction): Group[] => {
    const by = new Map<string, Group>()
    for (const message of ws.inbox) {
      if (ws.marks[message.id] !== action) continue
      const key = senderAddr(message.from)
      if (!by.has(key)) by.set(key, { key, from: message.from, msgs: [] })
      by.get(key)!.msgs.push(message)
    }
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length)
  }
  const archive = useMemo(() => groupsFor('archive'), [ws.inbox, ws.marks])
  const trash = useMemo(() => groupsFor('trash'), [ws.inbox, ws.marks])
  const count = (groups: Group[]) => groups.reduce((number, group) => number + group.msgs.length, 0)
  const renderBin = (title: string, colour: string, groups: Group[]) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex items-center gap-2 border-y border-white/5 px-3 py-1.5"
        style={{ background: `${colour}12` }}
      >
        <span className="size-2 rounded-full" style={{ background: colour }} />
        <span className="font-mono text-[11px] tracking-widest" style={{ color: colour }}>
          {title}
        </span>
        <span className="font-mono text-[10px] text-accent-dim">
          {groups.length} {groups.length === 1 ? 'sender' : 'senders'}
        </span>
        <span className="ml-auto font-mono text-sm">{count(groups)}</span>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {groups.length > 0 ? (
          groups.map((group) => (
            <li
              key={group.key}
              className="group flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-surface"
            >
              <span className="min-w-0 flex-1 truncate">
                {senderName(group.from)}
                {group.msgs.length === 1 && (
                  <span className="text-accent-dim"> — {group.msgs[0].subject}</span>
                )}
              </span>
              {group.msgs.length > 1 && (
                <span className="shrink-0 rounded bg-surface-active px-1.5 font-mono text-[10px]">
                  {group.msgs.length}
                </span>
              )}
              <button
                className="shrink-0 font-mono text-[10px] text-accent-dim opacity-0 group-hover:opacity-100 hover:text-accent"
                title="Put back in the Inbox"
                onClick={() => ws.unmark(group.msgs.map((message) => message.id))}
              >
                put back
              </button>
            </li>
          ))
        ) : (
          <li className="px-3 py-6 text-center font-mono text-[10px] text-accent-dim">empty</li>
        )}
      </ul>
    </div>
  )

  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_330px] divide-x divide-white/5">
      <PrototypeTriageRows />
      <aside className="flex min-h-0 flex-col bg-black/40">
        <div className="flex items-baseline gap-2 px-3 py-2">
          <span className="font-mono text-[11px] tracking-widest text-accent-dim">STAGING</span>
          <span className="font-mono text-[11px] text-accent-dim">{ws.markedCount} pending</span>
          <button
            className="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
            disabled={ws.markedCount === 0}
            onClick={() => ws.unmarkAll()}
          >
            empty both
          </button>
        </div>
        {renderBin('TO ARCHIVE', '#d6ff00', archive)}
        {renderBin('TO DELETE', '#ff3333', trash)}
        <div className="border-t border-white/10 p-3">
          <button
            className="w-full rounded-md bg-brand py-2.5 font-mono text-[11px] text-black disabled:opacity-30"
            disabled={ws.markedCount === 0}
            onClick={() => ws.applyAll()}
          >
            APPLY — {count(archive)} ARCHIVE, {count(trash)} DELETE
          </button>
        </div>
      </aside>
    </div>
  )
}
