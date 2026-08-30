// PROTOTYPE — Variant 13: Rule Rail. (from feedback on 9, at table density)
// Premise: 9's inversion was right but too abstract. Here the rules are a narrow rail
// with live counts — click one and its matches stage instantly — and the main area is
// the residue: mail no rule covers. Every residue row can become a rule in one click,
// which stages it and everything else that sender ever sent. The rail grows, the
// residue shrinks, and that shrinking is the whole point of the screen.
import { useState } from 'react'
import type { MarkAction } from '../../types'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'

export default function V13RuleRail() {
  const ws = useWorkspace()
  const [hoverRule, setHoverRule] = useState<string | null>(null)
  const matchesOf = (text: string) =>
    ws.inbox.filter((message) => message.from.toLowerCase().includes(text.toLowerCase()))
  const residue = ws.filtered.filter(
    (message) => !ws.ruleFor(message.from) && !ws.marks[message.id]
  )
  const covered = ws.inbox.filter((message) => ws.ruleFor(message.from))
  const staged = ws.inbox.filter((message) => ws.marks[message.id])
  const percent = Math.round((covered.length / Math.max(1, ws.inbox.length)) * 100)
  const teach = (from: string, action: MarkAction) => {
    ws.addRule(from, action)
    ws.mark(
      matchesOf(senderAddr(from)).map((message) => message.id),
      action
    )
  }
  const hoveredRule = ws.rules.find((rule) => rule.id === hoverRule)

  return (
    <div className="grid h-full grid-cols-[240px_minmax(0,1fr)] divide-x divide-white/5">
      <aside className="flex min-h-0 flex-col">
        <div className="px-3 py-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] tracking-widest text-accent-dim">RULES</span>
            <span className="ml-auto font-mono text-[11px] text-brand">{percent}%</span>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface">
            <div className="h-full bg-brand" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-1 font-mono text-[10px] text-accent-dim">
            {covered.length} of {ws.inbox.length} covered
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2">
          {ws.rules.map((rule) => {
            const count = matchesOf(rule.from).length
            return (
              <li key={rule.id}>
                <button
                  className="mb-0.5 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-surface-hover"
                  title={`Stage all ${count} matches now`}
                  onMouseEnter={() => setHoverRule(rule.id)}
                  onMouseLeave={() => setHoverRule(null)}
                  onClick={() =>
                    ws.mark(
                      matchesOf(rule.from).map((message) => message.id),
                      rule.action
                    )
                  }
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: rule.action === 'archive' ? '#d6ff00' : '#ff3333' }}
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{rule.from}</span>
                  <span
                    className={`shrink-0 font-mono text-[10px] ${count ? 'text-accent' : 'text-accent-dim'}`}
                  >
                    {count}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-white/5 p-2">
          <button
            className="w-full rounded bg-surface-hover py-1.5 font-mono text-[10px] hover:bg-surface-active"
            onClick={() => ws.runQuery()}
          >
            STAGE EVERY RULE MATCH
          </button>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col">
        <header className="flex items-center gap-3 px-3 py-2">
          <input
            className="w-56 rounded-md bg-surface px-3 py-1.5 text-sm outline-none placeholder:text-accent-dim"
            placeholder="Filter..."
            value={ws.search}
            onChange={(event) => ws.setSearch(event.target.value)}
          />
          <span className="font-mono text-[11px] text-accent-dim">
            {residue.length} messages no rule covers
          </span>
          <button
            className="ml-auto rounded-md bg-brand px-4 py-1.5 font-mono text-[11px] text-black disabled:opacity-30"
            disabled={staged.length === 0}
            onClick={() => ws.applyAll()}
          >
            APPLY {staged.length}
          </button>
        </header>
        <div className="flex gap-3 border-y border-white/5 px-3 py-1.5 font-mono text-[10px] tracking-widest text-accent-dim">
          <span className="w-[28ch] shrink-0">FROM</span>
          <span className="min-w-0 flex-1">SUBJECT</span>
          <span className="w-[16ch] shrink-0 text-right">DATE</span>
          <span className="w-[22ch] shrink-0 text-right">THIS ONE / ALWAYS</span>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {residue.length > 0 ? (
            residue.map((message) => {
              const highlighted = hoveredRule
                ? matchesOf(hoveredRule.from).some((item) => item.id === message.id)
                : false
              return (
                <li
                  key={message.id}
                  className={`group flex items-center gap-3 border-b border-white/5 px-3 text-sm hover:bg-surface ${highlighted ? 'bg-brand/10' : ''}`}
                >
                  <span className="w-[28ch] shrink-0 truncate py-2 font-semibold">
                    {senderName(message.from)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{message.subject}</span>
                  <span className="w-[16ch] shrink-0 text-right font-mono text-[10px] text-accent-dim">
                    {message.date}
                  </span>
                  <span className="flex w-[22ch] shrink-0 justify-end gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                      title="Archive this message"
                      onClick={() => ws.mark([message.id], 'archive')}
                    >
                      A
                    </button>
                    <button
                      className="rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
                      title="Delete this message"
                      onClick={() => ws.mark([message.id], 'trash')}
                    >
                      D
                    </button>
                    <span className="mx-1 text-accent-dim">|</span>
                    <button
                      className="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-brand hover:text-black"
                      title={`Always archive ${senderAddr(message.from)} — stages every match now`}
                      onClick={() => teach(message.from, 'archive')}
                    >
                      ALWAYS A
                    </button>
                    <button
                      className="rounded bg-surface-active px-1.5 py-0.5 font-mono text-[10px] hover:bg-danger"
                      title={`Always delete ${senderAddr(message.from)} — stages every match now`}
                      onClick={() => teach(message.from, 'trash')}
                    >
                      ALWAYS D
                    </button>
                  </span>
                </li>
              )
            })
          ) : (
            <li className="px-3 py-16 text-center">
              <div className="text-lg">Every message is covered by a rule.</div>
              <div className="mt-2 font-mono text-[11px] text-accent-dim">
                {staged.length} staged — apply when ready.
              </div>
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
