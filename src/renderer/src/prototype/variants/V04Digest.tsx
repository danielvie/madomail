// PROTOTYPE — Variant 4: Digest.
// Premise: most Inbox rows are noise that never deserved a row. Group by day, and
// fold everything a rule already covers into a single summary line per day.
import { useMemo, useState } from 'react'
import type { EmailMsg } from '../../types'
import { dayOf, senderName } from '../fixtures'
import { useWorkspace } from '../store'

type Day = { day: string; kept: EmailMsg[]; noise: EmailMsg[] }

export default function V04Digest() {
  const ws = useWorkspace()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const days = useMemo(() => {
    const by = new Map<string, Day>()
    for (const message of ws.filtered) {
      const day = dayOf(message.date)
      if (!by.has(day)) by.set(day, { day, kept: [], noise: [] })
      const bucket = by.get(day)!
      if (ws.ruleFor(message.from)) bucket.noise.push(message)
      else bucket.kept.push(message)
    }
    const at = (day: string) => Date.parse(day + ' 2026')
    return [...by.values()].sort((a, b) => at(b.day) - at(a.day))
  }, [ws.filtered, ws.rules])
  const toggleDay = (day: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-white/5 px-8 py-5">
        <h1 className="text-xl font-semibold">Digest</h1>
        <span className="font-mono text-xs text-accent-dim">
          {ws.filtered.length} messages · {days.length} days
        </span>
        <input
          className="ml-auto w-64 rounded-full bg-surface px-4 py-1.5 text-sm outline-none placeholder:text-accent-dim"
          placeholder="Search..."
          value={ws.search}
          onChange={(event) => ws.setSearch(event.target.value)}
        />
        <button
          className="rounded-full bg-brand px-4 py-1.5 font-mono text-xs text-black disabled:opacity-30"
          disabled={ws.markedCount === 0}
          onClick={() => ws.applyAll()}
        >
          APPLY {ws.markedCount || ''}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-24">
        {days.map((day) => {
          const isExpanded = expanded.has(day.day)
          const archiveCount = day.noise.filter(
            (message) => ws.ruleFor(message.from)?.action === 'archive'
          ).length
          const trashCount = day.noise.filter(
            (message) => ws.ruleFor(message.from)?.action === 'trash'
          ).length
          return (
            <section key={day.day} className="border-b border-white/5 py-6">
              <div className="mb-3 flex items-baseline gap-3">
                <h2 className="font-mono text-sm tracking-widest text-brand">
                  {day.day.toUpperCase()}
                </h2>
                <span className="font-mono text-[11px] text-accent-dim">
                  {day.kept.length} to read · {day.noise.length} covered by rules
                </span>
              </div>
              {day.noise.length > 0 && (
                <div className="mb-3 rounded-lg border border-white/5 bg-surface/50 px-4 py-2.5">
                  <button
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => toggleDay(day.day)}
                  >
                    <span className="font-mono text-[11px] text-accent-dim">
                      {isExpanded ? '▾' : '▸'} {day.noise.length} messages matched by your sender
                      rules
                    </span>
                    <span className="ml-auto flex gap-2">
                      <span className="rounded bg-brand px-2 py-0.5 font-mono text-[10px] text-black">
                        {archiveCount} archive
                      </span>
                      <span className="rounded bg-danger px-2 py-0.5 font-mono text-[10px]">
                        {trashCount} delete
                      </span>
                    </span>
                  </button>
                  {isExpanded && (
                    <ul className="mt-2 space-y-1 border-t border-white/5 pt-2">
                      {day.noise.map((message) => (
                        <li key={message.id} className="flex gap-3 text-xs text-accent-dim">
                          <span className="w-40 shrink-0 truncate">{senderName(message.from)}</span>
                          <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                          <button
                            className="hover:text-accent"
                            onClick={() => ws.unmark([message.id])}
                          >
                            keep
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <ul className="space-y-2">
                {day.kept.map((message) => {
                  const action = ws.marks[message.id]
                  return (
                    <li
                      key={message.id}
                      className={`group flex items-start gap-4 rounded-lg px-4 py-3 hover:bg-surface ${action ? 'opacity-40' : ''}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-sm font-semibold">
                            {senderName(message.from)}
                          </span>
                          <span className="font-mono text-[10px] text-accent-dim">
                            {message.date.split(', ')[1]}
                          </span>
                          {action && (
                            <span
                              className={`font-mono text-[10px] ${action === 'archive' ? 'text-brand' : 'text-danger'}`}
                            >
                              {action}
                            </span>
                          )}
                        </div>
                        <div className="truncate text-sm">{message.subject}</div>
                        <div className="truncate text-xs text-accent-dim">{message.snippet}</div>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          className="rounded px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-black"
                          onClick={() => ws.mark([message.id], 'archive')}
                        >
                          ARCHIVE
                        </button>
                        <button
                          className="rounded px-2 py-1 font-mono text-[10px] hover:bg-danger"
                          onClick={() => ws.mark([message.id], 'trash')}
                        >
                          DELETE
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
