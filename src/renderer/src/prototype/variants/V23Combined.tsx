// PROMOTED — this is no longer a variant sketch. It renders the real components from
// src/renderer/src/components, driven by the prototype's fixture store instead of
// Gmail, so colour themes can be judged against realistic content without credentials.
import StagingBins from '../../components/StagingBins'
import TriageRows from '../../components/TriageRows'
import { senderAddr } from '../../lib/sender'
import { useWorkspace } from '../store'

export default function V23Combined() {
  const ws = useWorkspace()
  const undecided = ws.filtered.filter((message) => !ws.marks[message.id])
  const senders = new Set(undecided.map((message) => senderAddr(message.from))).size

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <input
          className="w-52 rounded-md border border-line bg-panel px-3 py-1.5 text-sm outline-none placeholder:text-ink-dim"
          placeholder="Filter..."
          value={ws.search}
          onChange={(event) => ws.setSearch(event.target.value)}
        />
        <button
          className="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2"
          onClick={() => ws.runQuery()}
        >
          RUN QUERY
        </button>
        <button className="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2">
          RULES
        </button>
        <button
          className="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2"
          onClick={() => ws.reset()}
        >
          REFRESH
        </button>
        <span className="font-mono text-[11px] text-ink-dim">
          {senders} senders · {undecided.length} undecided
        </span>
        {ws.selection.size > 0 && (
          <span className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-brand">{ws.selection.size} selected</span>
            <button
              className="rounded bg-panel2 px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-on-brand"
              onClick={() => ws.mark([...ws.selection], 'archive')}
            >
              ARCHIVE
            </button>
            <button
              className="rounded bg-panel2 px-2 py-1 font-mono text-[10px] hover:bg-danger hover:text-on-danger"
              onClick={() => ws.mark([...ws.selection], 'trash')}
            >
              DELETE
            </button>
            <button
              className="font-mono text-[10px] text-ink-dim hover:text-ink"
              onClick={() => ws.setSelection(new Set())}
            >
              clear
            </button>
          </span>
        )}
        <label className="ml-auto flex items-center gap-2 font-mono text-[10px] text-ink-dim">
          <input
            type="checkbox"
            checked={ws.autoApply}
            onChange={(event) => ws.setAutoApply(event.target.checked)}
          />{' '}
          auto-apply
        </label>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] divide-x divide-line">
        <TriageRows
          emails={undecided}
          selection={ws.selection}
          rules={ws.rules}
          onselect={(next) => ws.setSelection(next)}
          onmark={(ids, action) => ws.mark(ids, action)}
          onalways={(from, action) => {
            ws.addRule(from, action)
            ws.runQuery()
          }}
        />
        <StagingBins
          emails={ws.inbox}
          marks={ws.marks}
          rules={ws.rules}
          onunmark={(ids) => ws.unmark(ids)}
          onunmarkall={() => ws.unmarkAll()}
          onapply={() => ws.applyAll()}
        />
      </div>
    </div>
  )
}
