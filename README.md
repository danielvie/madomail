# Mado Mail

A desktop Outlook mail client built with Tauri, Rust, Svelte 5, and TypeScript.

## Features
- Outlook integration through a Rust COM helper.
- Bulk move selected emails to folders in the default Outlook store.
- Recent folder targets persisted on disk.
- Sender-to-folder marked rules persisted on disk.
- Windows-first desktop workflow.

## Requirements
- Windows
- Outlook desktop installed and configured
- Rust
- Node.js and npm
- Tauri prerequisites for Windows

## Tech stack
- `Tauri 2`
- `Rust`
- `Svelte 5`
- `TypeScript`
- `Vite`

## Persistence
- `recent-folders.json`: `$env:USERPROFILE/.mado/madomail/recent-folders.json`
- `marked-items.json`: `$env:USERPROFILE/.mado/madomail/marked-items.json`

## Development
```/dev/null/task-run#L1-2
task run
```

## Build helper
```/dev/null/task-helper#L1-2
task build:helper-com
```

## Test backend
```/dev/null/task-test#L1-2
task test
```

## Notes
- Folder paths are relative to the Outlook default store root.
- Refresh reloads inbox and folders.
- Mail features are Windows-only.
