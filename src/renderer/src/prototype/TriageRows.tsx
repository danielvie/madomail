// PROTOTYPE — list for variants 21 and 22.
// Same sender bands as TriageList, but selection is driven by the three-button model
// in selection.ts. The checkbox stays as the state display (that is what made
// unselecting legible in round three) while the row body is the click target.
import { useMemo, useState } from 'react'
import type { EmailMsg, MarkAction } from '../types'
import { senderAddr, senderName } from './fixtures'
import { flood, range, rowSelected, single, type Row } from './selection'
import { useWorkspace } from './store'

type Band = { key: string; from: string; msgs: EmailMsg[] }
type VRow = Row & { band: Band; msg?: EmailMsg; header: boolean }

function Box({ on, partial }: { on: boolean; partial: boolean }) {
  return (
    <span
      className={`grid size-4 shrink-0 place-items-center rounded border font-mono text-[10px] leading-none ${on ? 'border-brand bg-brand text-black' : partial ? 'border-brand text-brand' : 'border-white/25 text-transparent'}`}
    >
      {on ? '✓' : partial ? '–' : '·'}
    </span>
  )
}

export default function PrototypeTriageRows() {
  const ws = useWorkspace()
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [anchor, setAnchor] = useState<string | null>(null)
  const [hint, setHint] = useState('')
  const selection = ws.selection
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

  const rows = useMemo<VRow[]>(
    () =>
      bands.flatMap((band) => {
        if (band.msgs.length > 1 && open.has(band.key)) {
          return [
            { key: 'h:' + band.key, ids: [], band, header: true } as VRow,
            ...band.msgs.map(
              (message) =>
                ({
                  key: 'm:' + message.id,
                  ids: [message.id],
                  band,
                  msg: message,
                  header: false
                }) as VRow
            )
          ]
        }
        return [
          {
            key: 'b:' + band.key,
            ids: band.msgs.map((message) => message.id),
            band,
            header: false
          } as VRow
        ]
      }),
    [bands, open]
  )
  const pickable = rows.filter((row) => !row.header)
  const indexOf = (key: string) => pickable.findIndex((row) => row.key === key)
  const say = (message: string) => {
    setHint(message)
    window.setTimeout(() => setHint(''), 1600)
  }
  const onLeft = (key: string) => {
    const index = indexOf(key)
    if (index < 0) return
    const next = single(pickable, index, selection)
    ws.setSelection(next)
    setAnchor(key)
    say(rowSelected(pickable[index], next) ? 'selected' : 'unselected')
  }
  const onRight = (event: React.MouseEvent, key: string) => {
    event.preventDefault()
    const index = indexOf(key)
    if (index < 0) return
    const anchorIndex = anchor ? indexOf(anchor) : -1
    const before = selection.size
    const next = range(pickable, anchorIndex, index, selection)
    ws.setSelection(next)
    setAnchor(key)
    say(anchorIndex < 0 ? 'selected (no anchor yet)' : '+' + (next.size - before) + ' in range')
  }
  const onMiddle = (event: React.MouseEvent, key: string) => {
    if (event.button !== 1) return
    event.preventDefault()
    const index = indexOf(key)
    if (index < 0) return
    const wasSelected = rowSelected(pickable[index], selection)
    const before = selection.size
    const next = flood(pickable, index, selection)
    ws.setSelection(next)
    setAnchor(key)
    const count = Math.abs(next.size - before)
    say(wasSelected ? 'cleared run of ' + count : 'filled run of ' + count)
  }
  const toggleBand = (key: string) =>
    setOpen((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  const scope = (ids: string[]) =>
    selection.size && ids.some((id) => selection.has(id)) ? [...selection] : ids
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
  const actions = (ids: string[], from: string, includeAlways: boolean) => (
    <span className="flex w-[24ch] shrink-0 items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
      <button
        className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
        title={`Archive ${ids.length}`}
        onClick={(event) => {
          event.stopPropagation()
          ws.mark(scope(ids), 'archive')
        }}
      >
        A
      </button>
      <button
        className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
        title={`Delete ${ids.length}`}
        onClick={(event) => {
          event.stopPropagation()
          ws.mark(scope(ids), 'trash')
        }}
      >
        D
      </button>
      {includeAlways && (
        <>
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
        </>
      )}
    </span>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-3 py-2">
        <input
          className="w-52 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
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

      <div className="flex items-center gap-3 border-y border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim">
        <span className="w-4 shrink-0" />
        <span className="w-4 shrink-0" />
        <span className="w-[24ch] shrink-0">FROM</span>
        <span className="min-w-0 flex-1">SUBJECT</span>
        <span className="w-[17ch] shrink-0 whitespace-nowrap text-right">DATE</span>
        <span className="w-[24ch] shrink-0 text-right">THIS / ALWAYS</span>
      </div>

      <div className="min-h-0 flex-1 select-none overflow-y-auto">
        {rows.length > 0 ? (
          rows.map((row) => {
            if (row.header) {
              return (
                <div
                  key={row.key}
                  className="group flex items-center gap-3 border-b border-white/5 border-l-2 border-l-transparent bg-surface/60 pr-3 text-sm"
                >
                  <span className="w-4 shrink-0 pl-3" />
                  <button
                    className="w-4 shrink-0 font-mono text-[10px] text-accent-dim"
                    onClick={() => toggleBand(row.band.key)}
                  >
                    ▾
                  </button>
                  <span className="w-[24ch] shrink-0 truncate py-2 font-semibold">
                    {senderName(row.band.from)}
                    <span className="ml-1 rounded bg-surface-active px-1.5 font-mono text-[10px]">
                      {row.band.msgs.length}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-accent-dim">
                    expanded — pick messages below
                  </span>
                  <span className="w-[17ch] shrink-0" />
                  {actions(
                    row.band.msgs.map((message) => message.id),
                    row.band.from,
                    true
                  )}
                </div>
              )
            }
            const on = rowSelected(row, selection)
            const some = !on && row.ids.some((id) => selection.has(id))
            const multi = !row.msg && row.band.msgs.length > 1
            const rule = ws.ruleFor(row.band.from)
            const message = row.msg ?? row.band.msgs[0]
            return (
              <div
                key={row.key}
                className={`group flex items-center gap-3 border-b border-white/5 border-l-2 pr-3 text-sm ${on || some ? 'border-l-brand bg-brand/10' : 'border-l-transparent hover:bg-surface'} ${multi ? 'bg-surface/40' : ''} ${row.msg ? 'bg-black/25' : ''}`}
                role="row"
                tabIndex={-1}
                onClick={() => onLeft(row.key)}
                onContextMenu={(event) => onRight(event, row.key)}
                onMouseDown={(event) => event.button === 1 && event.preventDefault()}
                onAuxClick={(event) => onMiddle(event, row.key)}
              >
                <span className="pl-3">
                  <Box on={on} partial={some} />
                </span>
                <button
                  className="w-4 shrink-0 font-mono text-[10px] text-accent-dim"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (multi) toggleBand(row.band.key)
                  }}
                >
                  {multi ? '▸' : ''}
                </button>
                <span className="w-[24ch] shrink-0 truncate py-2 font-semibold">
                  {row.msg ? (
                    <span className="text-accent-dim">·</span>
                  ) : (
                    <>
                      {senderName(row.band.from)}
                      {multi && (
                        <span className="ml-1 rounded bg-surface-active px-1.5 font-mono text-[10px]">
                          {row.band.msgs.length}
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
                    </>
                  )}
                </span>
                <span className={`min-w-0 flex-1 truncate ${multi ? 'text-accent-dim' : ''}`}>
                  {row.msg
                    ? message.subject
                    : multi
                      ? `${row.band.msgs.length} messages — ${message.subject}`
                      : message.subject}
                </span>
                <span className="w-[17ch] shrink-0 whitespace-nowrap text-right font-mono text-[10px] text-accent-dim">
                  {message.date}
                </span>
                {actions(row.ids, row.band.from, !row.msg)}
              </div>
            )
          })
        ) : (
          <div className="px-3 py-16 text-center text-sm text-accent-dim">
            Nothing left undecided in the Inbox.
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 border-t border-white/5 px-3 py-1.5 font-mono text-[10px] text-accent-dim">
        <span>
          <b className="text-accent">left</b> select
        </span>
        <span>
          <b className="text-accent">right</b> range from last click
        </span>
        <span>
          <b className="text-accent">middle</b> fill / clear the run
        </span>
        {hint && <span className="ml-auto text-brand">{hint}</span>}
      </div>
    </div>
  )
}
