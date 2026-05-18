<script lang="ts">
  import { onMount } from 'svelte';
  import { Agentation } from 'agentation-svelte';
  import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
  import ErrorPanel from './components/ErrorPanel.svelte';
  import HeaderControls from './components/HeaderControls.svelte';
  import MailTable from './components/MailTable.svelte';
  import MarkedItemEditor from './components/MarkedItemEditor.svelte';
  import MarkedItemsView from './components/MarkedItemsView.svelte';
  import type { EmailMsg, MarkAction, MarkedItem, SortKey, ViewMode } from './types';

  let emails = $state<EmailMsg[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let searchQuery = $state('');
  let sortKey = $state<SortKey>('date');
  let sortDesc = $state(true);

  let selectedIds = $state<Set<string>>(new Set());
  let lastSelectedId = $state<string | null>(null);
  let markedActions = $state<Record<string, MarkAction>>({});
  let markedItems = $state<MarkedItem[]>([]);
  let viewMode = $state<ViewMode>('emails');
  let queryActive = $state(false);

  let actionInProgress = $state(false);
  let autoApply = $state(false);

  let colWidths = $state([200, 400, 150]);
  let startWidth = 0;

  let hoveredEmail = $state<EmailMsg | null>(null);
  let peekExpanded = $state(false);
  let editingOpen = $state(false);
  let editingItem = $state<MarkedItem | null>(null);
  let editingFrom = $state('');
  let editingAction = $state<MarkAction>('archive');
  let authCode = $state('');

  onMount(() => {
    loadSettings();
    fetchEmails();
  });

  $effect(() => {
    localStorage.setItem('colWidths', JSON.stringify(colWidths));
  });

  $effect(() => {
    localStorage.setItem('sortInfo', JSON.stringify({ key: sortKey, desc: sortDesc }));
  });

  $effect(() => {
    localStorage.setItem('autoApply', autoApply.toString());
  });

  $effect(() => {
    localStorage.setItem('markedItems', JSON.stringify(markedItems));
  });

  const queryEmails = $derived(queryActive ? emails.filter((email) => markedActions[email.id]) : emails);
  const filteredEmails = $derived(filterEmails(queryEmails, searchQuery));
  const sortedEmails = $derived(sortEmails(filteredEmails, sortKey, sortDesc));
  const sortedMarkedItems = $derived(sortMarkedItems(markedItems));
  const markedCount = $derived(Object.keys(markedActions).length);
  const markedItemCount = $derived(markedItems.length);
  const gridStyle = $derived(`grid-template-columns: ${colWidths[0]}px 4px minmax(50px, 1fr) 4px ${colWidths[2]}px;`);

  function loadSettings() {
    colWidths = readJsonSetting('colWidths', colWidths);
    const savedSort = readJsonSetting<{ key: SortKey; desc: boolean } | null>('sortInfo', null);
    if (savedSort) {
      sortKey = savedSort.key;
      sortDesc = savedSort.desc;
    }
    autoApply = localStorage.getItem('autoApply') === 'true';
    markedItems = readJsonSetting('markedItems', markedItems);
  }

  function readJsonSetting<T>(key: string, fallback: T): T {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Failed to parse ${key}`, e);
      return fallback;
    }
  }

  function filterEmails(sourceEmails: EmailMsg[], query: string) {
    const normalizedQuery = query.toLowerCase();
    return sourceEmails.filter((email) =>
      email.from.toLowerCase().includes(normalizedQuery) ||
      email.subject.toLowerCase().includes(normalizedQuery) ||
      email.snippet.toLowerCase().includes(normalizedQuery)
    );
  }

  function sortEmails(sourceEmails: EmailMsg[], key: SortKey, desc: boolean) {
    return [...sourceEmails].sort((a, b) => {
      if (key === 'date') {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return desc ? dateB - dateA : dateA - dateB;
      }

      const valA = a[key].toLowerCase();
      const valB = b[key].toLowerCase();
      if (valA < valB) return desc ? 1 : -1;
      if (valA > valB) return desc ? -1 : 1;
      return 0;
    });
  }

  function sortMarkedItems(sourceItems: MarkedItem[]) {
    return [...sourceItems].sort((a, b) =>
      a.from.localeCompare(b.from, undefined, { sensitivity: 'base' })
    );
  }

  function fitColumns() {
    const dateTexts = sortedEmails.map(formatEmailDate);
    const dateWidth = fitTextColumnPx(['DATE', ...dateTexts], '11px "JetBrains Mono", monospace', 96, 180);
    const fromWidth = fitTextColumnPx(['FROM', ...sortedEmails.map((email) => email.from)], '14px "Bricolage Grotesque", sans-serif', 120, 420);
    colWidths[2] = dateWidth;
    colWidths[0] = fromWidth + 34;
  }

  function fitTextColumnPx(texts: string[], font: string, minPx: number, maxPx: number) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return minPx;

    context.font = font;
    const widestTextPx = texts.reduce((width, text) => Math.max(width, context.measureText(text).width), 0);
    return Math.min(maxPx, Math.max(minPx, Math.ceil(widestTextPx) + 28));
  }

  function formatEmailDate(email: EmailMsg) {
    return new Date(email.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function fetchEmails() {
    loading = true;
    error = null;
    try {
      // @ts-ignore
      const res = await window.electron.ipcRenderer.invoke('gmail-fetch-inbox');
      if (res.success) {
        emails = res.data;
        selectedIds = new Set();
        lastSelectedId = null;
        markedActions = {};
        queryActive = false;
      } else {
        error = res.error;
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      sortDesc = !sortDesc;
    } else {
      sortKey = key;
      sortDesc = true;
    }
  }

  function handleRowClick(event: MouseEvent | KeyboardEvent, email: EmailMsg) {
    if (event.altKey) {
      event.preventDefault();
      openMarkedItemEditor(email);
      return;
    }

    const newSelected = new Set(selectedIds);
    if (newSelected.has(email.id)) {
      newSelected.delete(email.id);
    } else {
      newSelected.add(email.id);
    }
    selectedIds = newSelected;
    lastSelectedId = email.id;
  }

  function handleRowRightClick(event: MouseEvent, id: string) {
    event.preventDefault();
    if (!lastSelectedId) {
      selectedIds = new Set([id]);
      lastSelectedId = id;
      return;
    }

    const currentIdx = sortedEmails.findIndex((email) => email.id === id);
    const lastIdx = sortedEmails.findIndex((email) => email.id === lastSelectedId);
    if (currentIdx === -1 || lastIdx === -1) return;

    const start = Math.min(currentIdx, lastIdx);
    const end = Math.max(currentIdx, lastIdx);
    const newSelected = new Set(selectedIds);
    for (let i = start; i <= end; i++) {
      newSelected.add(sortedEmails[i].id);
    }
    selectedIds = newSelected;
    lastSelectedId = id;
  }

  function handleRowMouseDown(event: MouseEvent, id: string) {
    if (event.button !== 1) return;

    event.preventDefault();
    if (selectedIds.has(id)) {
      selectedIds = new Set();
      return;
    }

    const newSelected = new Set(selectedIds);
    for (const email of sortedEmails) {
      newSelected.add(email.id);
    }
    selectedIds = newSelected;
  }

  function handleMouseMove(e: MouseEvent, email: EmailMsg) {
    if (e.ctrlKey) {
      if (hoveredEmail?.id !== email.id) peekExpanded = false;
      hoveredEmail = email;
    }
  }

  async function markSelected(action: MarkAction | 'unmark') {
    if (selectedIds.size === 0) return;

    if (autoApply && action !== 'unmark') {
      await applyActionToIds(action, Array.from(selectedIds));
      selectedIds = new Set();
      return;
    }

    const newMarks = { ...markedActions };
    for (const id of selectedIds) {
      if (action === 'unmark') {
        delete newMarks[id];
      } else {
        newMarks[id] = action;
      }
    }
    markedActions = newMarks;
    selectedIds = new Set();
  }

  function unmarkSelectedOrAll() {
    if (selectedIds.size > 0) {
      markSelected('unmark');
      return;
    }
    markedActions = {};
  }

  async function executeActions() {
    const archiveIds = Object.entries(markedActions).filter(([_, action]) => action === 'archive').map(([id]) => id);
    const trashIds = Object.entries(markedActions).filter(([_, action]) => action === 'trash').map(([id]) => id);
    if (archiveIds.length === 0 && trashIds.length === 0) return;

    actionInProgress = true;
    try {
      if (archiveIds.length > 0) await window.electron.ipcRenderer.invoke('gmail-archive', archiveIds);
      if (trashIds.length > 0) await window.electron.ipcRenderer.invoke('gmail-trash', trashIds);
      const processedIds = new Set([...archiveIds, ...trashIds]);
      emails = emails.filter((email) => !processedIds.has(email.id));
      markedActions = {};
    } catch (err: any) {
      error = err.message;
    } finally {
      actionInProgress = false;
    }
  }

  async function applyActionToIds(action: MarkAction, ids: string[]) {
    actionInProgress = true;
    try {
      if (action === 'archive') await window.electron.ipcRenderer.invoke('gmail-archive', ids);
      if (action === 'trash') await window.electron.ipcRenderer.invoke('gmail-trash', ids);
      const processedIds = new Set(ids);
      emails = emails.filter((email) => !processedIds.has(email.id));
    } catch (err: any) {
      error = err.message;
    } finally {
      actionInProgress = false;
    }
  }

  function findMarkedItem(email: EmailMsg) {
    const from = email.from.toLowerCase();
    return markedItems.find((item) => item.from.trim() && from.includes(item.from.trim().toLowerCase()));
  }

  async function runMarkedItemsQuery() {
    if (markedItems.length === 0) return;
    loading = true;
    error = null;
    try {
      // @ts-ignore
      const res = await window.electron.ipcRenderer.invoke('gmail-fetch-inbox');
      if (!res.success) {
        error = res.error;
        return;
      }

      const nextEmails = res.data as EmailMsg[];
      const nextMarks: Record<string, MarkAction> = {};
      for (const email of nextEmails) {
        const item = findMarkedItem(email);
        if (item) nextMarks[email.id] = item.action;
      }

      emails = nextEmails;
      markedActions = nextMarks;
      selectedIds = new Set();
      lastSelectedId = null;
      queryActive = true;
      viewMode = 'emails';
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function openMarkedItemEditor(email: EmailMsg) {
    const existing = findMarkedItem(email);
    editingOpen = true;
    editingItem = existing ? { ...existing } : null;
    editingFrom = existing?.from ?? email.from;
    editingAction = existing?.action ?? 'archive';
  }

  function editMarkedItem(item: MarkedItem) {
    editingOpen = true;
    editingItem = { ...item };
    editingFrom = item.from;
    editingAction = item.action;
  }

  function saveMarkedItem() {
    const from = editingFrom.trim();
    if (!from) return;

    if (editingItem) {
      markedItems = markedItems.map((item) =>
        item.id === editingItem?.id ? { ...item, from, action: editingAction } : item
      );
    } else {
      markedItems = [{ id: crypto.randomUUID(), from, action: editingAction }, ...markedItems];
    }
    closeMarkedItemEditor();
  }

  function deleteMarkedItem(id: string) {
    markedItems = markedItems.filter((item) => item.id !== id);
    if (editingItem?.id === id) closeMarkedItemEditor();
  }

  function closeMarkedItemEditor() {
    editingOpen = false;
    editingItem = null;
    editingFrom = '';
    editingAction = 'archive';
  }

  async function handleAuthorize() {
    if (!authCode) return;
    actionInProgress = true;
    try {
      // @ts-ignore
      const res = await window.electron.ipcRenderer.invoke('gmail-submit-code', authCode);
      if (res.success) {
        authCode = '';
        fetchEmails();
      } else {
        error = res.error;
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      actionInProgress = false;
    }
  }

  function resizable(node: HTMLElement, index: number) {
    return draggable({
      element: node,
      onDragStart: () => {
        startWidth = index === 0 ? colWidths[0] : colWidths[2];
      },
      onDrag: ({ location }) => {
        const deltaX = location.current.input.clientX - location.initial.input.clientX;

        if (index === 0) {
          colWidths[0] = Math.max(50, startWidth + deltaX);
        } else {
          colWidths[2] = Math.max(80, startWidth - deltaX);
        }
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        nativeSetDragImage(new Image(), 0, 0);
      }
    });
  }
</script>

<main class="h-screen w-screen flex flex-col p-4 bg-base text-accent">
  <HeaderControls
    {searchQuery}
    {autoApply}
    {viewMode}
    emailCount={emails.length}
    selectedCount={selectedIds.size}
    {markedCount}
    {markedItemCount}
    {actionInProgress}
    {loading}
      onSearchChange={(value) => searchQuery = value}
      onAutoApplyChange={(value) => autoApply = value}
    onToggleView={() => viewMode = viewMode === 'emails' ? 'marked' : 'emails'}
      onRunQuery={runMarkedItemsQuery}
    onMarkArchive={() => markSelected('archive')}
    onMarkTrash={() => markSelected('trash')}
    onUnmark={unmarkSelectedOrAll}
    onApplyAll={executeActions}
    onRefresh={fetchEmails}
  />

  {#if error}
    <ErrorPanel
      {error}
      {authCode}
      {actionInProgress}
      onAuthCodeChange={(value) => authCode = value}
      onAuthorize={handleAuthorize}
    />
  {/if}

  {#if queryActive && viewMode === 'emails'}
    <div class="mb-3 flex items-center justify-between shrink-0 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2 font-mono text-[10px] uppercase text-brand">
      <span>QUERY_RESULT: {markedCount} matched inbox emails</span>
      <button onclick={() => queryActive = false} class="text-accent-dim hover:text-accent">SHOW_ALL</button>
    </div>
  {/if}

  <div class="flex-1 overflow-hidden border border-surface-active rounded-xl bg-surface flex flex-col shadow-xl">
    {#if viewMode === 'emails'}
      <MailTable
        emails={sortedEmails}
        {loading}
        {selectedIds}
        {markedActions}
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
        onRowMouseLeave={() => {}}
      />
    {:else}
      <MarkedItemsView
        markedItems={sortedMarkedItems}
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
      onclick={() => peekExpanded = !peekExpanded}
      onkeydown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          peekExpanded = !peekExpanded;
        }
      }}
      class="fixed bottom-4 right-4 z-50 w-[min(520px,calc(100vw-32px))] {peekExpanded ? 'max-h-[calc(100vh-96px)]' : ''} rounded-lg border border-brand/50 bg-surface-active p-4 text-left shadow-2xl transition-all hover:border-brand/70"
    >
      <div class="mb-3 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="font-mono text-[10px] uppercase tracking-wider text-brand">Email Peek</div>
          <div class="truncate text-sm font-semibold text-accent">{hoveredEmail.from}</div>
        </div>
        <div class="flex shrink-0 items-start gap-2">
          <div class="whitespace-nowrap pt-1 text-right font-mono text-[10px] uppercase text-accent-dim">
            {formatEmailDate(hoveredEmail)}
          </div>
          <button
            type="button"
            aria-label={peekExpanded ? 'Collapse email peek' : 'Expand email peek'}
            onclick={(event) => {
              event.stopPropagation();
              peekExpanded = !peekExpanded;
            }}
            class="rounded border border-brand/30 bg-brand/10 px-2 py-1 font-mono text-[10px] uppercase text-brand transition-colors hover:border-brand/60 hover:bg-brand/20"
          >
            {peekExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button
            type="button"
            aria-label="Close email peek"
            onclick={(event) => {
              event.stopPropagation();
              hoveredEmail = null;
              peekExpanded = false;
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
      <div class="{peekExpanded ? 'max-h-[calc(100vh-240px)] overflow-y-auto whitespace-pre-wrap pr-2' : 'max-h-32 overflow-hidden'} text-xs leading-relaxed text-accent/75">
        {peekExpanded ? hoveredEmail.body || hoveredEmail.snippet : hoveredEmail.snippet}
      </div>
    </div>
  {/if}

  {#if editingOpen}
    <MarkedItemEditor
      from={editingFrom}
      action={editingAction}
      onFromChange={(value) => editingFrom = value}
      onActionChange={(value) => editingAction = value}
      onCancel={closeMarkedItemEditor}
      onSave={saveMarkedItem}
    />
  {/if}

  <Agentation endpoint="http://localhost:4747" />
</main>
