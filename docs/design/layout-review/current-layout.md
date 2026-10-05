# Current GPUI layout and UX

## Evidence and scope

Baseline is the working, uncommitted GPUI implementation on `feat/gpui-migration`, not the older Electron app or earlier design sketches. This is design exploration only. No application changes are authorized. `GOAL.md` forbids redesign during the initial migration; these proposals are candidates for a later decision.

A synthetic demo window was captured with `powershell.exe -NoProfile -File gpui-poc/check-window.ps1 -Demo`. Only the app window was captured. No credentials or personal mail were read. `current-demo.png` is the fresh capture. `reader-beside-reference.png` and `reader-below-reference.png` are existing synthetic captures, not newly verified states. Source is authoritative when captures differ.

Source anchors:
- `gpui-poc/src/main.rs:1806-2060`: toolbar, status, workspace, footer.
- `gpui-poc/src/main.rs:1105-1211`: two-line rows, checkboxes, preview styling, contextual actions.
- `gpui-poc/src/main.rs:1434-1691`: staging bins and commit controls.
- `gpui-poc/src/main.rs:1693-1803`: Rules view.
- `gpui-poc/src/main.rs:40-62,2345-2349`: pane constraints and window sizes.
- `gpui-poc/src/reader.rs:545-660`: reader metadata, images control, native body.
- `gpui-poc/src/settings.rs:18-78`: default reader width 480, staging width 320, reader hidden, staging shown, beside placement, below height 360.
- `gpui-poc/README.md`: interaction, keyboard, privacy and recovery contracts.
- `GOAL.md`: Windows-only personal triage, 400-message cap, no compose/reply/forward or attachment browsing.

## Layout

Default window is 1480 by 850 logical pixels; minimum is 1100 by 600. Default workspace is a sender-grouped list plus a full-height staging panel on the right. The reader starts hidden. Clicking one message opens it. All wireframes use synthetic representative content; proportions are schematic, not pixel-perfect.

The top toolbar puts a 190px filter first, then Run query, Rules/Inbox, Refresh/Connect Gmail and sender/undecided counts. Checked-message count, Archive N, Trash N and Clear appear only while messages are checked. Auto-apply and Theme sit at the right. The toolbar wraps when crowded. A status strip below reports loading, demo mode, errors and label lookup problems.

The list reserves a checkbox gutter and expansion control on the left. Every row stays 68px tall. Sender/count and date occupy the first line; up to two Gmail label chips, overflow count and subject occupy the second. Sender groups sort by message count, then sender address. Expanding a group adds message rows. Hover or keyboard focus shows read/unread, Archive, Trash and more controls at the row's upper right, replacing date space. Label details are available through hover/focus.

The beside-reader layout places the reader between list and staging. The below-reader layout stacks list above reader, but staging remains on the right at full height. Pane widths and reader height have independent saved preferences. Dividers support mouse and keyboard resizing. The reader shows preview status, subject, sender, full label list, date, Block/Allow images and privacy/loading text above an independently scrolling HTML body.

Staging has a pending count and Empty both at the top. Separate Archive and Trash bins show counts, drop hints, sender summaries, rule/outcome indicators and Put back buttons. Their internal divider is adjustable for the session. A bottom area explains Trash/unread semantics, shows Recheck Gmail for unknown outcomes and contains Apply with Archive/Trash counts.

The 34px footer explains row/checkbox/menu/drag behavior, repeats the pending count and holds three icon-only controls: reader placement, reader visibility, staging visibility. Controls remain available while panes are hidden.

Rules replaces the workspace rather than opening alongside it. The filter changes to sender-rule filtering. A header explains first-match-wins and provides import/export. Rows show From match, action, Edit and Drop rule. Sender rule creation comes from the row menu. A modal editor uses sender text, Archive/Trash choice, Save and Cancel.

## Interaction and safety

Preview, checkmarks, unread and staged decisions are independent states. Preview does not change unread. Green checkmarks/gutter show bulk targets; an accent row shows the displayed message; unread uses dot and bold text; keyboard focus has its own outline. A group checkbox acts on the represented messages. Filtering clears the checked set. Row actions target that row's messages; toolbar actions target the checked set.

With Auto-apply off, Archive/Trash stages messages and removes them from the undecided list. Put back or Empty both cancels unsubmitted marks, not a completed Gmail operation. A checked-row drag uses the checked batch; an unchecked or mixed-row drag uses that row. Drops outside bins or Escape cancel. Auto-apply needs confirmation when enabled; future direct actions/drop may write immediately. Run query always stages, even with Auto-apply on; existing pending marks still need Apply. Read/unread actions always write immediately.

Apply sends changes to Gmail. Confirmed messages leave the local Inbox. Failed messages stay staged. Unknown outcomes block cancellation/resubmission and need per-message Recheck Gmail, not a blind retry. A journal preserves interrupted submissions; never imply that an ordinary Undo reverses Gmail writes. Unsubmitted staging is not saved across restart.

Remote images load by default for each message. Blocking is per-message and cannot undo requests already sent. HTML is sanitized and links open externally. Native WebView2 body is temporarily hidden during dragging and certain overlays/resizing; its state returns afterward. Keyboard controls exist, but actual screen-reader, IME and clipboard usability still needs operator validation.

## What already works

- Sender grouping makes high-volume cleanup faster than treating every message separately.
- Distinct preview and checkbox states prevent reading from silently changing a bulk target.
- Separate Archive/Trash staging makes pending destructive intent inspectable before Apply.
- Preview survives staging/removal and pane hiding; placement and width preferences are preserved.
- Counts, row-local actions, Put back and outcome-specific recovery give useful control over batches.

## Design tensions to investigate

These are hypotheses from layout/source, not measured usability findings.

- One toolbar mixes retrieval, navigation, bulk actions, automation and appearance. Conditional controls and wrapping may shift targets during work.
- Three visible panes compete at minimum width. Labels before subject, long addresses and contextual action reservation can reduce scanable message text.
- Footer icons carry important workspace controls without persistent text labels.
- Staging can be hidden while work is pending, but Apply lives inside it. The pending footer count does not itself submit work.
- Auto-apply changes Archive/Trash from pending intent to immediate writes; read/unread is immediate regardless. That distinction deserves stronger local wording.
- Image blocking is a prominent reader action, but metadata and privacy text consume reading height, especially below the list.
- Color, dots, boldness, outlines and label colors carry many overlapping meanings. Native label colors are preserved even when contrast is poor.
- Rules and staged inspection temporarily hide the reader. The user can lose visible context even though state remains preserved.

## Critic assignments

1. `gpt-6-sol`: keyboard-first, high-volume triage operator. Prioritize action throughput, stable targets and explicit batch scope.
2. `gpt-6.1-sol`: accessibility and mistake-recovery specialist. Prioritize readable states, discoverability, focus and honest write outcomes.
3. `gpt-6-astra`: reading-focused interaction designer. Prioritize subject/body space, calm progressive disclosure and small-window use.
4. `gpt-6-astra`: information-organization specialist. Prioritize sender/rule mental models, decision review and mixed-message clarity.

Each critic receives fresh context, the same evidence and a distinct scenario. Each must preserve triage scope and write safety, explain what works and what should change, draw their own proposal plus UX state notes, identify tradeoffs and suggest a checkable usability test. No critic sees a sibling proposal.
