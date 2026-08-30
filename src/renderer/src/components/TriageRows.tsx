import { useMemo, useState } from 'react'
import type { EmailMsg, MarkAction, MarkedItem } from '../types'
import { senderAddr, senderName } from '../lib/sender'
import { flood, range, rowSelected, single, type Row } from '../lib/selection'
type Band = { key: string; from: string; msgs: EmailMsg[] }
type VRow = Row & { band: Band; msg?: EmailMsg; header: boolean }
type Props = {
  emails: EmailMsg[]
  selection: Set<string>
  rules: MarkedItem[]
  onselect: (next: Set<string>) => void
  onmark: (ids: string[], action: MarkAction) => void
  onalways: (from: string, action: MarkAction) => void
  formatDate?: (date: string) => string
}
export default function TriageRows({
  emails,
  selection,
  rules,
  onselect,
  onmark,
  onalways,
  formatDate = (d) => d
}: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [anchor, setAnchor] = useState<string | null>(null)
  const bands = useMemo(() => {
    const by = new Map<string, Band>()
    emails.forEach((m) => {
      const key = senderAddr(m.from)
      if (!by.has(key)) by.set(key, { key, from: m.from, msgs: [] })
      by.get(key)!.msgs.push(m)
    })
    return [...by.values()].sort(
      (a, b) => b.msgs.length - a.msgs.length || a.key.localeCompare(b.key)
    )
  }, [emails])
  const rows = useMemo<VRow[]>(
    () =>
      bands.flatMap((b) =>
        open.has(b.key) && b.msgs.length > 1
          ? [
              { key: 'h:' + b.key, ids: [], band: b, header: true } as VRow,
              ...b.msgs.map(
                (m) => ({ key: 'm:' + m.id, ids: [m.id], band: b, msg: m, header: false }) as VRow
              )
            ]
          : [{ key: 'b:' + b.key, ids: b.msgs.map((m) => m.id), band: b, header: false } as VRow]
      ),
    [bands, open]
  )
  const pickable = rows.filter((r) => !r.header)
  const ruleFor = (from: string) =>
    rules.find((r) => r.from.trim() && from.toLowerCase().includes(r.from.trim().toLowerCase()))
  const left = (key: string) => {
    const i = pickable.findIndex((r) => r.key === key)
    if (i >= 0) {
      onselect(single(pickable, i, selection))
      setAnchor(key)
    }
  }
  const right = (e: React.MouseEvent, key: string) => {
    e.preventDefault()
    const i = pickable.findIndex((r) => r.key === key)
    if (i >= 0) {
      onselect(
        range(pickable, anchor ? pickable.findIndex((r) => r.key === anchor) : -1, i, selection)
      )
      setAnchor(key)
    }
  }
  const middle = (e: React.MouseEvent, key: string) => {
    if (e.button !== 1) return
    e.preventDefault()
    const i = pickable.findIndex((r) => r.key === key)
    if (i >= 0) {
      onselect(flood(pickable, i, selection))
      setAnchor(key)
    }
  }
  const toggle = (key: string) =>
    setOpen((prev) => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  const scope = (ids: string[]) =>
    selection.size && ids.some((id) => selection.has(id)) ? [...selection] : ids
  const actions = (ids: string[], from: string, always: boolean) => (
    <span className="flex w-[24ch] shrink-0 items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
      <button
        className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand"
        onClick={(e) => {
          e.stopPropagation()
          onmark(scope(ids), 'archive')
        }}
      >
        A
      </button>
      <button
        className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
        onClick={(e) => {
          e.stopPropagation()
          onmark(scope(ids), 'trash')
        }}
      >
        D
      </button>
      {always && (
        <>
          <span className="mx-0.5 text-ink-dim">|</span>
          <button
            className="rounded bg-panel3 px-1.5 py-0.5 font-mono text-[10px]"
            onClick={(e) => {
              e.stopPropagation()
              onalways(from, 'archive')
            }}
          >
            ALWAYS A
          </button>
          <button
            className="rounded bg-panel3 px-1.5 py-0.5 font-mono text-[10px]"
            onClick={(e) => {
              e.stopPropagation()
              onalways(from, 'trash')
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
      <div className="flex items-center gap-3 border-y border-line px-3 py-1.5 font-mono text-[10px] tracking-widest text-ink-dim">
        <span className="w-4" />
        <span className="w-4" />
        <span className="w-[24ch]">FROM</span>
        <span className="min-w-0 flex-1">SUBJECT</span>
        <span className="w-[17ch] text-right">DATE</span>
        <span className="w-[24ch] text-right">THIS / ALWAYS</span>
      </div>
      <div className="min-h-0 flex-1 select-none overflow-y-auto">
        {rows.length === 0 ? (
          <div className="px-3 py-16 text-center text-sm text-ink-dim">
            Nothing left undecided in the Inbox.
          </div>
        ) : (
          rows.map((r) => {
            if (r.header)
              return (
                <div
                  key={r.key}
                  className="flex items-center gap-3 border-b border-line bg-panel pr-3 text-sm"
                >
                  <span className="w-4" />
                  <button className="w-4" onClick={() => toggle(r.band.key)}>
                    ▾
                  </button>
                  <span className="w-[24ch] truncate py-2 font-semibold">
                    {senderName(r.band.from)} <small>{r.band.msgs.length}</small>
                  </span>
                  <span className="min-w-0 flex-1 text-ink-dim">
                    expanded — pick messages below
                  </span>
                  <span className="w-[17ch]" />
                  {actions(
                    r.band.msgs.map((m) => m.id),
                    r.band.from,
                    true
                  )}
                </div>
              )
            const on = rowSelected(r, selection),
              some = !on && r.ids.some((id) => selection.has(id)),
              multi = !r.msg && r.band.msgs.length > 1,
              rule = ruleFor(r.band.from),
              m = r.msg ?? r.band.msgs[0]
            return (
              <div
                key={r.key}
                className={`group flex items-center gap-3 border-b border-line border-l-2 pr-3 text-sm ${on || some ? 'border-l-brand bg-brand/10' : 'border-l-transparent hover:bg-panel2'} ${multi ? 'bg-panel' : ''} ${r.msg ? 'bg-panel/60' : ''}`}
                role="row"
                tabIndex={-1}
                onClick={() => left(r.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    left(r.key)
                  }
                }}
                onContextMenu={(e) => right(e, r.key)}
                onMouseDown={(e) => e.button === 1 && e.preventDefault()}
                onAuxClick={(e) => middle(e, r.key)}
              >
                <span className="pl-3">
                  <span
                    className={`grid size-4 place-items-center rounded border font-mono text-[10px] leading-none ${on ? 'border-brand bg-brand text-on-brand' : some ? 'border-brand text-brand' : 'border-ink-dim/50 text-transparent'}`}
                  >
                    {on ? '✓' : some ? '–' : '·'}
                  </span>
                </span>
                <button
                  className="w-4 font-mono text-[10px] text-ink-dim"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (multi) toggle(r.band.key)
                  }}
                >
                  {multi ? '▸' : ''}
                </button>
                <span className="w-[24ch] truncate py-2 font-semibold">
                  {r.msg ? (
                    '·'
                  ) : (
                    <>
                      {senderName(r.band.from)} {multi && <small>{r.band.msgs.length}</small>}{' '}
                      {rule && (
                        <small className={rule.action === 'archive' ? 'text-brand' : 'text-danger'}>
                          RULE
                        </small>
                      )}
                    </>
                  )}
                </span>
                <span className={`min-w-0 flex-1 truncate ${multi ? 'text-ink-dim' : ''}`}>
                  {r.msg
                    ? m.subject
                    : multi
                      ? `${r.band.msgs.length} messages — ${m.subject}`
                      : m.subject}
                </span>
                <span className="w-[17ch] whitespace-nowrap text-right font-mono text-[10px] text-ink-dim">
                  {formatDate(m.date)}
                </span>
                {actions(r.ids, r.band.from, !r.msg)}
              </div>
            )
          })
        )}
      </div>
      <div className="flex items-center gap-4 border-t border-line px-3 py-1.5 font-mono text-[10px] text-ink-dim">
        <span>
          <b>left</b> select
        </span>
        <span>
          <b>right</b> range
        </span>
        <span>
          <b>middle</b> fill / clear
        </span>
      </div>
    </div>
  )
}
