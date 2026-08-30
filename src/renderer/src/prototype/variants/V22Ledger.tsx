// PROTOTYPE — Variant 22: Ledger. (17 + 20, plus the three-button selection)
// 17 was the right information in too much space; 20 was the right space carrying too
// little information. This is the same narrow column as 20, but every line does four
// jobs at once: a tinted bar whose length *is* the count (the shape you could read at
// a glance in 20), the sender's name, the action, and where it came from — rule or
// hand. One line per sender-and-action, ~22px, undo on the line itself.
import { useMemo, useState } from 'react'
import type { EmailMsg, MarkAction } from '../../types'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'
import PrototypeTriageRows from '../TriageRows'

type Line = { key: string; from: string; action: MarkAction; msgs: EmailMsg[]; byRule: boolean }

export default function V22Ledger() {
  const ws = useWorkspace()
  const [hover, setHover] = useState<string | null>(null)
  const lines = useMemo(() => {
    const by = new Map<string, Line>()
    for (const message of ws.inbox) {
      const action = ws.marks[message.id]
      if (!action) continue
      const key = senderAddr(message.from) + ':' + action
      if (!by.has(key)) {
        by.set(key, {
          key,
          from: message.from,
          action,
          msgs: [],
          byRule: Boolean(ws.ruleFor(message.from))
        })
      }
      by.get(key)!.msgs.push(message)
    }
    return [...by.values()].sort(
      (a, b) => a.action.localeCompare(b.action) || b.msgs.length - a.msgs.length
    )
  }, [ws.inbox, ws.marks, ws.rules])
  const staged = ws.markedCount
  const archiveCount = Object.values(ws.marks).filter((action) => action === 'archive').length
  const trashCount = staged - archiveCount
  const hovered = lines.find((line) => line.key === hover)

  return (
    <div className="relative grid h-full grid-cols-[minmax(0,1fr)_250px] divide-x divide-white/5">
      <PrototypeTriageRows />
      <aside className="flex min-h-0 flex-col bg-black/45">
        <div className="px-3 py-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl leading-none">{staged}</span>
            <span className="font-mono text-[10px] tracking-widest text-accent-dim">STAGED</span>
            <span className="ml-auto font-mono text-[10px] text-accent-dim">
              {lines.length} {lines.length === 1 ? 'group' : 'groups'}
            </span>
          </div>
          <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-surface">
            <div
              className="bg-brand"
              style={{ width: `${(archiveCount / Math.max(1, staged)) * 100}%` }}
            />
            <div
              className="bg-danger"
              style={{ width: `${(trashCount / Math.max(1, staged)) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex gap-3 font-mono text-[10px]">
            <span className="text-brand">{archiveCount} archive</span>
            <span className="text-danger">{trashCount} delete</span>
            {staged > 0 && (
              <button
                className="ml-auto text-accent-dim hover:text-accent"
                onClick={() => ws.unmarkAll()}
              >
                clear
              </button>
            )}
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto border-t border-white/5">
          {lines.length > 0 ? (
            lines.map((line) => {
              const colour = line.action === 'archive' ? '#d6ff00' : '#ff3333'
              const active = hover === line.key
              return (
                <li key={line.key}>
                  <button
                    className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-surface"
                    onMouseEnter={() => setHover(line.key)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => ws.unmark(line.msgs.map((message) => message.id))}
                    title={`${line.msgs.length} from ${senderName(line.from)} — click to put back`}
                  >
                    <span className="flex h-3 w-14 shrink-0 items-center gap-px">
                      {Array.from({ length: Math.min(line.msgs.length, 10) }).map((_, index) => (
                        <span
                          key={index}
                          className="h-3 w-1 shrink-0 rounded-[1px]"
                          style={{ background: colour, opacity: active ? 1 : 0.6 }}
                        />
                      ))}
                      {line.msgs.length > 10 && (
                        <span className="ml-0.5 font-mono text-[8px]" style={{ color: colour }}>
                          +
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px]">
                      {senderName(line.from)}
                    </span>
                    {line.byRule && (
                      <span className="shrink-0 font-mono text-[8px] text-accent-dim">RULE</span>
                    )}
                    <span className="w-5 shrink-0 text-right font-mono text-[10px]">
                      {line.msgs.length}
                    </span>
                    <span className="w-2 shrink-0 font-mono text-[10px] text-accent-dim">×</span>
                  </button>
                </li>
              )
            })
          ) : (
            <li className="px-3 py-8 text-center font-mono text-[10px] leading-relaxed text-accent-dim">
              Nothing staged.
              <br />
              Each archive or delete adds one line here.
            </li>
          )}
        </ul>

        <div className="border-t border-white/10 p-2">
          <button
            className="w-full rounded-md bg-brand py-2 font-mono text-[11px] text-black disabled:opacity-30"
            disabled={staged === 0}
            onClick={() => ws.applyAll()}
          >
            APPLY {archiveCount}A / {trashCount}D
          </button>
        </div>
      </aside>

      {hovered && (
        <div className="pointer-events-none absolute bottom-14 right-[260px] z-30 max-w-sm rounded-lg border border-white/15 bg-surface p-3 shadow-2xl">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{senderName(hovered.from)}</span>
            <span
              className={`font-mono text-[10px] ${hovered.action === 'archive' ? 'text-brand' : 'text-danger'}`}
            >
              {hovered.action}
            </span>
            <span className="ml-auto font-mono text-[10px] text-accent-dim">
              {hovered.msgs.length}
            </span>
          </div>
          <ul className="mt-2 space-y-0.5">
            {hovered.msgs.slice(0, 6).map((message) => (
              <li key={message.id} className="truncate text-xs text-accent-dim">
                {message.subject}
              </li>
            ))}
            {hovered.msgs.length > 6 && (
              <li className="font-mono text-[10px] text-accent-dim">
                +{hovered.msgs.length - 6} more
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
