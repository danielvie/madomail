// PROTOTYPE — Variant 17: Operation Log. (staging study 2 of 5)
// Staging idea: you did not make 32 decisions, you made 6 moves. So stage *moves*,
// not messages — "archived 4 from UW CIRCLE", newest on top, each one undoable on its
// own. The pending set stays legible no matter how many messages it holds.
import { useMemo, useState } from 'react'
import { useWorkspace } from '../store'
import TriageList from '../TriageList'

export default function V17OperationLog() {
  const ws = useWorkspace()
  const [expanded, setExpanded] = useState<string | null>(null)
  const log = useMemo(() => [...ws.ops].reverse(), [ws.ops])
  const total = ws.markedCount
  const archiveCount = Object.values(ws.marks).filter((action) => action === 'archive').length
  const trashCount = total - archiveCount

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <TriageList />
      </div>
      <section className="flex max-h-[45%] min-h-[9rem] flex-col border-t border-white/10 bg-black/50">
        <div className="flex items-center gap-3 border-b border-white/5 px-3 py-2">
          <span className="font-mono text-[11px] tracking-widest text-accent-dim">STAGED WORK</span>
          <span className="font-mono text-[11px] text-accent-dim">
            {log.length} {log.length === 1 ? 'move' : 'moves'} · {total} messages
          </span>
          <span className="ml-auto flex items-center gap-3">
            <span className="font-mono text-[11px] text-brand">{archiveCount} archive</span>
            <span className="font-mono text-[11px] text-danger">{trashCount} delete</span>
            <button
              className="font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
              disabled={total === 0}
              onClick={() => ws.unmarkAll()}
            >
              undo everything
            </button>
            <button
              className="rounded-md bg-brand px-4 py-1.5 font-mono text-[11px] text-black disabled:opacity-30"
              disabled={total === 0}
              onClick={() => ws.applyAll()}
            >
              APPLY {total}
            </button>
          </span>
        </div>
        <ol className="min-h-0 flex-1 overflow-y-auto">
          {log.length > 0 ? (
            log.map((operation, index) => (
              <li key={operation.id} className="border-b border-white/5">
                <div className="group flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface">
                  <span className="w-6 shrink-0 text-right font-mono text-[10px] text-accent-dim">
                    {log.length - index}
                  </span>
                  <span
                    className={`w-[9ch] shrink-0 font-mono text-[10px] ${operation.action === 'archive' ? 'text-brand' : 'text-danger'}`}
                  >
                    {operation.action === 'archive' ? 'ARCHIVE' : 'DELETE'}
                  </span>
                  <button
                    className="min-w-0 flex-1 truncate text-left"
                    onClick={() =>
                      setExpanded((current) => (current === operation.id ? null : operation.id))
                    }
                  >
                    {operation.label}
                    {operation.ids.length > 1 && (
                      <span className="ml-1 font-mono text-[10px] text-accent-dim">
                        {expanded === operation.id ? '▾' : '▸'} {operation.ids.length}
                      </span>
                    )}
                  </button>
                  {operation.viaRule && (
                    <span className="shrink-0 rounded bg-surface-active px-1.5 font-mono text-[9px] text-accent-dim">
                      BY RULE
                    </span>
                  )}
                  <button
                    className="shrink-0 rounded px-2 py-0.5 font-mono text-[10px] text-accent-dim opacity-0 group-hover:opacity-100 hover:bg-surface-active hover:text-accent"
                    onClick={() => ws.undoOp(operation.id)}
                  >
                    UNDO
                  </button>
                </div>
                {expanded === operation.id && (
                  <ul className="bg-black/40 pb-1">
                    {ws.inbox
                      .filter((message) => operation.ids.includes(message.id))
                      .map((message) => (
                        <li key={message.id} className="flex items-center gap-3 px-3 py-1 text-xs">
                          <span className="w-6 shrink-0" />
                          <span className="w-[9ch] shrink-0" />
                          <span className="min-w-0 flex-1 truncate text-accent-dim">
                            {message.subject}
                          </span>
                          <button
                            className="shrink-0 font-mono text-[10px] text-accent-dim hover:text-accent"
                            onClick={() => ws.unmark([message.id])}
                          >
                            put back
                          </button>
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))
          ) : (
            <li className="px-3 py-8 text-center font-mono text-[11px] text-accent-dim">
              No moves yet. Every archive or delete lands here as one undoable step.
            </li>
          )}
        </ol>
      </section>
    </div>
  )
}
