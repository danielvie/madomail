import { useMemo, useState } from 'react'
import type { MarkedItem } from '../types'
export default function MarkedItemsView({
  markedItems,
  onEdit,
  onDelete,
  onExport
}: {
  markedItems: MarkedItem[]
  onEdit: (item: MarkedItem) => void
  onDelete: (id: string) => void
  onExport: () => void
}) {
  const [query, setQuery] = useState('')
  const items = useMemo(
    () => markedItems.filter((i) => i.from.toLowerCase().includes(query.toLowerCase())),
    [markedItems, query]
  )
  return (
    <>
      <div className="flex shrink-0 items-center gap-2 border-b border-line bg-panel3/10 p-2">
        <button onClick={onExport} className="shrink-0 rounded border border-line px-2 py-1 text-xs">
          Export settings for GPUI
        </button>
        <span className="ml-1 text-ink-dim">⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter items..."
          className="h-5 w-full bg-transparent font-mono text-[11px] uppercase tracking-tighter text-ink outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="p-1 text-ink-dim">
            ×
          </button>
        )}
      </div>
      <div className="grid shrink-0 grid-cols-[1fr_140px_120px] border-b border-line bg-panel3/30 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
        <div className="p-3">FROM MATCH</div>
        <div className="p-3">MARK</div>
        <div className="p-3 text-right">ACTION</div>
      </div>
      <div className="relative flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-ink-dim">
            {query ? 'NO_MATCHING_ITEMS' : 'NO_MARKED_ITEMS'}
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_140px_120px] border-b border-line text-sm hover:bg-panel2/50"
            >
              <div className="truncate p-3 text-ink/90">{item.from}</div>
              <div
                className={`p-3 font-mono text-[11px] uppercase ${item.action === 'archive' ? 'text-brand' : 'text-danger'}`}
              >
                {item.action === 'archive' ? 'Archive' : 'Delete'}
              </div>
              <div className="flex justify-end gap-2 p-2">
                <button
                  onClick={() => onEdit(item)}
                  className="rounded bg-panel3 px-2 py-1 font-mono text-[10px] uppercase text-ink-dim"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="rounded bg-danger/10 px-2 py-1 font-mono text-[10px] uppercase text-danger"
                >
                  Drop
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
