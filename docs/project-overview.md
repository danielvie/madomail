# Mado Mail: Project Overview

Mado Mail is a desktop Gmail inbox-triage application. It is designed for quickly scanning an Inbox, deciding what to do with messages, and applying archive or delete decisions in batches rather than opening each message in Gmail.

This document describes the behavior currently implemented in the repository.

## What a user can do

### Connect to Gmail

The app uses Google OAuth credentials and the Gmail API. On startup it looks for `client_secret.json` and `token.json` in the working directory, its parent directory, and `$HOME/.mado/mado_mail`.

If the client secret is missing, the app displays setup instructions. If the secret exists but there is no token, the app displays an authorization URL and an input for the returned authorization code. A newly obtained token is saved under `$HOME/.mado/mado_mail`.

The requested Gmail permission is `gmail.modify`, because the app can change Inbox and Trash state as well as read messages.

### Review the Inbox

The Inbox view loads up to 400 Gmail messages currently carrying Gmail's `INBOX` label. Messages are grouped into **sender bands**: all mail from one sender collapses into a single row showing the sender, a count, the most recent subject, and the date. A band expands to its individual messages on demand. Grouping puts the noisiest senders at the top, which is where bulk decisions are.

Each row carries two pairs of controls:

- **A** / **D** — archive or delete this row (the whole band, or the selection if the row is part of one)
- **ALWAYS A** / **ALWAYS D** — save a sender rule and immediately stage everything it matches

The list supports local text filtering across sender, subject, and snippet.

Selection uses three mouse buttons:

- **left** toggles a row and makes it the anchor
- **right** selects every row between the anchor and the clicked row
- **middle** floods the contiguous run the row belongs to — on an unselected row it selects all unselected rows next to it; on a selected row it unselects all selected rows next to it

A checkbox on every row displays selection state, so selecting and unselecting are both confirmed visually.

The app works with individual Gmail messages. It carries a Gmail thread ID in its data, but it does not present or manipulate conversations as a separate user-facing concept.

### Preview a message without opening Gmail

Hovering a group in the staging area opens an **email peek** beside it, aligned to the hovered line. It lists the sender, address, action, and the subject and snippet of up to six messages in that group.

HTML content is converted to readable text; attachments and rich message rendering are not provided.

### Plan or immediately apply triage actions

A user can select messages and choose one of two actions:

- **Archive** removes the messages from the Gmail Inbox.
- **Delete** moves the messages to Gmail's Trash; it is not permanent deletion.

Normally, these choices create temporary **marks**, which collect in the **staging area** down the right-hand side. Staging is split into two named bins — *To Archive* and *To Delete* — so the two actions never mix. Each bin lists one line per sender, carrying a bar whose length is the message count, the sender's name, a `RULE` tag when a sender rule produced it, the count, and a `↩` control that puts that group back in the Inbox. The lines themselves are inert: only the `↩` control undoes anything.

**Apply** sends all pending Archive and Delete actions to Gmail, and states both totals on the button.

With **Auto-apply** enabled, choosing Archive or Delete sends the action immediately instead of creating a pending mark. The Auto-apply preference is retained between launches.

The current action handlers also remove processed rows from the visible Inbox after invoking Gmail. Refreshing the Inbox is the way to reconcile the display with Gmail after an action.

### Save sender rules

Alt-clicking an Inbox row opens an editor for a saved **sender rule**. A rule contains:

- sender text to match
- the action to assign: Archive or Delete

The rule list is available through the Rules/Inbox toggle. It sorts rules alphabetically by sender and supports filtering, editing, and removal.

**Run Query** reloads the Inbox and creates pending marks for every message whose sender contains a rule's sender text, case-insensitively. This is an app-side matching operation, not a Gmail search, and it does not change Gmail until the resulting marks are applied.

Sender rules are stored in the application's local browser storage. They are not Gmail filters and are not synchronized to the Gmail account.

## Domain model at a glance

The important distinction in Mado Mail is between temporary decisions and saved automation rules:

| Concept | Meaning | Lifetime |
| --- | --- | --- |
| Email message | One Gmail message currently represented in the Inbox workspace | Comes from Gmail; refreshed from the account |
| Selection | Messages currently chosen for a command | Until the selection changes or is cleared |
| Mark | A pending Archive or Delete instruction on one message | Until unmarked, applied, or the Inbox is refreshed |
| Sender rule | Saved sender text plus an Archive or Delete action | Persists in the app until edited or removed |
| Rule query | Refreshes the Inbox and turns matching sender rules into marks | One operation; it does not apply actions |
| Email peek | Non-destructive compact or expanded message preview | Until closed or replaced by another peek |

