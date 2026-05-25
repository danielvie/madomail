# CONTRACT

## Session 1: Outlook COM migration grilling

### Questions and decisions

- **Q1**: Fully replace Gmail or support both?
  - **D1**: Fully replace Gmail with Outlook.

- **Q2**: Is Windows-only acceptable for mail features?
  - **D2**: Yes. Outlook COM makes mail features Windows-only.

- **Q3**: Which Outlook integration method should be used?
  - **D6**: Use a PowerShell COM bridge.

- **Q4**: How should archive behave?
  - Superseded by later move-flow redesign.

- **Q5**: Remove the Gmail authorization UI?
  - **D4**: Yes. Remove the Gmail authorization UI.

- **Q6-Q10**: Initial archive-target design discussion.
  - Superseded by later move-flow redesign.

- **Q11**: Default Outlook store only or all stores?
  - **D7**: Use the default Outlook store only for first implementation.

- **Q12**: Folder path representation?
  - **D8**: Use paths relative to the store root.

- **Q13**: Recent move target ordering?
  - **D9**: Keep recent targets in alphabetical order.

- **Q14**: How many recent move targets?
  - **D10**: Keep 8 recent targets.

- **Q15**: What to do with stale recent folders?
  - **D11**: Silently drop them.

- **Q16**: Add folder to recents on selection or only after move?
  - **D12**: Add to recents only after a successful move.

- **Q17**: Bulk move only or also per-row move?
  - **D13**: Bulk move only.

- **Q18**: Show recent targets as chips?
  - **D5**: Yes. Show recent targets as quick-click chips.

- **Q19**: Recent target JSON filename?
  - **D15**: Use `recent-folders.json`.

- **Q20**: Clicking a chip with a selection should do what?
  - **D16**: Immediately move selected emails to that folder.

- **Q21**: Clicking a chip with no selection should do what?
  - **D17**: Set the current dropdown selection.

- **Q22**: Initial inbox fetch size?
  - **D18**: Fetch 200 messages initially.

- **Q23**: Folder list scope/filtering?
  - **D19**: Include every folder from the default store and add a string filter field in the UI.

- **Q24**: How should marked items interact with the new move flow?
  - **D20**: Redesign marked items so they map senders to destination folders instead of archive/trash actions.

- **Q25**: How should a matched marked email display its destination?
  - **D22**: Show a short folder label plus a full path tooltip.

- **Q26**: How should folder selection work when creating/editing a marked item?
  - **D23**: Use a filterable dropdown of live Outlook folders.

- **Q27**: What happens if a marked item targets a folder that no longer exists?
  - **D24**: Keep the rule visible but invalid.

- **Q28**: What should the marked-items query do?
  - **D25**: Fetch inbox and auto-mark matching emails with their assigned destination folders.

- **Q29**: How should conflicts resolve when multiple marked items match the same email?
  - **D26**: Longest `from` match wins.

- **Q30**: What should bulk apply mean in the new workflow?
  - **D27**: Support both workflows with separate actions: move selected to current folder, and apply rule-based moves for marked emails.

- **Q31**: May marked items target any folder from the live Outlook folder list?
  - **D28**: Yes, including system folders for the first version.

- **Q32**: How should the marked items list filter work?
  - **D29**: Filter by both sender and folder path.

- **Q33**: After applying rule-based moves, should the app remove rows optimistically or refresh the inbox?
  - **D30**: Refresh the inbox from Outlook after apply.

- **Q34**: What folder-picker UI should be used?
  - **D31**: Use a native `<select>` with a separate filter input for the first version.

- **Q35**: How should invalid marked rules be indicated?
  - **D32**: Use subtle styling rather than a loud invalid badge.

- **Q36**: Which sender field should drive rule matching?
  - **D33**: Match against one normalized combined sender string using both display name and SMTP/email when available.

- **Q37**: How should sender matching behave?
  - **D34**: Use case-insensitive substring matching.

- **Q38**: Should the Outlook store root folder itself be selectable?
  - **D35**: Return only children beneath the root, not the root folder itself.

- **Q39**: What should happen on partial bulk-move failures?
  - **D36**: Return partial success details.

- **Q40**: How should `mail-move` operate?
  - **D37**: Use one IPC call for many message IDs targeting one folder path, and group rule-based moves by folder.

- **Q41**: Should the app cache the folder list in memory?
  - **D38**: Yes, cache it in memory until refresh.

- **Q42**: Should folder refresh be separate from inbox refresh?
  - **D39**: No. Normal refresh reloads both inbox and folders.

- **Q43**: Where should marked items be persisted?
  - Superseded by later disk-backed marked-items persistence update.

- **Q51**: Where should marked items be stored on disk?
  - **D42**: Store marked items at `$env:USERPROFILE/.mado/madomail/marked-items.json`.

- **Q52**: When should marked items be saved?
  - **D43**: Save immediately after every create/edit/delete.

- **Q53**: What should happen if `marked-items.json` is malformed?
  - **D44**: Show an error and load no marked items.

- **Q54**: Should recent folders and marked items stay in separate files?
  - **D45**: Yes, keep them in separate files.

- **Q55**: Should the Rust helper handle only COM/mail operations?
  - **D46**: Yes. Electron main keeps JSON persistence.

- **Q56**: How should Electron talk to the helper?
  - **D48**: Use stdin JSON requests and stdout JSON responses.

- **Q57**: Should the helper be a fresh process per request or long-lived?
  - **D49**: Use a fresh process per request.

- **Q58**: Where should the helper project live?
  - **D50**: Create it at `mado_mail/helper_com_rs/`.

- **Q59**: How should reference Rust code be reused?
  - **D51**: Copy and adapt the minimal COM pieces from `_ref/mado_email_rs` instead of depending on it directly.

- **Q60**: What should the first Rust-helper rollout replace?
  - **D52**: Replace PowerShell inbox, folders, and move in one pass.

- **Q61**: Should the helper be source-only at first?
  - **D53**: Yes. Build it manually at first.

- **Q62**: Should PowerShell remain as a fallback during helper rollout?
  - **D54**: No. Switch directly to the Rust implementation.

### Additional decisions from discussion

- **D3**: Replace archive/trash workflow with bulk `move` to folder.
- **D14**: Persist recent targets under `$env:USERPROFILE/.mado/madomail`.
- **D21**: The recent-target JSON path is `$env:USERPROFILE/.mado/madomail/recent-folders.json`.

### Implementation / fix items

- **I1**: Replace Gmail IPC/backend with Outlook mail service using provider-neutral `mail-*` channels.
- **I2**: Implement PowerShell COM bridge for inbox listing, folder listing, and move operations.
- **I3**: Persist and normalize recent folder targets in JSON under the user profile.
- **I4**: Update renderer types to support folders and move-based marked items.
- **I5**: Replace archive/trash controls with move controls: dropdown, chips, filter field, and bulk move button.
- **I6**: Simplify error handling UI by removing Gmail auth-code flow.
- **I7**: Load folders, recents, and inbox on startup.
- **I8**: Implement bulk move workflow and post-move recent-target updates.
- **I9**: Update README for Outlook/Windows requirements and move-target persistence.
- **I10**: Redesign marked items editor/view/query so each rule stores a destination folder path.

### Notes

- Earlier archive-specific decisions were superseded once the workflow changed from archive/trash to move-to-folder.
- This file should be extended for future grilling sessions rather than replacing prior decisions.
