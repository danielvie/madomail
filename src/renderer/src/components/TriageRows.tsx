import { useMemo, useState } from 'react'
import type { EmailMsg, MarkAction, MarkedItem } from '../types'
import { senderAddr, senderName } from '../lib/sender'
import { flood, range, rowSelected, single, type Row } from '../lib/selection'
type Band = { key: string; from: string; msgs: EmailMsg[] }
type VRow = Row & { band: Band; msg?: EmailMsg; header: boolean }
type Props = {
  emails: EmailMsg[]
  selection: Set<string>
  readingId: string | null
  onread: (id: string) => void
  rules: MarkedItem[]
  onselect: (next: Set<string>) => void
  onmark: (ids: string[], action: MarkAction) => void
  onalways: (from: string, action: MarkAction) => void
  formatDate?: (date: string) => string
}
export default function TriageRows({
  emails,
  selection,
  readingId,
  onread,
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
    <span className="flex w-[24ch] shrink-0 items-center justify-end gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
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
      <div className="flex items-center gap-3 border-y border-line pr-3 py-1.5 font-mono text-[10px] tracking-widest text-ink-dim">
        <span className="w-11 shrink-0 text-center tracking-normal" title="Selection area">
          SEL
        </span>
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
                  className="group flex items-center gap-3 border-b border-line bg-panel pr-3 text-sm"
                >
                  <span className="w-11 shrink-0" />
                  <button
                    className="w-4 shrink-0"
                    aria-label={`Collapse messages from ${senderName(r.band.from)}`}
                    aria-expanded={true}
                    onClick={() => toggle(r.band.key)}
                  >
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
              m = r.msg ?? r.band.msgs[0],
              reading = r.ids.includes(readingId ?? '')
            // The displayed email stays distinct from messages selected for bulk actions.
            const background = reading
              ? 'bg-brand/25'
              : on || some
                ? 'bg-brand/10'
                : `${multi ? 'bg-panel' : r.msg ? 'bg-panel/60' : ''} hover:bg-panel2`
            return (
              <div
                key={r.key}
                className={`group flex items-stretch gap-3 border-b border-line pr-3 text-sm ${background}`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={some ? 'mixed' : on}
                  aria-label={
                    multi
                      ? `Select all ${r.band.msgs.length} messages from ${senderName(r.band.from)}`
                      : `Select ${m.subject || 'message'}`
                  }
                  title="Left: select · Right: range · Middle: fill / clear"
                  className="flex w-11 shrink-0 cursor-pointer items-center justify-center border-r border-line focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
                  onClick={() => left(r.key)}
                  onContextMenu={(e) => right(e, r.key)}
                  onMouseDown={(e) => e.button === 1 && e.preventDefault()}
                  onAuxClick={(e) => middle(e, r.key)}
                >
                  <span
                    className={`grid size-4 place-items-center rounded border font-mono text-[10px] leading-none ${on ? 'border-brand bg-brand text-on-brand' : some ? 'border-brand text-brand' : 'border-ink-dim/50 text-transparent'}`}
                  >
                    {on ? '✓' : some ? '–' : '·'}
                  </span>
                </button>
                {multi ? (
                  <button
                    className="w-4 shrink-0 font-mono text-[10px] text-ink-dim"
                    aria-label={`Expand messages from ${senderName(r.band.from)}`}
                    aria-expanded={false}
                    onClick={() => toggle(r.band.key)}
                  >
                    ▸
                  </button>
                ) : (
                  <span className="w-4 shrink-0" />
                )}
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 text-left focus-visible:underline focus-visible:underline-offset-4 focus-visible:outline-none"
                  aria-label={`Read ${m.subject || 'message'}${multi ? `, first of ${r.band.msgs.length} messages` : ''}`}
                  aria-pressed={reading}
                  title={
                    multi
                      ? 'Read first message. Expand the sender to read other messages.'
                      : 'Read message'
                  }
                  onClick={() => onread(m.id)}
                >
                  <span className="w-[24ch] shrink-0 truncate font-semibold">
                    {r.msg ? (
                      '·'
                    ) : (
                      <>
                        {senderName(r.band.from)} {multi && <small>{r.band.msgs.length}</small>}{' '}
                        {rule && (
                          <small
                            className={rule.action === 'archive' ? 'text-brand' : 'text-danger'}
                          >
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
                </button>
                {actions(r.ids, r.band.from, !r.msg)}
              </div>
            )
          })
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-3 py-1.5 font-mono text-[10px] text-ink-dim">
        <span>Checkbox area:</span>
        <span>
          <b>left</b> select
        </span>
        <span>
          <b>right</b> range
        </span>
        <span>
          <b>middle</b> fill / clear
        </span>
        <span className="ml-auto">Click email to read</span>
      </div>
    </div>
  )
}
