// PROTOTYPE — Variant 5: Palette.
// Premise: no toolbar at all. The screen is a result set; every command lives behind
// Ctrl+K. Typing filters; a leading ">" switches to commands.
import { useEffect, useMemo, useState } from 'react'
import { senderName } from '../fixtures'
import { useWorkspace } from '../store'

type Command = { label: string; hint: string; run: () => void }

export default function V05Palette() {
  const ws = useWorkspace()
  const [open, setOpen] = useState(true)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const isCommand = query.startsWith('>')
  const commands = useMemo<Command[]>(
    () => [
      {
        label: 'Archive selection',
        hint: 'mark',
        run: () => ws.mark([...ws.selection], 'archive')
      },
      { label: 'Delete selection', hint: 'mark', run: () => ws.mark([...ws.selection], 'trash') },
      { label: 'Apply all pending marks', hint: 'gmail', run: () => ws.applyAll() },
      { label: 'Unmark everything', hint: 'marks', run: () => ws.unmarkAll() },
      { label: 'Run rule query', hint: 'rules', run: () => ws.runQuery() },
      {
        label: 'Select everything visible',
        hint: 'selection',
        run: () => ws.setSelection(new Set(ws.filtered.map((message) => message.id)))
      },
      { label: 'Clear selection', hint: 'selection', run: () => ws.setSelection(new Set()) },
      {
        label: 'Toggle auto-apply',
        hint: 'preference',
        run: () => ws.setAutoApply(!ws.autoApply)
      },
      { label: 'Refresh Inbox', hint: 'gmail', run: () => ws.reset() }
    ],
    [ws]
  )
  const commandResults = commands.filter((command) =>
    command.label.toLowerCase().includes(query.slice(1).trim().toLowerCase())
  )
  const messageResults = query.trim()
    ? ws.inbox.filter(
        (message) =>
          message.from.toLowerCase().includes(query.toLowerCase()) ||
          message.subject.toLowerCase().includes(query.toLowerCase())
      )
    : ws.inbox
  const count = isCommand ? commandResults.length : messageResults.length

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
        return
      }
      if (!open) return
      if (event.key === 'Escape') setOpen(false)
      else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlighted((current) => Math.min(current + 1, Math.max(0, count - 1)))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlighted((current) => Math.max(0, current - 1))
      } else if (event.key === 'Enter') {
        if (isCommand) {
          commandResults[highlighted]?.run()
          setOpen(false)
        } else if (messageResults[highlighted]) {
          ws.toggle(messageResults[highlighted].id)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, isCommand, open, highlighted, commandResults, messageResults, ws])

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-10 pb-24 pt-16">
        <div className="mb-8 flex items-baseline gap-4">
          <h1 className="text-3xl font-light">{ws.inbox.length} messages</h1>
          <span className="font-mono text-xs text-accent-dim">
            {ws.selection.size} selected · {ws.markedCount} marked
          </span>
          <button
            className="ml-auto font-mono text-xs text-accent-dim hover:text-accent"
            onClick={() => setOpen(true)}
          >
            press ctrl+k
          </button>
        </div>
        <ul className="space-y-px">
          {ws.inbox.map((message) => {
            const action = ws.marks[message.id]
            return (
              <li
                key={message.id}
                className={`flex items-baseline gap-4 rounded px-3 py-2 text-sm ${ws.selection.has(message.id) ? 'bg-brand/15' : ''} ${action ? 'opacity-40' : ''}`}
              >
                <span className="w-52 shrink-0 truncate text-accent-dim">
                  {senderName(message.from)}
                </span>
                <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                {action && (
                  <span
                    className={`font-mono text-[10px] ${action === 'archive' ? 'text-brand' : 'text-danger'}`}
                  >
                    {action}
                  </span>
                )}
                <span className="shrink-0 font-mono text-[10px] text-accent-dim">
                  {message.date}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      {open && (
        <div className="absolute inset-0 z-40 flex justify-center bg-black/50 pt-24 backdrop-blur-sm">
          <div className="h-fit w-full max-w-xl rounded-xl border border-white/10 bg-surface shadow-2xl">
            <input
              className="w-full bg-transparent px-5 py-4 text-[15px] outline-none placeholder:text-accent-dim"
              placeholder="Search messages, or type > for commands"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setHighlighted(0)
              }}
              autoFocus
            />
            <div className="max-h-80 overflow-y-auto border-t border-white/5 py-2">
              {isCommand
                ? commandResults.map((command, index) => (
                    <button
                      key={command.label}
                      className={`flex w-full items-baseline gap-3 px-5 py-2 text-left text-sm ${highlighted === index ? 'bg-surface-hover' : ''}`}
                      onMouseEnter={() => setHighlighted(index)}
                      onClick={() => {
                        command.run()
                        setOpen(false)
                      }}
                    >
                      <span className="flex-1">{command.label}</span>
                      <span className="font-mono text-[10px] text-accent-dim">{command.hint}</span>
                    </button>
                  ))
                : messageResults.slice(0, 40).map((message, index) => (
                    <button
                      key={message.id}
                      className={`flex w-full items-baseline gap-3 px-5 py-2 text-left text-sm ${highlighted === index ? 'bg-surface-hover' : ''}`}
                      onMouseEnter={() => setHighlighted(index)}
                      onClick={() => ws.toggle(message.id)}
                    >
                      <span className="w-40 shrink-0 truncate text-xs text-accent-dim">
                        {senderName(message.from)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                      {ws.selection.has(message.id) && (
                        <span className="font-mono text-[10px] text-brand">✓</span>
                      )}
                    </button>
                  ))}
            </div>
            <div className="flex gap-4 border-t border-white/5 px-5 py-2 font-mono text-[10px] text-accent-dim">
              <span>↑↓ move</span>
              <span>↵ select / run</span>
              <span>&gt; commands</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