The interface calls sender rules “Marked Items,” while the Inbox uses “marked” for pending message actions. These are different concepts: a sender rule is durable; a message mark is a temporary triage decision.

## Main user flow

1. Launch the desktop app.
2. Load saved preferences and sender rules.
3. Authenticate with Gmail if credentials are not already available.
4. Fetch the current Inbox messages.
5. Search, inspect, and preview messages.
6. Select messages and either mark Archive/Delete or apply the action immediately.
7. Optionally maintain sender rules and run a rule query to generate marks in bulk.
8. Apply all pending marks to update Gmail.

## Application architecture

Mado Mail is an Electron application with a Svelte renderer and TypeScript throughout.

### Electron main process

`src/main/index.ts` creates the desktop window, loads the renderer, opens external links in the system browser, and registers Gmail IPC handlers.

`src/main/gmail.ts` owns Gmail integration. It:

- locates and reads OAuth credentials
- creates and caches the authenticated Gmail client
- lists Inbox messages
- fetches full message content and extracts display fields
- archives or trashes batches of messages
- completes the interactive authorization-code flow

### Preload boundary

`src/preload/index.ts` exposes Electron's IPC renderer API to the renderer through the context bridge. The custom `api` object is currently empty; Gmail operations are invoked through the exposed Electron IPC interface.

### Renderer

`src/renderer/src/App.svelte` is the application coordinator. It owns Inbox data, selection, pending marks, sender rules, view state, filtering, authentication input, and local preferences, and renders the header itself.

The UI is split into focused Svelte components:

- `TriageRows.svelte` — the sender-banded Inbox list, row controls, and the mouse selection model
- `StagingBins.svelte` — the two staging bins, the peek, and Apply
- `ThemePicker.svelte` — colour theme selection; also exports `applyTheme` / `loadTheme`
- `MarkedItemsView.svelte` — sender-rule list and filtering
- `MarkedItemEditor.svelte` — sender-rule create/edit dialog
- `ErrorPanel.svelte` — Gmail errors and authorization-code entry

Shared domain-facing types are in `src/renderer/src/types.ts`. Pure helpers live in `src/renderer/src/lib/` — `selection.ts` holds the three-button selection model, `sender.ts` the From-header helpers.

### Colour themes

`src/renderer/src/assets/theme.css` defines ten themes, five dark and five light. Each sets the same eleven semantic roles: `canvas`, `panel`/`panel2`/`panel3`, `line`, `ink`, `ink-dim`, `accent` with `on-accent`, and `danger` with `on-danger`. **Ink** — dark navy with an amber accent — is the default, and its values sit on `:root` so the app paints correctly before any script runs. `main.css` maps these to Tailwind colour utilities, so setting `data-theme` on `<html>` recolours the whole app. Archive always speaks with `accent` and delete always with `danger`, giving the two triage actions a stable identity in every theme. Every text-on-background pair in every theme meets WCAG AA; body text meets AAA.

## Data and persistence

Gmail is the source of Inbox messages. The app does not include a separate backend or application database.

The renderer stores these preferences locally:

- Auto-apply setting
- saved sender rules
- the selected colour theme

Selections and pending message marks are session state. They are cleared when the Inbox is refreshed and are not stored as Gmail labels or server-side rules.

## Current boundaries and limitations

- Only the Gmail Inbox is loaded; other Gmail folders and labels are not browsable in the app.
- The Inbox fetch is capped at 400 messages.
- Search is local and covers sender, subject, and snippet, not the full body or Gmail's search language.
- Sender-rule matching uses only the sender text and substring matching.
- The app does not compose, send, reply to, or forward messages.
- It does not provide a full conversation reader, attachment viewer, or rich HTML message view.
- Archive and Delete requests remove the `UNREAD` label as part of their Gmail modification, so these actions also mark affected messages as read.
- OAuth files and tokens are expected to be available on the same machine as the desktop app; there is no account/session service of its own.

## Repository map

```text
src/main/                 Electron host and Gmail integration
src/preload/              Context-bridge setup and global typing
src/renderer/src/         Svelte UI, state orchestration, and shared types
resources/                Runtime application icon
build/                    Packaged application icon and macOS entitlements
README.md                 Setup and build instructions
CONTEXT.md                Canonical domain vocabulary
```
