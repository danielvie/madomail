# Marked Items, List, and Query Requirements

## Scope
This document extracts the agreed requirements for:
- marked items
- inbox and folder listing behavior
- marked-items query behavior

Source: `CONTRACT.md`

## Marked items requirements

### Rule model
- Marked items must map senders to destination folders instead of archive/trash actions.
- Each marked item stores:
  - `id`
  - `from`
  - `folderPath`
- Destination folders are Outlook folder paths relative to the default store root.

### Persistence
- Marked items must be persisted on disk.
- Storage path: `$env:USERPROFILE/.mado/madomail/marked-items.json`
- Marked items must be saved immediately after every create, edit, or delete.
- If `marked-items.json` is malformed:
  - show an error
  - load no marked items
- Marked items must remain stored separately from recent folders.

### Folder targeting
- Marked items may target any live Outlook folder from the default store.
- System folders are allowed in the first version.
- The Outlook store root itself is not selectable.
- Only children beneath the root are selectable.

### Matching behavior
- Matching must use one normalized combined sender string.
- The sender string must use both display name and SMTP/email when available.
- Matching must be case-insensitive substring matching.
- If multiple marked items match the same email, the longest `from` match wins.

### Invalid rules
- If a marked item targets a folder that no longer exists:
  - keep the rule visible
  - treat it as invalid
- Invalid marked rules must use subtle styling.
- Do not use a loud invalid badge.

### Marked items UI
- Creating and editing marked items must use a filterable dropdown of live Outlook folders.
- The first version must use a native `<select>` with a separate filter input.
- The marked items list filter must match both sender and folder path.
- A matched marked email must show:
  - a short folder label
  - a full path tooltip

## List requirements

### Inbox listing
- Gmail must be fully replaced by Outlook.
- Mail features are Windows-only.
- Outlook integration must use the default Outlook store only for the first implementation.
- Initial inbox fetch size: `200` messages.
- The marked-items query fetches from the inbox.

### Folder listing
- Folder paths must be represented relative to the default store root.
- Include every folder from the default store.
- Add a string filter field in the UI for folder filtering.
- Cache the folder list in memory until refresh.
- Normal refresh must reload both inbox and folders.
- Folder refresh is not a separate user action.

### Recent folders
- Persist recent folders under `$env:USERPROFILE/.mado/madomail`.
- File name: `recent-folders.json`
- Full path: `$env:USERPROFILE/.mado/madomail/recent-folders.json`
- Keep `8` recent targets.
- Recent targets must be kept in alphabetical order.
- Stale recent folders must be silently dropped.
- Add a folder to recents only after a successful move.
- Recent targets must be shown as quick-click chips.

## Query requirements

### Marked-items query behavior
- The marked-items query must:
  - fetch inbox items
  - auto-mark emails that match marked-item rules
  - assign each matched email to its destination folder
- Query matching must use the marked-items sender matching rules.
- Query results must support the rule-based move workflow.

### Move and apply behavior
- Support two separate workflows:
  - move selected emails to the current folder
  - apply rule-based moves for marked emails
- Bulk move only. No per-row move in the first version.
- `mail-move` must use one IPC call for many message IDs targeting one folder path.
- Rule-based moves must be grouped by folder.
- After applying rule-based moves, refresh the inbox from Outlook.
- On partial bulk-move failures, return partial success details.

### Chip behavior
- Clicking a recent-folder chip with a selection must immediately move the selected emails to that folder.
- Clicking a recent-folder chip with no selection must set the current dropdown selection.
