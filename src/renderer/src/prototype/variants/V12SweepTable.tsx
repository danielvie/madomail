// PROTOTYPE — Variant 12: Sweep Table. (retry of 1, which failed as a card grid)
// Premise: the sender grouping was right, the cards were wrong. Same dense table you
// have now, but consecutive mail from one sender collapses into a single band row
// with a count and two buttons. Every band is one decision; the tray docks below.
import { useMemo, useState } from 'react'
import type { EmailMsg } from '../../types'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'

type Band = { key: string; from: string; msgs: EmailMsg[] }

export default function V12SweepTable() {
  const ws = useWorkspace()
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [trayOpen, setTrayOpen] = useState(false)
  const bands = useMemo(() => {
    const by = new Map<string, Band>()
    for (const message of ws.filtered) {
      if (ws.marks[message.id]) continue
      const key = senderAddr(message.from)
      if (!by.has(key)) by.set(key, { key, from: message.from, msgs: [] })
      by.get(key)!.msgs.push(message)
    }
    return [...by.values()].sort(
      (a, b) => b.msgs.length - a.msgs.length || a.key.localeCompare(b.key)
    )
  }, [ws.filtered, ws.marks])
  const staged = ws.inbox.filter((message) => ws.marks[message.id])
  const toggleBand = (key: string) =>
    setOpen((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const ids = (band: Band) => band.msgs.map((message) => message.id)

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <input
          className="w-64 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
          placeholder="Filter..."
          value={ws.search}
          onChange={(event) => ws.setSearch(event.target.value)}
        />
        <button
          className="rounded-md border border-white/10 px-3 py-1.5 font-mono text-[11px] hover:bg-surface-hover"
          onClick={() => ws.runQuery()}
        >
          RUN QUERY
        </button>
        <span className="font-mono text-[11px] text-accent-dim">
          {bands.length} senders · {bands.reduce((count, band) => count + band.msgs.length, 0)}{' '}
          undecided
        </span>
        <label className="ml-auto flex items-center gap-2 font-mono text-[11px] text-accent-dim">
          <input
            type="checkbox"
            checked={ws.autoApply}
            onChange={(event) => ws.setAutoApply(event.target.checked)}
            className="accent-[#d6ff00]"
          />{' '}
          auto-apply
        </label>
      </header>

      <div className="flex gap-3 border-b border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim">
        <span className="w-6 shrink-0" />
        <span className="w-[30ch] shrink-0">FROM</span>
        <span className="min-w-0 flex-1">SUBJECT</span>
        <span className="w-[16ch] shrink-0 text-right">DATE</span>
        <span className="w-[7ch] shrink-0" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {bands.map((band) => {
          const multi = band.msgs.length > 1
          const rule = ws.ruleFor(band.from)
          return (
            <div key={band.key}>
              <div
                className={`group flex items-center gap-3 border-b border-white/5 px-3 text-sm ${multi ? 'bg-surface/60' : ''} hover:bg-surface-hover`}
              >
                <button
                  className="w-6 shrink-0 font-mono text-[10px] text-accent-dim"
                  onClick={() => multi && toggleBand(band.key)}
                >
                  {multi ? (open.has(band.key) ? '▾' : '▸') : ''}
                </button>
                <span className="w-[30ch] shrink-0 truncate py-2 font-semibold">
                  {senderName(band.from)}
                  {multi && (
                    <span className="ml-1 rounded bg-surface-active px-1.5 font-mono text-[10px]">
                      {band.msgs.length}
                    </span>
                  )}
                  {rule && (
                    <span
                      className="ml-1 font-mono text-[9px]"
                      style={{ color: rule.action === 'archive' ? '#d6ff00' : '#ff3333' }}
                    >
                      RULE
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-accent-dim">
                  {multi
                    ? `${band.msgs.length} messages — ${band.msgs[0].subject}`
                    : band.msgs[0].subject}
                </span>
                <span className="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim">
                  {band.msgs[0].date}
                </span>
                <span className="flex w-[7ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                    title={`Archive all ${band.msgs.length}`}
                    onClick={() => ws.mark(ids(band), 'archive')}
                  >
                    A
                  </button>
                  <button
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
                    title={`Delete all ${band.msgs.length}`}
                    onClick={() => ws.mark(ids(band), 'trash')}
                  >
                    D
                  </button>
                </span>
              </div>
              {multi &&
                open.has(band.key) &&
                band.msgs.map((message) => (
                  <div
                    key={message.id}
                    className="group flex items-center gap-3 border-b border-white/5 bg-black/30 px-3 text-sm hover:bg-surface"
                  >
                    <span className="w-6 shrink-0" />
                    <span className="w-[30ch] shrink-0" />
                    <span className="min-w-0 flex-1 truncate py-1.5">{message.subject}</span>
                    <span className="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim">
                      {message.date}
                    </span>
                    <span className="flex w-[7ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
                      <button
                        className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                        onClick={() => ws.mark([message.id], 'archive')}
                      >
                        A
                      </button>
                      <button
                        className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
                        onClick={() => ws.mark([message.id], 'trash')}
                      >
                        D
                      </button>
                    </span>
                  </div>
                ))}
            </div>
          )
        })}
      </div>

      <div className="border-t border-white/10 bg-black/60">
        <div className="flex items-center gap-3 px-3 py-2">
          <button
            className="font-mono text-[11px] text-accent-dim hover:text-accent"
            onClick={() => setTrayOpen((current) => !current)}
          >
            {trayOpen ? '▾' : '▸'} STAGED {staged.length}
          </button>
          <span className="font-mono text-[11px] text-brand">
            {staged.filter((message) => ws.marks[message.id] === 'archive').length} archive
          </span>
          <span className="font-mono text-[11px] text-danger">
            {staged.filter((message) => ws.marks[message.id] === 'trash').length} delete
          </span>
          <button
            className="ml-auto font-mono text-[10px] text-accent-dim hover:text-accent disabled:opacity-30"
            disabled={staged.length === 0}
            onClick={() => ws.unmarkAll()}
          >
            clear
          </button>
          <button
            className="rounded-md bg-brand px-4 py-1 font-mono text-[11px] text-black disabled:opacity-30"
            disabled={staged.length === 0}
            onClick={() => ws.applyAll()}
          >
            APPLY ALL
          </button>
        </div>
        {trayOpen && (
          <ul className="max-h-48 overflow-y-auto border-t border-white/5">
            {staged.map((message) => {
              const action = ws.marks[message.id]
              return (
                <li
                  key={message.id}
                  className={`flex items-center gap-3 border-l-2 px-3 py-1 text-xs ${action === 'archive' ? 'border-brand' : 'border-danger'}`}
                >
                  <span className="w-[28ch] shrink-0 truncate text-accent-dim">
                    {senderName(message.from)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                  <button
                    className="shrink-0 font-mono text-[10px] text-accent-dim hover:text-accent"
                    onClick={() => ws.unmark([message.id])}
                  >
                    undo
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
