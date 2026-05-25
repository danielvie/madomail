<script lang="ts">
  import { onMount } from 'svelte'
  import { invoke } from '@tauri-apps/api/core'
  import { Agentation } from 'agentation-svelte'
  import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
  import ErrorPanel from './components/ErrorPanel.svelte'
  import HeaderControls from './components/HeaderControls.svelte'
  import MailTable from './components/MailTable.svelte'
  import MarkedItemEditor from './components/MarkedItemEditor.svelte'
  import MarkedItemsView from './components/MarkedItemsView.svelte'
  import type { EmailMsg, FolderOption, MarkedItem, MoveResult, SortKey, ViewMode } from './types'

  let emails = $state<EmailMsg[]>([])
  let folders = $state<FolderOption[]>([])
  let recentFolders = $state<string[]>([])
  let loading = $state(false)
  let inboxLoading = $state(false)
  let error = $state<string | null>(null)

  let searchQuery = $state('')
  let folderFilter = $state('')
  let sortKey = $state<SortKey>('date')
  let sortDesc = $state(true)

  let selectedFolderPath = $state('')
  let selectedIds = $state<Set<string>>(new Set())
  let lastSelectedId = $state<string | null>(null)
  let assignedFolders = $state<Record<string, string>>({})
  let markedItems = $state<MarkedItem[]>([])
  let viewMode = $state<ViewMode>('emails')
  let queryActive = $state(false)

  let actionInProgress = $state(false)

  let colWidths = $state([220, 400, 150])
  let startWidth = 0

  let hoveredEmail = $state<EmailMsg | null>(null)
  let peekExpanded = $state(false)
  let editingOpen = $state(false)
  let editingItem = $state<MarkedItem | null>(null)
  let editingFrom = $state('')
  let editingFolderFilter = $state('')
  let editingFolderPath = $state('')

  onMount(() => {
    loadSettings()
    refreshAll()
    loadMarkedItemsFromDisk()
  })

  $effect(() => {
    localStorage.setItem('colWidths', JSON.stringify(colWidths))
  })

  $effect(() => {
    localStorage.setItem('sortInfo', JSON.stringify({ key: sortKey, desc: sortDesc }))
  })

  const filteredFolders = $derived(filterFolders(folders, folderFilter))
  const editorFilteredFolders = $derived(filterFolders(folders, editingFolderFilter))
  const filteredEmails = $derived(
    filterEmails(
      queryActive ? emails.filter((email) => assignedFolders[email.id]) : emails,
      searchQuery
    )
  )
  const sortedEmails = $derived(sortEmails(filteredEmails, sortKey, sortDesc))
  const sortedMarkedItems = $derived(sortMarkedItems(markedItems))
  const assignedCount = $derived(Object.keys(assignedFolders).length)
  const markedItemCount = $derived(markedItems.length)
  const invalidFolderPaths = $derived(
    new Set(
      markedItems
        .filter(
          (item) =>
            !folders.some((folder) => folder.path.toLowerCase() === item.folderPath.toLowerCase())
        )
        .map((item) => item.folderPath.toLowerCase())
    )
  )
  const editingFolderValid = $derived(
    !editingFolderPath ||
      folders.some((folder) => folder.path.toLowerCase() === editingFolderPath.toLowerCase())
  )
  const gridStyle = $derived(
    `grid-template-columns: ${colWidths[0]}px 4px minmax(50px, 1fr) 4px ${colWidths[2]}px;`
  )

  function loadSettings() {
    colWidths = readJsonSetting('colWidths', colWidths)
    const savedSort = readJsonSetting<{ key: SortKey; desc: boolean } | null>('sortInfo', null)
    if (savedSort) {
      sortKey = savedSort.key
      sortDesc = savedSort.desc
    }
  }

  function readJsonSetting<T>(key: string, fallback: T): T {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error(`Failed to parse ${key}`, e)
      return fallback
    }
  }

  async function loadMarkedItemsFromDisk() {
    try {
      const result = await invoke<{ success: boolean; data: MarkedItem[]; error?: string }>(
        'mail_get_marked_items'
      )
      if (!result.success) {
        error = result.error
        return
      }
      markedItems = result.data
    } catch (err: any) {
      error = err.message
    }
  }

  async function persistMarkedItems(nextItems: MarkedItem[]) {
    try {
      const result = await invoke<{ success: boolean; data: MarkedItem[]; error?: string }>(
        'mail_save_marked_items',
        { items: nextItems }
      )
      if (!result.success) {
        error = result.error
        return false
      }
      markedItems = result.data
      return true
    } catch (err: any) {
      error = err.message
      return false
    }
  }

  function filterEmails(sourceEmails: EmailMsg[], query: string) {
    const normalizedQuery = query.toLowerCase()
    return sourceEmails.filter(
      (email) =>
        email.from.toLowerCase().includes(normalizedQuery) ||
        email.subject.toLowerCase().includes(normalizedQuery) ||
        email.snippet.toLowerCase().includes(normalizedQuery)
    )
  }

  function filterFolders(sourceFolders: FolderOption[], query: string) {
    const normalizedQuery = query.toLowerCase()
    if (!normalizedQuery) return sourceFolders
    return sourceFolders.filter((folder) => folder.path.toLowerCase().includes(normalizedQuery))
  }

  function sortEmails(sourceEmails: EmailMsg[], key: SortKey, desc: boolean) {
    return [...sourceEmails].sort((a, b) => {
      if (key === 'date') {
        const dateA = new Date(a.date).getTime() || 0
        const dateB = new Date(b.date).getTime() || 0
        return desc ? dateB - dateA : dateA - dateB
      }

      const valA = a[key].toLowerCase()
      const valB = b[key].toLowerCase()
      if (valA < valB) return desc ? 1 : -1
      if (valA > valB) return desc ? -1 : 1
      return 0
    })
  }

  function sortMarkedItems(sourceItems: MarkedItem[]) {
    return [...sourceItems].sort((a, b) =>
      a.from.localeCompare(b.from, undefined, { sensitivity: 'base' })
    )
  }

  function fitColumns() {
    const dateTexts = sortedEmails.map(formatEmailDate)
    const dateWidth = fitTextColumnPx(
      ['DATE', ...dateTexts],
      '11px "JetBrains Mono", monospace',
      96,
      180
    )
    const fromWidth = fitTextColumnPx(
      ['FROM', ...sortedEmails.map((email) => email.from)],
      '14px "Bricolage Grotesque", sans-serif',
      120,
      420
    )
    colWidths[2] = dateWidth
    colWidths[0] = fromWidth + 34
  }

  function fitTextColumnPx(texts: string[], font: string, minPx: number, maxPx: number) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return minPx

    context.font = font
    const widestTextPx = texts.reduce(
      (width, text) => Math.max(width, context.measureText(text).width),
      0
    )
    return Math.min(maxPx, Math.max(minPx, Math.ceil(widestTextPx) + 28))
  }

  function formatEmailDate(email: EmailMsg) {
    return new Date(email.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function refreshAll(forceFolderRefresh = false) {
    loading = true
    inboxLoading = true
    error = null

    const emailPromise = invoke<{ success: boolean; data: EmailMsg[]; error?: string }>(
      'mail_fetch_inbox'
    )

    const folderPromise = invoke<{ success: boolean; data: FolderOption[]; error?: string }>(
      'mail_list_folders',
      { forceRefresh: forceFolderRefresh }
    )

    const recentPromise = invoke<{ success: boolean; data: string[]; error?: string }>(
      'mail_get_recent_folders'
    )

    try {
      const emailRes = await emailPromise
      if (!emailRes.success) {
        error = emailRes.error
      } else {
        emails = emailRes.data
        selectedIds = new Set()
        lastSelectedId = null
        assignedFolders = {}
        queryActive = false
      }
    } catch (err: any) {
      error = err.message
    } finally {
      inboxLoading = false
    }

    try {
      const folderRes = await folderPromise
      if (!folderRes.success) {
        if (!error) error = folderRes.error
      } else {
        folders = folderRes.data
      }
    } catch (err: any) {
      if (!error) error = err.message
    }

    try {
      const recentRes = await recentPromise
      if (!recentRes.success) {
        if (!error) error = recentRes.error
      } else {
        recentFolders = recentRes.data
      }
    } catch (err: any) {
      if (!error) error = err.message
    }

    const livePaths = new Set(folders.map((folder) => folder.path.toLowerCase()))
    if (!selectedFolderPath || !livePaths.has(selectedFolderPath.toLowerCase())) {
      selectedFolderPath = recentFolders.find((path) => livePaths.has(path.toLowerCase())) ?? ''
    }

    loading = false
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      sortDesc = !sortDesc
    } else {
      sortKey = key
      sortDesc = true
    }
  }

  function handleRowClick(event: MouseEvent | KeyboardEvent, email: EmailMsg) {
    if (event.altKey) {
      event.preventDefault()
      openMarkedItemEditor(email)
      return
    }

    const newSelected = new Set(selectedIds)
    if (newSelected.has(email.id)) {
      newSelected.delete(email.id)
    } else {
      newSelected.add(email.id)
    }
    selectedIds = newSelected
    lastSelectedId = email.id
  }

  function handleRowRightClick(event: MouseEvent, id: string) {
    event.preventDefault()
    if (!lastSelectedId) {
      selectedIds = new Set([id])
      lastSelectedId = id
      return
    }

    const currentIdx = sortedEmails.findIndex((email) => email.id === id)
    const lastIdx = sortedEmails.findIndex((email) => email.id === lastSelectedId)
    if (currentIdx === -1 || lastIdx === -1) return

    const start = Math.min(currentIdx, lastIdx)
    const end = Math.max(currentIdx, lastIdx)
    const newSelected = new Set(selectedIds)
    for (let i = start; i <= end; i++) {
      newSelected.add(sortedEmails[i].id)
    }
    selectedIds = newSelected
    lastSelectedId = id
  }

  function handleRowMouseDown(event: MouseEvent, id: string) {
    if (event.button !== 1) return

    event.preventDefault()
    if (selectedIds.has(id)) {
      selectedIds = new Set()
      return
    }

    const newSelected = new Set(selectedIds)
    for (const email of sortedEmails) {
      newSelected.add(email.id)
    }
    selectedIds = newSelected
  }

  function handleMouseMove(e: MouseEvent, email: EmailMsg) {
    if (e.ctrlKey) {
      if (hoveredEmail?.id !== email.id) peekExpanded = false
      hoveredEmail = email
    } else {
      hoveredEmail = null
    }
  }

  function normalizePath(path: string) {
    return path.replace(/\\/g, '/').trim()
  }

  function findMarkedItem(email: EmailMsg) {
    const sender = email.senderMatch.toLowerCase()
    const matches = markedItems.filter(
      (item) => item.from.trim() && sender.includes(item.from.trim().toLowerCase())
    )
    if (matches.length === 0) return null
    return matches.sort((a, b) => b.from.trim().length - a.from.trim().length)[0]
  }

  async function runMarkedItemsQuery() {
    if (markedItems.length === 0) return
    loading = true
    error = null
    try {
      const res = await invoke<{ success: boolean; data: EmailMsg[]; error?: string }>(
        'mail_fetch_inbox'
      )
      if (!res.success) {
        error = res.error
        return
      }

      const nextEmails = res.data as EmailMsg[]
      const nextAssignments: Record<string, string> = {}
      for (const email of nextEmails) {
        const item = findMarkedItem(email)
        if (item) nextAssignments[email.id] = item.folderPath
      }

      emails = nextEmails
      assignedFolders = nextAssignments
      selectedIds = new Set()
      lastSelectedId = null
      queryActive = true
      viewMode = 'emails'
    } catch (err: any) {
      error = err.message
    } finally {
      loading = false
    }
  }

  async function moveToFolder(ids: string[], folderPath: string) {
    if (ids.length === 0 || !folderPath) return true

    actionInProgress = true
    error = null
    try {
      const res = await invoke<{ success: boolean; data: MoveResult[]; error?: string }>(
        'mail_move',
        { ids, folderPath }
      )
      if (!res.success) {
        error = res.error
        return false
      }

      const results = res.data as MoveResult[]
      const failures = results.filter((result) => !result.success)
      if (failures.length > 0) {
        const successCount = results.length - failures.length
        error = `Moved ${successCount}/${results.length} emails. ${failures[0].error ?? 'Some moves failed.'}`
      }
      return true
    } catch (err: any) {
      error = err.message
      return false
    } finally {
      actionInProgress = false
    }
  }

  async function moveSelectedToCurrentFolder() {
    const ids = Array.from(selectedIds)
    const moved = await moveToFolder(ids, selectedFolderPath)
    if (!moved) return

    selectedIds = new Set()
    await refreshAll()
  }

  async function handleRecentFolderClick(folderPath: string) {
    if (selectedIds.size > 0) {
      const moved = await moveToFolder(Array.from(selectedIds), folderPath)
      if (!moved) return
      selectedFolderPath = folderPath
      selectedIds = new Set()
      await refreshAll()
      return
    }

    selectedFolderPath = folderPath
  }

  function clearAssignments() {
    assignedFolders = {}
    queryActive = false
  }

  async function applyRuleMoves() {
    const groups = new Map<string, string[]>()
    for (const [id, folderPath] of Object.entries(assignedFolders)) {
      const nextIds = groups.get(folderPath) ?? []
      nextIds.push(id)
      groups.set(folderPath, nextIds)
    }

    if (groups.size === 0) return

    for (const [folderPath, ids] of groups) {
      const moved = await moveToFolder(ids, folderPath)
      if (!moved) break
    }

    await refreshAll()
  }

  function openMarkedItemEditor(email: EmailMsg) {
    const existing = findMarkedItem(email)
    editingOpen = true
    editingItem = existing ? { ...existing } : null
    editingFrom = existing?.from ?? email.from
    editingFolderPath = existing?.folderPath ?? selectedFolderPath
    editingFolderFilter = ''
  }

  function editMarkedItem(item: MarkedItem) {
    editingOpen = true
    editingItem = { ...item }
    editingFrom = item.from
    editingFolderPath = item.folderPath
    editingFolderFilter = ''
  }

  async function saveMarkedItem() {
    const from = editingFrom.trim()
    const folderPath = normalizePath(editingFolderPath)
    if (!from || !folderPath) return

    const nextItems = editingItem
      ? markedItems.map((item) =>
          item.id === editingItem?.id ? { ...item, from, folderPath } : item
        )
      : [{ id: crypto.randomUUID(), from, folderPath }, ...markedItems]

    const saved = await persistMarkedItems(nextItems)
    if (saved) closeMarkedItemEditor()
  }

  async function deleteMarkedItem(id: string) {
    const nextItems = markedItems.filter((item) => item.id !== id)
    const saved = await persistMarkedItems(nextItems)
    if (saved && editingItem?.id === id) closeMarkedItemEditor()
  }

  function closeMarkedItemEditor() {
    editingOpen = false
    editingItem = null
    editingFrom = ''
    editingFolderFilter = ''
    editingFolderPath = ''
  }

  function resizable(node: HTMLElement, index: number) {
    return draggable({
      element: node,
      onDragStart: () => {
        startWidth = index === 0 ? colWidths[0] : colWidths[2]
      },
      onDrag: ({ location }) => {
        const deltaX = location.current.input.clientX - location.initial.input.clientX

        if (index === 0) {
          colWidths[0] = Math.max(50, startWidth + deltaX)
        } else {
          colWidths[2] = Math.max(80, startWidth - deltaX)
        }
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        nativeSetDragImage(new Image(), 0, 0)
      }
    })
  }
</script>

<main class="h-screen w-screen flex flex-col p-4 bg-base text-accent">
  <HeaderControls
    {searchQuery}
    {folderFilter}
    {selectedFolderPath}
    {filteredFolders}
    {recentFolders}
    {viewMode}
    emailCount={emails.length}
    selectedCount={selectedIds.size}
    {assignedCount}
    {markedItemCount}
    {actionInProgress}
    {loading}
    onSearchChange={(value) => (searchQuery = value)}
    onFolderFilterChange={(value) => (folderFilter = value)}
    onFolderPathChange={(value) => (selectedFolderPath = normalizePath(value))}
    onRecentFolderClick={handleRecentFolderClick}
    onToggleView={() => (viewMode = viewMode === 'emails' ? 'marked' : 'emails')}
    onRunQuery={runMarkedItemsQuery}
    onMoveSelected={moveSelectedToCurrentFolder}
    onClearAssignments={clearAssignments}
    onApplyRules={applyRuleMoves}
    onRefresh={() => refreshAll(true)}
  />

  {#if error}
    <ErrorPanel {error} />
  {/if}

  {#if queryActive && viewMode === 'emails'}
    <div
      class="mb-3 flex items-center justify-between shrink-0 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 font-mono text-[10px] uppercase text-brand"
    >
      <span>QUERY_RESULT: {assignedCount} matched inbox emails</span>
      <button onclick={() => (queryActive = false)} class="text-accent-dim hover:text-accent"
        >SHOW_ALL</button
      >
    </div>
  {/if}

  <div
    class="flex-1 overflow-hidden border border-surface-active rounded-xl bg-surface flex flex-col shadow-xl"
  >
    {#if viewMode === 'emails'}
      <MailTable
        emails={sortedEmails}
        loading={inboxLoading}
        {selectedIds}
        {assignedFolders}
        {sortKey}
        {sortDesc}
        {gridStyle}
        {resizable}
        onFitColumns={fitColumns}
        onSort={handleSort}
        onRowClick={handleRowClick}
        onRowRightClick={handleRowRightClick}
        onRowMouseDown={handleRowMouseDown}
        onRowMouseMove={handleMouseMove}
        onRowMouseLeave={() => (hoveredEmail = null)}
      />
    {:else}
      <MarkedItemsView
        markedItems={sortedMarkedItems}
        {invalidFolderPaths}
        onEdit={editMarkedItem}
        onDelete={deleteMarkedItem}
      />
    {/if}
  </div>

  {#if hoveredEmail}
    <div
      role="button"
      tabindex="0"
      aria-label={peekExpanded ? 'Collapse email peek' : 'Expand email peek'}
      onclick={() => (peekExpanded = !peekExpanded)}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          peekExpanded = !peekExpanded
        }
      }}
      class="fixed bottom-4 right-4 z-50 w-[min(520px,calc(100vw-32px))] {peekExpanded
        ? 'max-h-[calc(100vh-96px)]'
        : ''} rounded-lg border border-brand/50 bg-surface-active p-4 text-left shadow-2xl transition-all hover:border-brand/70"
    >
      <div class="mb-3 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="font-mono text-[10px] uppercase tracking-wider text-brand">Email Peek</div>
          <div class="truncate text-sm font-semibold text-accent">{hoveredEmail.from}</div>
        </div>
        <div class="flex shrink-0 items-start gap-2">
          <div
            class="whitespace-nowrap pt-1 text-right font-mono text-[10px] uppercase text-accent-dim"
          >
            {formatEmailDate(hoveredEmail)}
          </div>
          <button
            type="button"
            aria-label={peekExpanded ? 'Collapse email peek' : 'Expand email peek'}
            onclick={(event) => {
              event.stopPropagation()
              peekExpanded = !peekExpanded
            }}
            class="rounded border border-brand/30 bg-brand/10 px-2 py-1 font-mono text-[10px] uppercase text-brand transition-colors hover:border-brand/60 hover:bg-brand/20"
          >
            {peekExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            type="button"
            aria-label="Close email peek"
            onclick={(event) => {
              event.stopPropagation()
              hoveredEmail = null
              peekExpanded = false
            }}
            class="rounded border border-accent/20 bg-surface-hover px-2 py-1 font-mono text-[10px] uppercase text-accent-dim transition-colors hover:border-brand/40 hover:text-brand"
          >
            Close
          </button>
        </div>
      </div>
      <div class="mb-2 {peekExpanded ? '' : 'line-clamp-2'} text-sm font-medium text-accent/90">
        {hoveredEmail.subject || '(No Subject)'}
      </div>
      <div
        class="{peekExpanded
          ? 'max-h-[calc(100vh-240px)] overflow-y-auto whitespace-pre-wrap pr-2'
          : 'max-h-32 overflow-hidden'} text-xs leading-relaxed text-accent/75"
      >
        {peekExpanded ? hoveredEmail.body || hoveredEmail.snippet : hoveredEmail.snippet}
      </div>
    </div>
  {/if}

  {#if editingOpen}
    <MarkedItemEditor
      from={editingFrom}
      folderFilter={editingFolderFilter}
      folderPath={editingFolderPath}
      filteredFolders={editorFilteredFolders}
      folderValid={editingFolderValid}
      onFromChange={(value) => (editingFrom = value)}
      onFolderFilterChange={(value) => (editingFolderFilter = value)}
      onFolderPathChange={(value) => (editingFolderPath = normalizePath(value))}
      onCancel={closeMarkedItemEditor}
      onSave={saveMarkedItem}
    />
  {/if}

  <Agentation endpoint="http://localhost:4747" />
</main>
