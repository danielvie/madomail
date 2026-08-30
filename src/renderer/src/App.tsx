import { useEffect, useMemo, useState } from 'react'
import ErrorPanel from './components/ErrorPanel'
import MarkedItemEditor from './components/MarkedItemEditor'
import MarkedItemsView from './components/MarkedItemsView'
import StagingBins from './components/StagingBins'
import ThemePicker, { loadTheme } from './components/ThemePicker'
import TriageRows from './components/TriageRows'
import { senderAddr } from './lib/sender'
import type { EmailMsg, MarkAction, MarkedItem, ViewMode } from './types'

function readSavedMarkedItems(): MarkedItem[] {
  try {
    const saved = localStorage.getItem('markedItems')
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    return Array.isArray(parsed) ? (parsed as MarkedItem[]) : []
  } catch (error) {
    console.error('Failed to parse markedItems', error)
    return []
  }
}

type FetchResponse = {
  success: boolean
  data?: EmailMsg[]
  error?: string
}

type ResultResponse = {
  success: boolean
  error?: string
}

export default function App() {
  const [emails, setEmails] = useState<EmailMsg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [markedActions, setMarkedActions] = useState<Record<string, MarkAction>>({})
  const [markedItems, setMarkedItems] = useState<MarkedItem[]>(readSavedMarkedItems)
  const [viewMode, setViewMode] = useState<ViewMode>('emails')
  const [actionInProgress, setActionInProgress] = useState(false)
  const [autoApply, setAutoApply] = useState(() => localStorage.getItem('autoApply') === 'true')
  const [theme, setTheme] = useState<string>(() => loadTheme())
  const [editingOpen, setEditingOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MarkedItem | null>(null)
  const [editingFrom, setEditingFrom] = useState('')
  const [editingAction, setEditingAction] = useState<MarkAction>('archive')
  const [authCode, setAuthCode] = useState('')

  const undecided = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return emails.filter((email) => {
      if (markedActions[email.id]) return false
      if (!query) return true
      return [email.from, email.subject, email.snippet].some((value) =>
        value.toLowerCase().includes(query)
      )
    })
  }, [emails, markedActions, searchQuery])
  const senderCount = new Set(undecided.map((email) => senderAddr(email.from))).size

  useEffect(() => {
    void fetchEmails()
  }, [])

  useEffect(() => {
    localStorage.setItem('autoApply', autoApply.toString())
  }, [autoApply])

  useEffect(() => {
    localStorage.setItem('markedItems', JSON.stringify(markedItems))
  }, [markedItems])

  function formatEmailDate(date: string): string {
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function fetchEmails(): Promise<void> {
    setLoading(true)
    setError(null)
    try {
      const response = (await window.electron.ipcRenderer.invoke(
        'gmail-fetch-inbox'
      )) as FetchResponse
      if (response.success) {
        setEmails(response.data ?? [])
        setSelectedIds(new Set())
        setMarkedActions({})
      } else {
        setError(response.error ?? 'Unable to fetch the Inbox')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  function findMarkedItem(email: EmailMsg): MarkedItem | undefined {
    const from = email.from.toLowerCase()
    return markedItems.find(
      (item) => item.from.trim() && from.includes(item.from.trim().toLowerCase())
    )
  }

  async function applyActionToIds(action: MarkAction, ids: string[]): Promise<void> {
    if (ids.length === 0) return
    setActionInProgress(true)
    try {
      await window.electron.ipcRenderer.invoke(
        action === 'archive' ? 'gmail-archive' : 'gmail-trash',
        ids
      )
      const processedIds = new Set(ids)
      setEmails((current) => current.filter((email) => !processedIds.has(email.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setActionInProgress(false)
    }
  }

  async function mark(ids: string[], action: MarkAction): Promise<void> {
    if (ids.length === 0) return
    if (autoApply) {
      await applyActionToIds(action, ids)
      setSelectedIds(new Set())
      return
    }
    setMarkedActions((current) => ({
      ...current,
      ...Object.fromEntries(ids.map((id) => [id, action]))
    }))
    setSelectedIds(new Set())
  }

  function unmark(ids: string[]): void {
    setMarkedActions((current) => {
      const next = { ...current }
      ids.forEach((id) => delete next[id])
      return next
    })
  }

  async function always(from: string, action: MarkAction): Promise<void> {
    const key = senderAddr(from)
    setMarkedItems((current) => {
      const existing = current.find((item) => item.from === key)
      return existing
        ? current.map((item) => (item.id === existing.id ? { ...item, action } : item))
        : [{ id: crypto.randomUUID(), from: key, action }, ...current]
    })
    await mark(
      emails
        .filter((email) => senderAddr(email.from) === key && !markedActions[email.id])
        .map((email) => email.id),
      action
    )
  }

  async function executeActions(): Promise<void> {
    const archiveIds = Object.entries(markedActions)
      .filter(([, action]) => action === 'archive')
      .map(([id]) => id)
    const trashIds = Object.entries(markedActions)
      .filter(([, action]) => action === 'trash')
      .map(([id]) => id)
    if (archiveIds.length === 0 && trashIds.length === 0) return

    setActionInProgress(true)
    try {
      if (archiveIds.length > 0) {
        await window.electron.ipcRenderer.invoke('gmail-archive', archiveIds)
      }
      if (trashIds.length > 0) {
        await window.electron.ipcRenderer.invoke('gmail-trash', trashIds)
      }
      const processedIds = new Set([...archiveIds, ...trashIds])
      setEmails((current) => current.filter((email) => !processedIds.has(email.id)))
      setMarkedActions({})
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setActionInProgress(false)
    }
  }

  async function runMarkedItemsQuery(): Promise<void> {
    if (markedItems.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const response = (await window.electron.ipcRenderer.invoke(
        'gmail-fetch-inbox'
      )) as FetchResponse
      if (!response.success) {
        setError(response.error ?? 'Unable to fetch the Inbox')
        return
      }

      const nextEmails = response.data ?? []
      const nextMarks: Record<string, MarkAction> = {}
      nextEmails.forEach((email) => {
        const item = findMarkedItem(email)
        if (item) nextMarks[email.id] = item.action
      })
      setEmails(nextEmails)
      setMarkedActions(nextMarks)
      setSelectedIds(new Set())
      setViewMode('emails')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  function editMarkedItem(item: MarkedItem): void {
    setEditingOpen(true)
    setEditingItem({ ...item })
    setEditingFrom(item.from)
    setEditingAction(item.action)
  }

  function closeMarkedItemEditor(): void {
    setEditingOpen(false)
    setEditingItem(null)
    setEditingFrom('')
    setEditingAction('archive')
  }

  function saveMarkedItem(): void {
    const from = editingFrom.trim()
    if (!from) return
    setMarkedItems((current) =>
      editingItem
        ? current.map((item) =>
            item.id === editingItem.id ? { ...item, from, action: editingAction } : item
          )
        : [{ id: crypto.randomUUID(), from, action: editingAction }, ...current]
    )
    closeMarkedItemEditor()
  }

  function deleteMarkedItem(id: string): void {
    setMarkedItems((current) => current.filter((item) => item.id !== id))
    if (editingItem?.id === id) closeMarkedItemEditor()
  }

  async function handleAuthorize(): Promise<void> {
    if (!authCode) return
    setActionInProgress(true)
    try {
      const response = (await window.electron.ipcRenderer.invoke(
        'gmail-submit-code',
        authCode
      )) as ResultResponse
      if (response.success) {
        setAuthCode('')
        void fetchEmails()
      } else {
        setError(response.error ?? 'Authorization failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setActionInProgress(false)
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <input
          className="w-52 rounded-md border border-line bg-panel px-3 py-1.5 text-sm outline-none placeholder:text-ink-dim"
          placeholder="Filter..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <button
          className="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2 disabled:opacity-30"
          disabled={markedItems.length === 0 || loading}
          onClick={() => void runMarkedItemsQuery()}
        >
          RUN QUERY
        </button>
        <button
          className="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2"
          onClick={() => setViewMode(viewMode === 'emails' ? 'marked' : 'emails')}
        >
          {viewMode === 'emails' ? 'RULES' : 'INBOX'}
        </button>
        <button
          className="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2 disabled:opacity-30"
          disabled={loading}
          onClick={() => void fetchEmails()}
        >
          {loading ? '…' : 'REFRESH'}
        </button>
        <span className="font-mono text-[11px] text-ink-dim">
          {senderCount} senders · {undecided.length} undecided
        </span>
        {selectedIds.size > 0 && (
          <span className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-brand">{selectedIds.size} selected</span>
            <button
              className="rounded bg-panel2 px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-on-brand"
              onClick={() => void mark([...selectedIds], 'archive')}
            >
              ARCHIVE
            </button>
            <button
              className="rounded bg-panel2 px-2 py-1 font-mono text-[10px] hover:bg-danger hover:text-on-danger"
              onClick={() => void mark([...selectedIds], 'trash')}
            >
              DELETE
            </button>
            <button
              className="font-mono text-[10px] text-ink-dim hover:text-ink"
              onClick={() => setSelectedIds(new Set())}
            >
              clear
            </button>
          </span>
        )}
        <label className="ml-auto flex items-center gap-2 font-mono text-[10px] text-ink-dim">
          <input
            type="checkbox"
            checked={autoApply}
            onChange={(event) => setAutoApply(event.target.checked)}
          />{' '}
          auto-apply
        </label>
        <ThemePicker current={theme} onChange={setTheme} />
      </header>

      {error && (
        <ErrorPanel
          error={error}
          authCode={authCode}
          actionInProgress={actionInProgress}
          onAuthCodeChange={setAuthCode}
          onAuthorize={() => void handleAuthorize()}
        />
      )}

      {viewMode === 'marked' ? (
        <MarkedItemsView
          markedItems={markedItems}
          onEdit={editMarkedItem}
          onDelete={deleteMarkedItem}
        />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] divide-x divide-line">
          <TriageRows
            emails={undecided}
            selection={selectedIds}
            rules={markedItems}
            onselect={setSelectedIds}
            onmark={(ids, action) => void mark(ids, action)}
            onalways={(from, action) => void always(from, action)}
            formatDate={formatEmailDate}
          />
          <StagingBins
            emails={emails}
            marks={markedActions}
            rules={markedItems}
            busy={actionInProgress}
            onunmark={unmark}
            onunmarkall={() => setMarkedActions({})}
            onapply={() => void executeActions()}
          />
        </div>
      )}

      {editingOpen && (
        <MarkedItemEditor
          from={editingFrom}
          action={editingAction}
          onFromChange={setEditingFrom}
          onActionChange={setEditingAction}
          onCancel={closeMarkedItemEditor}
          onSave={saveMarkedItem}
        />
      )}
    </main>
  )
}
