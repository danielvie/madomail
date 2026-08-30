import type { MarkAction } from '../types'
type Props = {
  from: string
  action: MarkAction
  onFromChange: (v: string) => void
  onActionChange: (v: MarkAction) => void
  onCancel: () => void
  onSave: () => void
}
export default function MarkedItemEditor({
  from,
  action,
  onFromChange,
  onActionChange,
  onCancel,
  onSave
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/60 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border border-line bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line px-4 py-3 font-mono text-[10px] uppercase tracking-widest text-ink-dim">
          Marked Item
        </div>
        <div className="flex flex-col gap-4 p-4">
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
              From
            </span>
            <input
              value={from}
              onChange={(e) => onFromChange(e.target.value)}
              className="w-full rounded-lg border border-line bg-panel2 px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none"
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
              Mark
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onActionChange('archive')}
                className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase ${action === 'archive' ? 'border-brand bg-brand text-on-brand' : 'border-line bg-panel2 text-ink-dim'}`}
              >
                Archive
              </button>
              <button
                onClick={() => onActionChange('trash')}
                className={`rounded-lg border px-3 py-2 font-mono text-[10px] uppercase ${action === 'trash' ? 'border-danger bg-danger text-on-danger' : 'border-line bg-panel2 text-ink-dim'}`}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <button
              onClick={onCancel}
              className="rounded-lg bg-panel3 px-3 py-2 font-mono text-[10px] uppercase text-ink-dim"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!from.trim()}
              className="rounded-lg bg-brand px-4 py-2 font-mono text-[10px] font-bold uppercase text-on-brand disabled:opacity-30"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
