// PROTOTYPE — Variant 20: Conveyor. (staging study 5 of 5)
// Staging idea: staging as a lane you can watch fill. A narrow rail down the right
// edge holds one tile per staged message, newest at the top, tinted by action and
// clustered by sender — so the shape of the pending batch is readable at a glance
// even at 200 messages, without reading a single word. Hover a cluster to see it,
// click to put it back. The rail doubles as the Apply button.
import { useMemo, useState } from 'react'
import type { EmailMsg, MarkAction } from '../../types'
import { senderAddr, senderName } from '../fixtures'
import { useWorkspace } from '../store'
import TriageList from '../TriageList'

type Cluster = { key: string; from: string; msgs: EmailMsg[] }

export default function V20Conveyor() {
  const ws = useWorkspace()
  const [hover, setHover] = useState<string | null>(null)
  const staged = ws.inbox.filter((message) => ws.marks[message.id])
  const clusters = useMemo(() => {
    const by = new Map<string, Cluster>()
    for (const message of staged) {
      const action = ws.marks[message.id]!
      const key = senderAddr(message.from) + ':' + action
      if (!by.has(key)) by.set(key, { key, from: message.from, msgs: [] })
      by.get(key)!.msgs.push(message)
    }
    return [...by.values()]
  }, [staged, ws.marks])
  const hovered = clusters.find((cluster) => cluster.key === hover)
  const archiveCount = staged.filter((message) => ws.marks[message.id] === 'archive').length

  return (
    <div className="relative grid h-full grid-cols-[minmax(0,1fr)_92px] divide-x divide-white/5">
      <TriageList />
      <aside className="relative flex min-h-0 flex-col bg-black/50">
        <div className="px-2 py-2 text-center">
          <div className="font-mono text-[9px] tracking-widest text-accent-dim">STAGED</div>
          <div className="mt-0.5 text-xl leading-none">{staged.length}</div>
          <div className="mt-1 flex justify-center gap-1.5 font-mono text-[9px]">
            <span className="text-brand">{archiveCount}</span>
            <span className="text-accent-dim">/</span>
            <span className="text-danger">{staged.length - archiveCount}</span>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <div className="flex flex-col gap-1.5">
            {clusters.length > 0 ? (
              clusters.map((cluster) => {
                const action = ws.marks[cluster.msgs[0].id] as MarkAction
                const active = hover === cluster.key
                return (
                  <button
                    key={cluster.key}
                    className={`flex flex-col gap-px rounded-md border p-1 transition-all ${active ? (action === 'archive' ? 'border-brand bg-brand/20' : 'border-danger bg-danger/20') : 'border-white/8 hover:border-white/25'}`}
                    title={`${cluster.msgs.length} from ${senderName(cluster.from)} — click to put back`}
                    onMouseEnter={() => setHover(cluster.key)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => ws.unmark(cluster.msgs.map((message) => message.id))}
                  >
                    {cluster.msgs.map((message) => (
                      <span
                        key={message.id}
                        className="h-2 w-full rounded-[2px]"
                        style={{
                          background: action === 'archive' ? '#d6ff00' : '#ff3333',
                          opacity: active ? 1 : 0.55
                        }}
                      />
                    ))}
                    <span className="mt-0.5 truncate font-mono text-[8px] text-accent-dim">
                      {senderName(cluster.from)}
                    </span>
                  </button>
                )
              })
            ) : (
              <div className="px-1 py-6 text-center font-mono text-[9px] leading-relaxed text-accent-dim">
                staged mail stacks up here
              </div>
            )}
          </div>
        </div>
        <button
          className="m-2 rounded-md bg-brand py-3 font-mono text-[10px] leading-tight text-black disabled:opacity-30"
          disabled={staged.length === 0}
          onClick={() => ws.applyAll()}
        >
          APPLY
          <br />
          {staged.length}
        </button>
        <button
          className="mx-2 mb-2 font-mono text-[9px] text-accent-dim hover:text-accent disabled:opacity-30"
          disabled={staged.length === 0}
          onClick={() => ws.unmarkAll()}
        >
          clear
        </button>
      </aside>
      {hovered && (
        <div className="pointer-events-none absolute bottom-4 right-28 z-30 max-w-sm rounded-lg border border-white/15 bg-surface p-3 shadow-2xl">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{senderName(hovered.from)}</span>
            <span
              className={`font-mono text-[10px] ${ws.marks[hovered.msgs[0].id] === 'archive' ? 'text-brand' : 'text-danger'}`}
            >
              {ws.marks[hovered.msgs[0].id]}
            </span>
            <span className="ml-auto font-mono text-[10px] text-accent-dim">
              {hovered.msgs.length}
            </span>
          </div>
          <ul className="mt-2 space-y-0.5">
            {hovered.msgs.slice(0, 6).map((message) => (
              <li key={message.id} className="truncate text-xs text-accent-dim">
                {message.subject}
              </li>
            ))}
            {hovered.msgs.length > 6 && (
              <li className="font-mono text-[10px] text-accent-dim">
                +{hovered.msgs.length - 6} more
              </li>
            )}
          </ul>
          <div className="mt-2 font-mono text-[9px] text-accent-dim">
            click to put back in the Inbox
          </div>
        </div>
      )}
    </div>
  )
}
