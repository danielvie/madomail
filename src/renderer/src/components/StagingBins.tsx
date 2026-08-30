// Staging: two named bins so Archive and Delete never mix, one dense line per sender
// (bar length = count), a hover peek that tracks the line, and an explicit put-back
// control. Click a line to keep its peek open while inspecting the messages.
import { useMemo, useState } from 'react'
import type { EmailMsg, MarkAction, MarkedItem } from '../types'
import { senderAddr, senderName } from '../lib/sender'

type Line = { key: string; from: string; msgs: EmailMsg[]; byRule: boolean }

type Props = {
  emails: EmailMsg[]
  marks: Record<string, MarkAction>
  rules: MarkedItem[]
  busy?: boolean
  onunmark: (ids: string[]) => void
  onunmarkall: () => void
  onapply: () => void
}

export default function StagingBins({
  emails,
  marks,
  rules,
  busy = false,
  onunmark,
  onunmarkall,
  onapply
}: Props) {
  const [hover, setHover] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const [peekExpanded, setPeekExpanded] = useState(false)
  const [hoverY, setHoverY] = useState(0)

  const ruleFor = (from: string) =>
    rules.find(
      (rule) => rule.from.trim() && from.toLowerCase().includes(rule.from.trim().toLowerCase())
    )
  const linesFor = (action: MarkAction): Line[] => {
    const by = new Map<string, Line>()
    for (const message of emails) {
      if (marks[message.id] !== action) continue
      const key = senderAddr(message.from)
      if (!by.has(key)) {
        by.set(key, {
          key,
          from: message.from,
          msgs: [],
          byRule: Boolean(ruleFor(message.from))
        })
      }
      by.get(key)!.msgs.push(message)
    }
    return [...by.values()].sort((a, b) => b.msgs.length - a.msgs.length)
  }

  const archive = useMemo(() => linesFor('archive'), [emails, marks, rules])
  const trash = useMemo(() => linesFor('trash'), [emails, marks, rules])
  const total = Object.keys(marks).length
  const count = (lines: Line[]) => lines.reduce((number, line) => number + line.msgs.length, 0)
  const hovered = useMemo(() => {
    const lines = [...archive, ...trash]
    const pinnedLine = pinned
      ? lines.find((line) => line.key + ':' + marks[line.msgs[0].id] === pinned)
      : undefined
    const key = pinnedLine ? pinned : hover
    return lines.find((line) => line.key + ':' + marks[line.msgs[0].id] === key)
  }, [archive, trash, marks, pinned, hover])

  const peek = (event: React.MouseEvent<HTMLElement>, key: string) => {
    if (!pinned && hover !== key) setPeekExpanded(false)
    setHover(key)
    if (!pinned) setHoverY(event.currentTarget.getBoundingClientRect().top)
  }

  const pinPeek = (element: HTMLElement, key: string) => {
    setHover(key)
    setHoverY(element.getBoundingClientRect().top)
    if (pinned === key) {
      setPinned(null)
      setPeekExpanded(false)
      return
    }
    setPinned(key)
    setPeekExpanded(false)
  }

  const closePeek = () => {
    setPinned(null)
    setHover(null)
    setPeekExpanded(false)
  }

  const renderBin = (title: string, action: MarkAction, lines: Line[]) => {
    const isArchive = action === 'archive'
    const dotClass = isArchive ? 'bg-brand' : 'bg-danger'
    const labelClass = isArchive ? 'text-brand' : 'text-danger'
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className={`flex items-center gap-2 border-y border-line px-3 py-1.5 ${isArchive ? 'bg-brand/10' : 'bg-danger/10'}`}
        >
          <span className={`size-2 shrink-0 rounded-full ${dotClass}`} />
          <span className={`font-mono text-[11px] tracking-widest ${labelClass}`}>{title}</span>
          <span className="font-mono text-[10px] text-ink-dim">
            {lines.length} {lines.length === 1 ? 'sender' : 'senders'}
          </span>
          <span className="ml-auto font-mono text-sm">{count(lines)}</span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {lines.length > 0 ? (
            lines.map((line) => {
              const key = line.key + ':' + action
              const active = pinned === key || hover === key
              return (
                <li
                  key={line.key}
                  className={`flex items-center gap-2 px-2 py-1 ${active ? 'bg-panel2' : ''}`}
                  onMouseEnter={(event) => peek(event, key)}
                  onMouseLeave={() => setHover(null)}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                    aria-pressed={pinned === key}
                    onClick={(event) => pinPeek(event.currentTarget, key)}
                  >
                    {pinned === key && (
                      <span
                        className="shrink-0 font-mono text-[10px] text-brand"
                        role="img"
                        aria-label="Pinned"
                        title="Pinned"
                      >
                        ◆
                      </span>
                    )}
                    <span className="flex h-3 w-12 shrink-0 items-center gap-px">
                      {Array.from({ length: Math.min(line.msgs.length, 9) }).map((_, index) => (
                        <span
                          key={index}
                          className={`h-3 w-1 shrink-0 rounded-[1px] ${dotClass} ${active ? 'opacity-100' : 'opacity-60'}`}
                        />
                      ))}
                      {line.msgs.length > 9 && (
                        <span className={`ml-0.5 font-mono text-[8px] ${labelClass}`}>+</span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px]">
                      {senderName(line.from)}
                    </span>
                    {line.byRule && (
                      <span className="shrink-0 font-mono text-[8px] text-ink-dim">RULE</span>
                    )}
                    <span className="w-5 shrink-0 text-right font-mono text-[10px]">
                      {line.msgs.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] text-ink-dim hover:bg-panel3 hover:text-ink"
                    title={`Put ${line.msgs.length} back in the Inbox`}
                    onClick={() => {
                      if (pinned === key) setPinned(null)
                      onunmark(line.msgs.map((message) => message.id))
                    }}
                  >
                    ↩
                  </button>
                </li>
              )
            })
          ) : (
            <li className="px-3 py-5 text-center font-mono text-[10px] text-ink-dim">empty</li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <aside className="relative flex min-h-0 flex-col bg-panel">
      <div className="flex items-baseline gap-2 px-3 py-2">
        <span className="font-mono text-[11px] tracking-widest text-ink-dim">STAGING</span>
        <span className="font-mono text-[11px] text-ink-dim">{total} pending</span>
        <button
          className="ml-auto font-mono text-[10px] text-ink-dim hover:text-ink disabled:opacity-30"
          disabled={total === 0}
          onClick={onunmarkall}
        >
          empty both
        </button>
      </div>
      {renderBin('TO ARCHIVE', 'archive', archive)}
      {renderBin('TO DELETE', 'trash', trash)}
      <div className="border-t border-line p-3">
        <button
          className="w-full rounded-md bg-brand py-2.5 font-mono text-[11px] text-on-brand disabled:opacity-30"
          disabled={total === 0 || busy}
          onClick={onapply}
        >
          {busy ? 'APPLYING…' : `APPLY — ${count(archive)} ARCHIVE, ${count(trash)} DELETE`}
        </button>
      </div>
      {hovered && (
        <div
          className="fixed right-[310px] z-30 max-h-[calc(100vh-16px)] w-80 overflow-hidden rounded-lg border border-line bg-panel p-3 shadow-2xl"
          style={{
            top: Math.min(
              Math.max(hoverY - 8, 8),
              Math.max(window.innerHeight - (peekExpanded ? 400 : 220), 8)
            )
          }}
        >
          <div className="flex items-baseline gap-2">
            <span className="min-w-0 truncate text-sm font-semibold">
              {senderName(hovered.from)}
            </span>
            <span
              className={`font-mono text-[10px] ${marks[hovered.msgs[0].id] === 'archive' ? 'text-brand' : 'text-danger'}`}
            >
              {marks[hovered.msgs[0].id] === 'archive' ? 'archive' : 'delete'}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[10px] text-ink-dim">
              {hovered.msgs.length}
            </span>
            <button
              type="button"
              className="shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[9px] text-ink-dim hover:bg-panel3 hover:text-ink"
              aria-label="Close sender peek"
              title="Close"
              onClick={closePeek}
            >
              CLOSE
            </button>
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-ink-dim">
            {senderAddr(hovered.from)}
          </div>
          <ul
            className={`mt-2 max-h-64 space-y-1 border-t border-line pt-2 ${peekExpanded ? 'overflow-y-auto pr-1' : ''}`}
          >
            {(peekExpanded ? hovered.msgs : hovered.msgs.slice(0, 6)).map((message) => (
              <li key={message.id}>
                <div className="truncate text-xs">{message.subject}</div>
                <div className="truncate text-[11px] text-ink-dim">{message.snippet}</div>
              </li>
            ))}
            {hovered.msgs.length > 6 && !peekExpanded && (
              <li>
                <button
                  type="button"
                  className="font-mono text-[10px] text-ink-dim underline decoration-dotted underline-offset-2 hover:text-ink"
                  onClick={() => setPeekExpanded(true)}
                >
                  +{hovered.msgs.length - 6} more
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </aside>
  )
}
