// PROTOTYPE — Variant 8: Terminal.
// Premise: lean all the way into the density the current design half-wants. Monospace
// everywhere, vim motion, a status line, and a ":" command prompt. No buttons.
import { useEffect, useState } from 'react'
import { senderName } from '../fixtures'
import { useWorkspace } from '../store'

export default function V08Terminal() {
  const ws = useWorkspace()
  const [cursor, setCursor] = useState(0)
  const [command, setCommand] = useState<string | null>(null)
  const [message, setMessage] = useState(
    'mado-mail 0.1 — j/k move, a archive, d delete, x select, : command'
  )
  const rows = ws.filtered
  const row = rows[Math.min(cursor, rows.length - 1)]

  const run = (line: string) => {
    const [name, ...rest] = line.trim().split(/\s+/)
    const argument = rest.join(' ')
    if (name === 'apply') {
      const count = ws.markedCount
      ws.applyAll()
      setMessage('applied ' + count + ' marks to gmail')
    } else if (name === 'query') {
      setMessage('rule query marked ' + ws.runQuery() + ' messages')
    } else if (name === 'unmark') {
      ws.unmarkAll()
      setMessage('cleared all pending marks')
    } else if (name === 'rule') {
      if (row) {
        ws.addRule(row.from, argument === 'd' ? 'trash' : 'archive')
        setMessage('saved sender rule')
      }
    } else if (name === 'search') {
      ws.setSearch(argument)
      setMessage('filter: ' + (argument || '(none)'))
    } else if (name === 'refresh') {
      ws.reset()
      setMessage('inbox reloaded')
    } else {
      setMessage('unknown command: ' + name)
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey) return
      if (command !== null) {
        if (event.key === 'Enter') {
          run(command)
          setCommand(null)
        } else if (event.key === 'Escape') {
          setCommand(null)
        }
        return
      }
      const key = event.key
      if (key === 'j') setCursor((current) => Math.min(current + 1, rows.length - 1))
      else if (key === 'k') setCursor((current) => Math.max(0, current - 1))
      else if (key === 'g') setCursor(0)
      else if (key === 'G') setCursor(rows.length - 1)
      else if (key === 'x' && row) ws.toggle(row.id)
      else if (key === 'a' && row) {
        ws.mark(ws.selection.size ? [...ws.selection] : [row.id], 'archive')
        setMessage('marked archive')
      } else if (key === 'd' && row) {
        ws.mark(ws.selection.size ? [...ws.selection] : [row.id], 'trash')
        setMessage('marked delete')
      } else if (key === 'u' && row) ws.unmark([row.id])
      else if (key === ':') {
        event.preventDefault()
        setCommand('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [command, row, rows.length, ws])

  return (
    <div className="flex h-full flex-col bg-[#08080a] font-mono text-[13px] leading-[1.45]">
      <div className="flex gap-4 border-b border-white/10 px-3 py-1 text-accent-dim">
        <span className="text-brand">INBOX</span>
        <span>{rows.length} msgs</span>
        <span>{ws.selection.size} sel</span>
        <span>{ws.markedCount} marked</span>
        <span className="ml-auto">{ws.autoApply ? 'auto-apply:on' : 'auto-apply:off'}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        {rows.map((item, index) => {
          const action = ws.marks[item.id]
          return (
            <div
              key={item.id}
              className={`flex gap-2 whitespace-pre px-3 ${index === cursor ? 'bg-surface-active text-accent' : 'text-accent-dim'}`}
            >
              <span className="w-8 shrink-0 text-right opacity-50">
                {String(index + 1).padStart(3, ' ')}
              </span>
              <span className="w-3 shrink-0 text-brand">
                {ws.selection.has(item.id) ? '*' : ' '}
              </span>
              <span
                className={`w-2 shrink-0 ${action === 'archive' ? 'text-brand' : action === 'trash' ? 'text-danger' : ''}`}
              >
                {action === 'archive' ? 'A' : action === 'trash' ? 'D' : ' '}
              </span>
              <span className="w-[26ch] shrink-0 truncate">{senderName(item.from)}</span>
              <span className={`min-w-0 flex-1 truncate ${index === cursor ? '' : 'text-accent'}`}>
                {item.subject}
              </span>
              <span className="w-[16ch] shrink-0 text-right opacity-60">{item.date}</span>
            </div>
          )
        })}
      </div>
      {row && (
        <div className="border-t border-white/10 bg-black/60 px-3 py-2 text-accent-dim">
          <div className="truncate text-accent">{row.subject}</div>
          <div className="mt-0.5 line-clamp-2 opacity-70">{row.snippet}</div>
        </div>
      )}
      <div className="border-t border-white/10 px-3 py-1">
        {command !== null ? (
          <div className="flex">
            <span className="text-brand">:</span>
            <input
              className="flex-1 bg-transparent outline-none"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              autoFocus
              placeholder="apply | query | unmark | rule [a|d] | search <text> | refresh"
            />
          </div>
        ) : (
          <span className="text-accent-dim">{message}</span>
        )}
      </div>
    </div>
  )
}
