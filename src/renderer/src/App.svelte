<script lang="ts">
  import { onMount } from 'svelte';
  import ErrorPanel from './components/ErrorPanel.svelte';
  import MarkedItemEditor from './components/MarkedItemEditor.svelte';
  import MarkedItemsView from './components/MarkedItemsView.svelte';
  import StagingBins from './components/StagingBins.svelte';
  import ThemePicker, { DEFAULT_THEME, loadTheme } from './components/ThemePicker.svelte';
  import TriageRows from './components/TriageRows.svelte';
  import { senderAddr } from './lib/sender';
  import type { EmailMsg, MarkAction, MarkedItem, ViewMode } from './types';

  let emails = $state<EmailMsg[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  let searchQuery = $state('');
  let selectedIds = $state<Set<string>>(new Set());
  let markedActions = $state<Record<string, MarkAction>>({});
  let markedItems = $state<MarkedItem[]>([]);
  let viewMode = $state<ViewMode>('emails');

  let actionInProgress = $state(false);
  let autoApply = $state(false);
  let theme = $state<string>(DEFAULT_THEME);

  let editingOpen = $state(false);
  let editingItem = $state<MarkedItem | null>(null);
  let editingFrom = $state('');
  let editingAction = $state<MarkAction>('archive');
  let authCode = $state('');

  onMount(() => {
    theme = loadTheme();
    loadSettings();
    fetchEmails();
  });

  $effect(() => {
    localStorage.setItem('autoApply', autoApply.toString());
  });

  $effect(() => {
    localStorage.setItem('markedItems', JSON.stringify(markedItems));
  });

  /** Everything still awaiting a decision, after the search box. */
  const undecided = $derived(
    emails.filter((email) => {
      if (markedActions[email.id]) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        email.from.toLowerCase().includes(q) ||
        email.subject.toLowerCase().includes(q) ||
        email.snippet.toLowerCase().includes(q)
      );
    })
  );

  const markedCount = $derived(Object.keys(markedActions).length);
  const senderCount = $derived(new Set(undecided.map((email) => senderAddr(email.from))).size);

  function loadSettings() {
    autoApply = localStorage.getItem('autoApply') === 'true';
    const saved = localStorage.getItem('markedItems');
    if (saved) {
      try {
        markedItems = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse markedItems', e);
      }
    }
  }

  function formatEmailDate(date: string) {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString(undefined, {
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
        markedActions = {};
      } else {
        error = res.error;
      }
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function findMarkedItem(email: EmailMsg) {
    const from = email.from.toLowerCase();
    return markedItems.find((item) => item.from.trim() && from.includes(item.from.trim().toLowerCase()));
  }

  async function mark(ids: string[], action: MarkAction) {
    if (ids.length === 0) return;
    if (autoApply) {
      await applyActionToIds(action, ids);
      selectedIds = new Set();
      return;
    }
    const next = { ...markedActions };
    for (const id of ids) next[id] = action;
    markedActions = next;
    selectedIds = new Set();
  }

  function unmark(ids: string[]) {
    const next = { ...markedActions };
    for (const id of ids) delete next[id];
    markedActions = next;
  }

  /** Save a sender rule and stage everything it already matches. */
  async function always(from: string, action: MarkAction) {
    const key = senderAddr(from);
    const existing = markedItems.find((item) => item.from === key);
    if (existing) {
      markedItems = markedItems.map((item) =>
        item.id === existing.id ? { ...item, action } : item
      );
    } else {
      markedItems = [{ id: crypto.randomUUID(), from: key, action }, ...markedItems];
    }
    await mark(
      emails.filter((e) => senderAddr(e.from) === key && !markedActions[e.id]).map((e) => e.id),
      action
    );
  }

  async function executeActions() {
    const archiveIds = Object.entries(markedActions)
      .filter(([, action]) => action === 'archive')
      .map(([id]) => id);
    const trashIds = Object.entries(markedActions)
      .filter(([, action]) => action === 'trash')
      .map(([id]) => id);
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

  /** Refresh the Inbox, then stage every message the saved sender rules match. */
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
      viewMode = 'emails';
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
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
</script>

<main class="flex h-screen flex-col overflow-hidden bg-canvas text-ink">
  <header class="flex items-center gap-2 border-b border-line px-3 py-2">
    <input
      class="w-52 rounded-md border border-line bg-panel px-3 py-1.5 text-sm outline-none placeholder:text-ink-dim"
      placeholder="Filter..."
      bind:value={searchQuery}
    />
    <button
      class="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2 disabled:opacity-30"
      disabled={markedItems.length === 0 || loading}
      onclick={runMarkedItemsQuery}>RUN QUERY</button
    >
    <button
      class="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2"
      onclick={() => (viewMode = viewMode === 'emails' ? 'marked' : 'emails')}
      >{viewMode === 'emails' ? 'RULES' : 'INBOX'}</button
    >
    <button
      class="rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] hover:bg-panel2 disabled:opacity-30"
      disabled={loading}
      onclick={fetchEmails}>{loading ? '…' : 'REFRESH'}</button
    >

    <span class="font-mono text-[11px] text-ink-dim">
      {senderCount} senders · {undecided.length} undecided
    </span>

    {#if selectedIds.size}
      <span class="flex items-center gap-2">
        <span class="font-mono text-[11px] text-brand">{selectedIds.size} selected</span>
        <button
          class="rounded bg-panel2 px-2 py-1 font-mono text-[10px] hover:bg-brand hover:text-on-brand"
          onclick={() => mark([...selectedIds], 'archive')}>ARCHIVE</button
        >
        <button
          class="rounded bg-panel2 px-2 py-1 font-mono text-[10px] hover:bg-danger hover:text-on-danger"
          onclick={() => mark([...selectedIds], 'trash')}>DELETE</button
        >
        <button
          class="font-mono text-[10px] text-ink-dim hover:text-ink"
          onclick={() => (selectedIds = new Set())}>clear</button
        >
      </span>
    {/if}

    <label class="ml-auto flex items-center gap-2 font-mono text-[10px] text-ink-dim">
      <input type="checkbox" bind:checked={autoApply} /> auto-apply
    </label>
    <ThemePicker bind:current={theme} />
  </header>

  {#if error}
    <ErrorPanel
      {error}
      {authCode}
      {actionInProgress}
      onAuthCodeChange={(value) => (authCode = value)}
      onAuthorize={handleAuthorize}
    />
  {/if}

  {#if viewMode === 'marked'}
    <MarkedItemsView
      {markedItems}
      onEdit={editMarkedItem}
      onDelete={deleteMarkedItem}
    />
  {:else}
    <div class="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_300px] divide-x divide-line">
      <TriageRows
        emails={undecided}
        selection={selectedIds}
        rules={markedItems}
        onselect={(next) => (selectedIds = next)}
        onmark={mark}
        onalways={always}
        formatDate={formatEmailDate}
      />
      <StagingBins
        {emails}
        marks={markedActions}
        rules={markedItems}
        busy={actionInProgress}
        onunmark={unmark}
        onunmarkall={() => (markedActions = {})}
        onapply={executeActions}
      />
    </div>
  {/if}

  {#if editingOpen}
    <MarkedItemEditor
      from={editingFrom}
      action={editingAction}
      onFromChange={(value) => (editingFrom = value)}
      onActionChange={(value) => (editingAction = value)}
      onCancel={closeMarkedItemEditor}
      onSave={saveMarkedItem}
    />
  {/if}
</main>
