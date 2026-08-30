// PROTOTYPE — Variant 9: Rule Cockpit.
// Premise: invert the app. Sender rules are the primary object and the Inbox is only
// the dry-run diff they produce. You tune rules until the residue is small enough.
import { useState } from 'react'
import type { MarkAction } from '../../types'
import { senderName } from '../fixtures'
import { useWorkspace } from '../store'

export default function V09RuleCockpit() {
  const ws = useWorkspace()
  const [selectedRule, setSelectedRule] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const matchesOf = (text: string) =>
    ws.inbox.filter((message) => message.from.toLowerCase().includes(text.toLowerCase()))
  const covered = ws.inbox.filter((message) => ws.ruleFor(message.from))
  const residue = ws.inbox.filter((message) => !ws.ruleFor(message.from))
  const preview = draft.trim() ? matchesOf(draft.trim()) : []
  const focused = ws.rules.find((rule) => rule.id === selectedRule)
  const archiveCovered = covered.filter(
    (message) => ws.ruleFor(message.from)?.action === 'archive'
  ).length
  const trashCovered = covered.filter(
    (message) => ws.ruleFor(message.from)?.action === 'trash'
  ).length

  const addDraftRule = (action: MarkAction) => {
    if (!draft.trim()) return
    ws.addRule(draft.trim(), action)
    setDraft('')
  }

  return (
    <div className="grid h-full grid-cols-[minmax(340px,0.9fr)_minmax(0,1.1fr)] divide-x divide-white/5">
      <div className="flex min-h-0 flex-col">
        <header className="px-5 py-4">
          <h1 className="text-lg font-semibold">Sender rules</h1>
          <p className="mt-1 text-xs text-accent-dim">
            {ws.rules.length} rules cover {covered.length} of {ws.inbox.length} messages (
            {Math.round((covered.length / Math.max(1, ws.inbox.length)) * 100)}%)
          </p>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="bg-brand"
              style={{ width: `${(archiveCovered / Math.max(1, ws.inbox.length)) * 100}%` }}
            />
            <div
              className="bg-danger"
              style={{ width: `${(trashCovered / Math.max(1, ws.inbox.length)) * 100}%` }}
            />
          </div>
        </header>

        <div className="px-5 pb-3">
          <input
            className="w-full rounded-md bg-surface px-3 py-2 text-sm outline-none placeholder:text-accent-dim focus:ring-1 focus:ring-brand/50"
            placeholder="New rule: sender text to match..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          {draft.trim() && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-accent-dim">would match {preview.length} messages</span>
              <button
                className="ml-auto rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-black"
                onClick={() => addDraftRule('archive')}
              >
                + ARCHIVE
              </button>
              <button
                className="rounded bg-surface-hover px-2 py-1 font-mono text-[10px] hover:bg-danger"
                onClick={() => addDraftRule('trash')}
              >
                + DELETE
              </button>
            </div>
          )}
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-20">
          {ws.rules.map((rule) => {
            const count = matchesOf(rule.from).length
            const selected = selectedRule === rule.id
            return (
              <li
                key={rule.id}
                className={`mb-1 rounded-lg border px-3 py-2.5 ${selected ? 'border-white/25 bg-surface-hover' : 'border-transparent hover:bg-surface'}`}
              >
                <button
                  className="flex w-full items-center gap-2 text-left"
                  onClick={() => setSelectedRule(selected ? null : rule.id)}
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: rule.action === 'archive' ? '#d6ff00' : '#ff3333' }}
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{rule.from}</span>
                  <span className="shrink-0 font-mono text-[10px] text-accent-dim">
                    {count} match
                  </span>
                </button>
                {selected && (
                  <div className="mt-2 flex gap-2">
                    {(['archive', 'trash'] as MarkAction[]).map((action) => (
                      <button
                        key={action}
                        className={`rounded px-2 py-1 font-mono text-[10px] ${rule.action === action ? 'bg-surface-active' : 'text-accent-dim hover:bg-surface-hover'}`}
                        onClick={() => ws.updateRule(rule.id, action)}
                      >
                        {action}
                      </button>
                    ))}
                    <button
                      className="ml-auto rounded px-2 py-1 font-mono text-[10px] text-danger hover:bg-danger/20"
                      onClick={() => ws.removeRule(rule.id)}
                    >
                      remove
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex min-h-0 flex-col bg-black/25">
        <header className="flex items-center gap-3 px-5 py-4">
          <h2 className="text-sm font-semibold">
            {focused ? `Matched by "${focused.from}"` : 'Not covered by any rule'}
          </h2>
          <span className="font-mono text-xs text-accent-dim">
            {focused ? matchesOf(focused.from).length : residue.length} messages
          </span>
          <button
            className="ml-auto rounded-md bg-brand px-4 py-1.5 font-mono text-xs text-black"
            onClick={() => {
              ws.runQuery()
              ws.applyAll()
            }}
          >
            RUN &amp; APPLY
          </button>
        </header>

        <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-20">
          {(focused ? matchesOf(focused.from) : residue).map((message) => {
            const rule = ws.ruleFor(message.from)
            return (
              <li
                key={message.id}
                className="group flex items-center gap-3 rounded px-2 py-2 text-sm hover:bg-surface"
              >
                <span
                  className={`w-16 shrink-0 font-mono text-[10px] ${rule ? (rule.action === 'archive' ? 'text-brand' : 'text-danger') : 'text-accent-dim'}`}
                >
                  {rule ? rule.action : '—'}
                </span>
                <span className="w-40 shrink-0 truncate text-xs text-accent-dim">
                  {senderName(message.from)}
                </span>
                <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                {!rule && (
                  <button
                    className="shrink-0 rounded px-2 py-0.5 font-mono text-[10px] opacity-0 group-hover:opacity-100 hover:bg-surface-active"
                    onClick={() => ws.addRule(message.from, 'archive')}
                  >
                    make a rule
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
