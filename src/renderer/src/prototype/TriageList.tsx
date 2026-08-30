// PROTOTYPE — shared list used by variants 16-20.
// Round three tests staging areas, so the list is held constant: it is variant 12's
// sender bands (graded 8) with two fixes from the round-two feedback —
//  * selection is an explicit checkbox, never background colour alone (11 scored 7
//    because unselecting gave no confirmation), plus a redundant left border;
//  * every row carries 13's "A D | ALWAYS A ALWAYS D" control, which was the part
//    of 13 worth keeping.
import { useMemo, useState } from 'react'
import type { EmailMsg, MarkAction } from '../types'
import { senderAddr, senderName } from './fixtures'
import { useWorkspace } from './store'

type Band = { key: string; from: string; msgs: EmailMsg[] }

type Props = {
  showHeader?: boolean
}

function Check({
  on,
  partial,
  onClick,
  label
}: {
  on: boolean
  partial: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      className={`grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] leading-none transition-colors ${on ? 'border-brand bg-brand text-black' : partial ? 'border-brand text-brand' : 'border-white/25 text-transparent hover:border-white/60'}`}
      aria-label={label}
      onClick={onClick}
    >
      {on ? '✓' : partial ? '–' : '·'}
    </button>
  )
}

export default function TriageList({ showHeader = true }: Props) {
  const ws = useWorkspace()
  const [open, setOpen] = useState<Set<string>>(new Set())
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

  const selection = ws.selection
  const ids = (band: Band) => band.msgs.map((message) => message.id)
  const toggleBand = (key: string) =>
    setOpen((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const setSelection = (list: string[], on: boolean) => {
    const next = new Set(selection)
    list.forEach((id) => (on ? next.add(id) : next.delete(id)))
    ws.setSelection(next)
  }
  const bandState = (band: Band): 'all' | 'some' | 'none' => {
    const list = ids(band)
    const selected = list.filter((id) => selection.has(id)).length
    return selected === 0 ? 'none' : selected === list.length ? 'all' : 'some'
  }
  const scope = (list: string[]) =>
    selection.size && list.some((id) => selection.has(id)) ? [...selection] : list
  const always = (from: string, action: MarkAction) => {
    ws.addRule(from, action)
    const key = senderAddr(from)
    ws.mark(
      ws.inbox
        .filter((message) => senderAddr(message.from) === key && !ws.marks[message.id])
        .map((message) => message.id),
      action,
      true
    )
  }
  const actions = (list: string[], from: string) => (
    <span className="flex w-[24ch] shrink-0 items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
      <button
        className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
        title={`Archive ${list.length}`}
        onClick={(event) => {
          event.stopPropagation()
          ws.mark(scope(list), 'archive')
        }}
      >
        A
      </button>
      <button
        className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
        title={`Delete ${list.length}`}
        onClick={(event) => {
          event.stopPropagation()
          ws.mark(scope(list), 'trash')
        }}
      >
        D
      </button>
      <span className="mx-0.5 text-accent-dim">|</span>
      <button
        className="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
        title={`Always archive ${senderAddr(from)}`}
        onClick={(event) => {
          event.stopPropagation()
          always(from, 'archive')
        }}
      >
        ALWAYS A
      </button>
      <button
        className="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
        title={`Always delete ${senderAddr(from)}`}
        onClick={(event) => {
          event.stopPropagation()
          always(from, 'trash')
        }}
      >
        ALWAYS D
      </button>
    </span>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showHeader && (
        <div className="flex items-center gap-2 px-3 py-2">
          <input
            className="w-56 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
            placeholder="Filter..."
            value={ws.search}
            onChange={(event) => ws.setSearch(event.target.value)}
          />
          <button
            className="rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[10px] hover:bg-surface-hover"
            onClick={() => ws.runQuery()}
          >
            RUN QUERY
          </button>
          <span className="font-mono text-[11px] text-accent-dim">
            {bands.length} senders · {bands.reduce((count, band) => count + band.msgs.length, 0)}{' '}
            undecided
          </span>
          {selection.size > 0 && (
            <span className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[11px] text-brand">{selection.size} selected</span>
              <button
                className="rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-black"
                onClick={() => ws.mark([...selection], 'archive')}
              >
                ARCHIVE
              </button>
              <button
                className="rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-danger"
                onClick={() => ws.mark([...selection], 'trash')}
              >
                DELETE
              </button>
              <button
                className="font-mono text-[10px] text-accent-dim hover:text-accent"
                onClick={() => ws.setSelection(new Set())}
              >
                clear
              </button>
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 border-y border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim">
        <span className="w-4 shrink-0" />
        <span className="w-4 shrink-0" />
        <span className="w-[26ch] shrink-0">FROM</span>
        <span className="min-w-0 flex-1">SUBJECT</span>
        <span className="w-[17ch] shrink-0 whitespace-nowrap text-right">DATE</span>
        <span className="w-[24ch] shrink-0 text-right">THIS / ALWAYS</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {bands.length > 0 ? (
          bands.map((band) => {
            const multi = band.msgs.length > 1
            const state = bandState(band)
            const rule = ws.ruleFor(band.from)
            return (
              <div key={band.key}>
                <div
                  className={`group flex items-center gap-3 border-b border-white/5 border-l-2 pr-3 text-sm ${state === 'none' ? 'border-l-transparent hover:bg-surface' : 'border-l-brand bg-brand/10'} ${multi ? 'bg-surface/40' : ''}`}
                >
                  <span className="pl-3">
                    <Check
                      on={state === 'all'}
                      partial={state === 'some'}
                      onClick={() => setSelection(ids(band), state !== 'all')}
                      label={`Select ${senderName(band.from)}`}
                    />
                  </span>
                  <button
                    className="w-4 shrink-0 font-mono text-[10px] text-accent-dim"
                    onClick={() => multi && toggleBand(band.key)}
                  >
                    {multi ? (open.has(band.key) ? '▾' : '▸') : ''}
                  </button>
                  <span className="w-[26ch] shrink-0 truncate py-2 font-semibold">
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
                  <span className={`min-w-0 flex-1 truncate ${multi ? 'text-accent-dim' : ''}`}>
                    {multi
                      ? `${band.msgs.length} messages — ${band.msgs[0].subject}`
                      : band.msgs[0].subject}
                  </span>
                  <span className="w-[17ch] shrink-0 whitespace-nowrap text-right font-mono text-[10px] text-accent-dim">
                    {band.msgs[0].date}
                  </span>
                  {actions(ids(band), band.from)}
                </div>

                {multi &&
                  open.has(band.key) &&
                  band.msgs.map((message) => (
                    <div
                      key={message.id}
                      className={`group flex items-center gap-3 border-b border-white/5 border-l-2 bg-black/30 pr-3 text-sm ${selection.has(message.id) ? 'border-l-brand bg-brand/10' : 'border-l-transparent hover:bg-surface'}`}
                    >
                      <span className="pl-3">
                        <Check
                          on={selection.has(message.id)}
                          partial={false}
                          onClick={() => setSelection([message.id], !selection.has(message.id))}
                          label="Select message"
                        />
                      </span>
                      <span className="w-4 shrink-0" />
                      <span className="w-[26ch] shrink-0" />
                      <span className="min-w-0 flex-1 truncate py-1.5">{message.subject}</span>
                      <span className="w-[17ch] shrink-0 whitespace-nowrap text-right font-mono text-[10px] text-accent-dim">
                        {message.date}
                      </span>
                      <span className="flex w-[24ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button
                          className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                          onClick={() => ws.mark(scope([message.id]), 'archive')}
                        >
                          A
                        </button>
                        <button
                          className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
                          onClick={() => ws.mark(scope([message.id]), 'trash')}
                        >
                          D
                        </button>
                      </span>
                    </div>
                  ))}
              </div>
            )
          })
        ) : (
          <div className="px-3 py-16 text-center text-sm text-accent-dim">
            Nothing left undecided in the Inbox.
          </div>
        )}
      </div>
    </div>
  )
}
