# Code context

## Entry points

- `src/main/index.ts` creates the Electron window and registers settings IPC.
- `src/main/gmail.ts` registers Gmail Inbox, archive, trash, and authorization IPC.
- `src/preload/index.ts` exposes Electron IPC and the typed `window.api.settings` API.
- `src/renderer/src/main.tsx` mounts the React application and imports its CSS.
- `src/renderer/src/App.tsx` loads settings before mounting the mailbox, then coordinates Inbox data, selection, marks, sender rules, reading state, and preferences.

## Production UI

- `TriageRows.tsx` groups emails by sender. Clicking a message opens the reader. The checkbox strip owns left-click selection, right-click range selection, and middle-click fill/clear.
- `EmailReader.tsx` displays the message body as plain text, with a snippet fallback.
- `InboxPanes.tsx` uses `react-resizable-panels` for the Inbox/staging and list/reader dividers. Reader height is restored when reopened.
- `StagingBins.tsx` groups pending archive/delete marks and applies them to Gmail.
- `ThemePicker.tsx` applies the selected theme through `data-theme` on the document element. App owns persistence.
- `MarkedItemsView.tsx` and `MarkedItemEditor.tsx` manage sender rules.
- `ErrorPanel.tsx` handles Gmail errors and authorization-code entry.

## State and persistence

`src/shared/settings.ts` defines settings, defaults, validation, and the preload API contract. `src/main/settings-store.ts` writes `~/.mado/mado_mail/settings.json` using a temporary file and rename.

Persisted settings are `theme`, `autoApply`, `markedItems`, and `paneSizes`. `src/renderer/src/lib/settings.ts` reads legacy localStorage preferences for migration when the settings file is missing. Malformed settings files are not overwritten.

Selection, pending message marks, the displayed email, and sender expansion are session state. Gmail remains the source of Inbox messages. Credentials and tokens live in separate files beside settings.

`src/renderer/src/types.ts` defines message and triage types. `lib/selection.ts` contains the three-button selection algorithms; `lib/sender.ts` extracts sender names and addresses.

## Build and checks

- `npm run dev`: Electron development app.
- `npm run build`: TypeScript checks and production build through electron-vite.
- `npm run test:settings`: Settings persistence tests using temporary directories.
- `npm run lint`: Repository ESLint checks.

See `docs/project-overview.md` for user workflows and current limitations.
