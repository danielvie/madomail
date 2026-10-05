# Critic notes

Text extracted from each independent Excalidraw proposal, in canvas reading order.

## critic-1-sol-triage.excalidraw

MADO MAIL / A STABLE TRIAGE WORKBENCH
Later design candidate · source-informed sketch, not an approved migration change

DESIGN LENS / keyboard-first operator
Hundreds of repetitive build-service and
newsletter messages; time per decision
matters more than decorative whitespace.

Scenario: inspect a 42-message sender,
exempt two critical messages, stage the
other 40, then continue from the keyboard.

Hypothesis, not observed usability data:
stable command positions reduce rescanning
and pointer travel.

WHAT WORKS NOW / observed in source
1. Sender groups sort by count; a group
checkbox targets represented messages.
main.rs:1105–1211, 1212–1260

2. Preview and checkmarks coexist without
marking mail read; unread has a separate
dot and weight. main.rs:1117–1194, 1260–1285

3. Archive and Trash have separate staged
bins, counts, Put back and Apply. Unknown
outcomes require Recheck Gmail.
main.rs:1434–1769; README: Write outcomes

NON-NEGOTIABLE STATE MODEL
PREVIEW ≠ CHECKED ≠ UNREAD ≠ PENDING.
Opening mail does not mark it read.
Archive and Trash preserve unread state.

Put back cancels only unsubmitted marks.
Confirmed writes leave the local Inbox;
failed marks remain staged. Unknown means
recheck each message, never blind resubmit.

Run query stages even in immediate mode;
existing pending marks still need Apply.
Read/unread writes immediately.

FOUR PROPOSED CHANGES / 1–2
1. Move checked count, Archive N, Trash N and Clear into
an always-present bottom command rail. Today they exist
only when selected, in a wrapping toolbar (main.rs:1979–2060).
Stable targets should help repeated keyboard/pointer use.

2. Keep the count-sorted sender group and its checkbox,
but expose “40 checked / 2 exempt” next to the expanded
group. Current mixed selection exists (main.rs:1117–1120,
1242–1260); explicit scope should reduce batch ambiguity.

FOUR PROPOSED CHANGES / 3–4
3. Replace the full-height right staging pane with a fixed
pending strip and keyboard-opened review drawer. Today the
bins and Apply occupy that pane (main.rs:1434–1769), which
competes with list and reader width (main.rs:2080–2116).
Keep separate Archive/Trash contents in the review drawer.

4. Move Auto-apply out of the toolbar; label it “Immediate
writes” in preferences, default OFF, with a persistent mode
badge and confirmation when enabled. Its present toggle is
main.rs:2058–2067; mode confirmation is main.rs:934–954.
In ON mode command labels must say “write now,” not “stage.”

PROPOSED DESKTOP STATE / expanded high-count sender, two exemptions

Mado Mail     INBOX / loaded 400-message cap     •     Mode: STAGE FIRST

[ Filter From / Subject / snippet... ]   [ Run query: stage matches ]   [ Refresh ]   [ Rules ]   [ Preferences ]
68 senders / 400 loaded / 287 undecided                         Query matches join pending; they do not write.

CHECK   SENDER / SUBJECT                                            DATE
Sender count first • labels on focus • row actions stay in the command rail

PREVIEW ONLY  •  ● Unread  •  Not checked
Release pipeline failed on main
Buildkite Notifications <notify@buildkite.com>
Today 09:42  •  Labels: Builds / Production

[ Mark as read NOW ]   [ Block images ]
Remote images: allowed for this message.
Blocking cannot undo requests already sent.

────────────────────────────────────
Build #1943 failed
The release pipeline stopped at integration tests.

Failure: api-contract / expected 200, got 503
Branch: main
Commit: 8ab41d2

Open the build report in an external browser.
────────────────────────────────────
HTML body scrolls independently. Previewing
leaves Gmail unread and bulk checks unchanged.

[−]  ▾  Buildkite Notifications <notify@buildkite.com>     42 messages
       MIXED: 40 checked / 2 exempt     ● 35 unread     Rule: none

▶ [ ]  ● Buildkite Notifications             Today 09:42
          Release pipeline failed on main     EXEMPT 1 • previewed • unread

  [ ]  ● Buildkite Notifications             Today 09:37
          Production deploy needs approval    EXEMPT 2 • unread

  [✓]  ● Buildkite Notifications             Today 09:28
           Build #1942 passed — nightly checks    CHECKED • not staged

  [✓]    Buildkite Notifications              Yesterday 18:14
           Build #1941 passed — lint and tests     CHECKED • read

CHECKED 40  •  not yet pending  •  2 exempt      [ Stage Archive 40 ]   [ Stage Trash 40 ]   [ Clear checks ]
Fixed targets. Stage actions affect checked IDs only; row preview, unread state and earlier pending marks stay independent.

PENDING 4 from earlier  •  Archive 3 / Trash 1  •  Failed 0 / Unknown 0    [ Review 4 ]   [ Apply 4 to Gmail ]
Review opens separate bins and Put back per sender. Apply is the write boundary; Trash is not permanent deletion.

PROPOSED COMPACT STATE / 1100 × 600 logical pixels, review open

Mado Mail   [ Filter... ]   [ Run query ]   [ Refresh ]   [ Rules ]
[ Inbox list ]   [ Preview: release pipeline failed ]   Mode: STAGE FIRST

LIST / 42 Buildkite • 40 checked / 2 exempt
[ ] ● Release pipeline failed on main
[ ] ● Production deploy needs approval
[✓] ● Build #1942 passed
[✓]   Build #1941 passed

Preview is a tab here, not a narrow third pane.
List position and checked state persist on switch.

REVIEW PENDING 4   [ Close ]
ARCHIVE 3
  GitHub Actions 2   [ Put back ]
  Weekly Digest 1     [ Put back ]
TRASH 1
  Offers Weekly 1   [ Put back ]

Failed 0 / Unknown 0
[ Apply: Archive 3, Trash 1 ]

CHECKED 40, not pending    [ Stage Archive 40 ]   [ Stage Trash 40 ]   [ Clear ]
PENDING 4: Archive 3 / Trash 1   [ Review ]   [ Apply 4 to Gmail ]

If outcome becomes UNKNOWN: disable Apply and Put back for unknown IDs;
show [ Recheck Gmail ]. Failed items stay staged for explicit retry.
Confirmed items leave the local Inbox; no “Undo Gmail write” control.

INTERACTION NOTES / proposed behavior, not implemented shortcuts

CLICK / KEYBOARD / SCOPE
Enter on group expands; group checkbox or focused Space
checks represented messages. Uncheck two children; mixed
header names the exact checked and exempt counts.

Enter on one message previews; checkbox never previews.
A proposed table shortcut could focus the fixed command rail;
Stage Archive 40 stages those IDs, then clears their checks.
Keep current Tab, arrows, Enter and Shift+F10 behavior.
Any new shortcut needs conflict and focus testing.

STAGING / WRITE FLOW
The fixed pending strip always shows Archive and Trash
counts. Review opens the separate bins; Put back cancels
unsubmitted marks only. Ctrl+Enter retains Apply behavior
outside inputs, with the same visible pending scope.

Immediate writes is OFF in this sketch. If enabled, stage
buttons instead say “Archive N NOW” / “Trash N NOW.”
Run query still stages; pre-existing marks still need Apply.
Read/unread always writes immediately, with its own NOW label.

TRADEOFFS TO VALIDATE
• A bottom rail costs vertical list rows. It buys stable
  commands and more horizontal subject/reader space than
  a full-height staging sidebar. Compare at 1100 × 600.

• Compact tabs cannot show list and preview together.
  Keep focus, scroll and checkmarks on switching; test
  whether this costs more time than the current below reader.

• Moving Immediate writes to preferences reduces accidental
  mode changes but makes the mode harder to discover.
  An always-visible mode badge must remain unambiguous.

CHECKABLE USABILITY TEST / NOT YET RUN
On identical synthetic Inbox data, compare current GPUI
layout and a later prototype at 1480 × 850 and 1100 × 600.
Task: find 42-message sender; preview a failure; check
all, exempt two; stage 40 Archive plus one Trash; inspect
pending; simulate one unknown outcome and recheck.

Record time, pointer travel, wrong IDs, focus loss and
whether participant can name checked vs pending vs written
counts after each step. Safety gate: zero wrong writes or
blind unknown retries; no speed claim without measured data.

UNCERTAINTY & SCOPE / This is a proposed later design, not a tested interface. Colors and type are sketch notation, not a validated accessible palette.
Source behavior comes from current dirty-worktree GPUI files and README; throughput, focus behavior and compact-tab benefit are hypotheses.
Windows-only personal Gmail Inbox triage, capped loaded Inbox, sender rules, preview, selection, staging and Apply only. No compose, reply,
forward, attachment browser, synced mailbox, collaboration or new AI features. GOAL.md rules out redesign during the initial migration.


## critic-2-sol61-accessibility.excalidraw

Mado Mail / explicit tasks, deliberate commit, honest recovery

LENS / accessibility + error recovery
Keyboard-only personal triage at 150% scaling.
Scenario: stage → hide preview accidentally →
submit → receive an unknown write outcome.
My hypothesis: stable, named tasks reduce mode errors.
This is a design opinion, not observed user evidence.

KEEP / three concrete strengths observed in source
1. Checkbox and preview use separate handlers:
   reading need not alter a batch (main.rs:1245–1283).
2. Separate bins expose Archive versus Trash intent:
   counts and Put back (main.rs:1515–1660).
3. Unknown blocks Apply; recheck is not a write:
   uncertainty stays honest (main.rs:667–738,1751–1769).

STATUS / later candidate, not a migration change
Read current dirty source, current-layout.md, README,
and GOAL.md. Source wins over older reference images.
GOAL.md prohibits initial-migration redesign.
All messages below are synthetic; no program launched.
No credentials, Gmail access, edits or sibling reviews.

CHANGE 1 / named, recoverable workspace
Observed: footer uses three empty labels.
main.rs:2136–2142; tooltips:1063–1079.
Hide/show returns focus to the list:
main.rs:955–985.
Propose top-level Show/Hide preview text,
with Alt+R printed beside it; layout named.
Keep these controls present when hidden.
Hiding returns focus to its toggle;
showing restores the preview and scroll.
Rationale: a pane can be recovered without
remembering an icon or using a pointer.

CHANGE 2 / stable targets, literal states
Observed: hover OR focus reveals actions;
not hover-only (main.rs:1181–1200,1254–1269).
Bulk buttons appear conditionally:
main.rs:2026–2053. Unread is dot + bold;
preview uses accent (main.rs:1177–1190).
Propose an always-present bulk target bar,
Stage N labels, and persistent More menus.
Print Read/Unread, Previewing and Checked;
retain actual checkboxes and focus outline.
Menu heading states this message/sender N.
Rationale: labels supplement color and make
preview-versus-action scope inspectable.

CHANGE 3 / a full-width Review task
Observed: Apply/Recheck are inside staging:
main.rs:1749–1769; staging can be hidden:
main.rs:2129–2142.
Propose list + preview, not three panes.
A persistent Review staged N opens an
Archive/Trash review with per-message state.
Apply to Gmail stays in a pinned review bar.
Ctrl+Enter opens Review, never submits;
Tab to Apply, then Enter explicitly writes.
Rationale: commit/recovery do not depend on
a hidden sidebar. Preserve list position and
return focus to the originating control.

CHANGE 4 / retire Auto-apply, not writes
Observed: stage may submit immediately:
main.rs:742–766; enable confirmation:
main.rs:934–952; toolbar:2060–2068.
README: Run query always stages; existing
pending marks still require Apply.
Propose all Archive/Trash actions stage,
including drops and new sender rules.
Imported Auto-apply becomes inactive with
notice: “Archive/Trash now require Apply.”
Read/unread still writes immediately;
label it “Mark read now — Gmail”.
Rationale: one stable destructive workflow.

A / proposed Inbox task · checked batch and unrelated preview coexist · synthetic mail

FLOW / proposed behavior, not implemented

1. Tab order: task navigation → filter → query/refresh/rules →
   bulk bar → list → preview → persistent Review staged.
   Disabled actions keep an explanation, not a mystery icon.
   Suggest 18px minimum UI text and wrapping control labels.

2. Up/Down moves the row cursor; Enter previews one message
   or expands a group. Space on checkbox toggles targets only.
   Mixed group checkbox still means select all shown members.
   Filtering clears checkmarks; show “Checkmarks cleared”.
   Keep focus outline distinct from Previewing and Checked.

3. More is always visible; Shift+F10 opens the same menu.
   Heading: “This sender: 2 messages” or “This message: 1”.
   Stage actions never use the preview as an implicit target.
   Read/unread says “now — Gmail” and uses row-local IDs.
   Propose equivalent accessible names; support is unverified.

4. Stage removes targets from undecided, as today. Return
   focus to the next row, or the empty-list heading if none.
   Keep an open preview; update its explicit Pending status.
   Run query always stages; existing pending needs Apply.
   Creating a sender rule stages matches; editing only saves.

5. Review opens a full-width task, with Archive and Trash
   sections, sender counts and expandable message details.
   Put back cancels an unsubmitted/failed pending mark only.
   Apply shows exact action counts and writes to Gmail.
   While sending, keep focus on the result/status region;
   do not move focus to a newly enabled retry button.

6. Drag is optional, never necessary. With bins removed,
   a Review drop target must explicitly name Archive/Trash;
   Escape or release elsewhere cancels without a write.

MADO MAIL     [1 Inbox — current]     [2 Preview]     [3 Review staged (3)]
Loaded Inbox: 400 maximum     [Hide preview (Alt+R)]     [Reader layout: beside ▾]     [Appearance ▾]

[Filter messages (Ctrl+F): __________________]   [Run query: stage rule matches]   [Refresh]   [Sender rules]

Bulk target: 2 checked messages · Preview is NOT a bulk target
[Stage 2 for Archive]     [Stage 2 for Trash]     [Clear checkmarks]

UNDECIDED / sender groups · subject before labels

PREVIEW ONLY · Not checked · Unread
Saturday walk by the river
Mara Chen <mara@example.test>
12 Jun 2026, 09:10 · Labels: Personal
Opening leaves unread unchanged.
[Mark this message read now — Gmail]
Images allowed for this message.

[x] Field Notes · 2 messages · Checked · Contains unread
     Weekly trail report / Camp dates — 12 Jun
     [Expand 2]    [More: this sender (2)]

[ ] Paper Kite · 1 message · Not checked · Read
     Your monthly receipt — 11 Jun
     [Preview]    [More: this message (1)]

Hi,
The riverside path is open again.
Meet at the north gate at ten on Saturday?
I'll bring coffee.
Mara

[ ] Mara Chen · Unread · Previewing · Not checked
     Saturday walk by the river — 12 Jun
     No pending decision. Labels: Personal
     [More: this message (1)]

[Block images (Alt+I)]  Cannot undo requests already sent.

PENDING — not sent: 2 Archive / 1 Trash     [Review staged 3 (Ctrl+Enter)]
Transit Desk: Archive 2 · Daily Offers: Trash 1 · Apply to Gmail is available only after entering Review.

B / 1100 × 600 schematic · preview accidentally hidden · Review after Apply · one unknown blocks resubmission

RECOVERY / keep uncertainty actionable, never disguise it as failure

Observed contract: main.rs:667–738 and README “Write outcomes and recovery”.
Unknown blocks new staging/submission; per-message label reads resolve it.
The capped Inbox is not proof of success. Never use “not loaded” as confirmation.

Proposed focus order here: Return → Show preview → outcome/details controls →
Recheck → pinned commit controls. On entering Review, focus its heading.
After Apply, retain the status region; Tab reaches Recheck without a focus jump.
Show preview at this width switches to the Preview task, not a third narrow pane.
Return to Review restores its scroll and focus. Hidden mail/scroll is preserved.

User-facing recheck results must say one of:
• “Confirmed in Gmail. Removed from pending.” No Put back or local Undo.
• “Not applied in Gmail. Still staged. Review, then Apply to retry.” No automatic retry.
• “Still unknown. Could not read this message. Recheck again; no write sent.”
Mixed outcomes remain per-message, even when grouped under one sender/action.

Journal save failure: “No action sent. Recovery record could not be saved.”
If saving results fails: “Writes paused. Restart and recheck before submitting.”
Interrupted submissions reopen as unknown. Unsubmitted marks remain temporary.

REVIEW / 3 attempted   [Return to Inbox]   [Show preview (Alt+R)]
Preview hidden · Review is full-width · New Gmail writes paused

Could not confirm every change. Do not submit again yet.
1 confirmed · 1 failed · 1 unknown · 2 decisions remain staged

ARCHIVE · Transit Desk · Schedule update
CONFIRMED — no longer in Inbox; unread unchanged. No Undo.

ARCHIVE · Transit Desk · Monthly receipt
FAILED — request rejected. Decision stays staged.
[Put back: cancel pending mark]   [Details]   Retry after recovery.

TRASH · Daily Offers · June specials
UNKNOWN — connection lost; Gmail may have changed.
[Recheck Gmail — read labels, no write]   Put back unavailable until checked.

[Apply to Gmail — unavailable: resolve unknown first]
[Recheck Gmail]   Recheck never resends a request.
Trash is not permanent deletion. Unread stays unchanged.

TRADEOFFS / deliberate, not universally better

1. Full-width Review improves outcome detail and avoids a
   hidden Apply, but costs a task switch and simultaneous
   Inbox/bin visibility. Keep counts and return position.

2. Retiring Auto-apply reduces Archive/Trash mode changes,
   but slows trusted-rule throughput and changes a saved
   preference. Explicit import notice; no silent conversion.

3. Literal states, larger text and persistent More consume
   row space. Fewer messages fit; subjects wrap before labels.
   Scroll rather than shrink type to preserve density.

4. Ctrl+Enter becomes safer but breaks existing muscle memory.
   Show its new meaning in the bar; never submit on that key.

CHECKABLE TEST / proposed; not run
Synthetic fixture only, keyboard only, Windows at 150%.
Use a 1100×600 logical viewport and record physical bounds.

[ ] Check Field Notes 2; preview unchecked Mara. User can
    name bulk target, preview, unread and pending separately.
[ ] Stage Archive; hide preview; recover with visible label
    or Alt+R. Same mail/scroll; no selection/read mutation.
[ ] Ctrl+Enter opens Review. No write before explicit Apply.
[ ] Inject confirmed/failed/unknown outcomes. User selects
    Recheck, not resubmit; labels distinguish all three.
[ ] Recheck says “not applied”: retry requires explicit Apply.
    “Unavailable” remains unknown; Put back cannot bypass it.

Pass: zero unintended writes/target changes; focus visible
and no trap; commit/recheck reachable without pointer.

UNCERTAINTY / scope and verification limits
No usability session, launch, screenshot measurement,
Excalidraw open-check or native accessibility test performed.
Sketch type/colors are not a proven accessible palette.
GPUI/WebView2 focus, announcements, IME and screen-reader
support require operator validation; none is claimed here.

Reader evidence: reader.rs:545–660. Keep allowed remote
images per message; Block cannot undo requests already sent.
No changed image policy is proposed. Native body focus and
pane switching must be checked, not inferred from this sketch.

Personal Windows Gmail triage only; 400 loaded Inbox cap,
sender rules, preview, selection, staging and Apply.
No compose/reply/forward, attachment browser, synced mailbox,
collaboration, onboarding expansion or new AI features.


## critic-3-astra-reading.excalidraw

Astra / Full-width reading and explicit review

Model / persona: Astra · reading-focused interaction designer; skeptical of permanent sidebars. This is a design lens, not user research.
Scenario: carefully read long HTML at 1100 × 600, then stage one decision while unrelated batches wait. LATER candidate, not migration approval.

FOUR PROPOSED CHANGES / source observation → design response → hypothesized benefit

OBSERVED / Three things worth keeping

1. Reading is not selecting or marking read.
   Separate active row, checkbox and unread styling
   let careful reading coexist with a batch target.
   main.rs:1172–1190,1243–1253; README / Triage

2. A decision need not destroy reading context.
   Staged/removed previews remain explicitly labeled.
   This supports checking the body after a decision.
   main.rs:2117–2134; README / pane visibility

3. Pending intent has a reviewable destination.
   Archive/Trash bins, Put back and guarded Apply
   distinguish preparation from uncertain writes.
   main.rs:1518–1690; README / Write outcomes

01 / Replace the permanent split with Browse → Read.
Observed: staging stays beside list and reader, even below.
Anchor: gpui-poc/src/main.rs:2090–2142.
Proposal: opening one message enters full-width reading;
Back restores list position, expansion and checked set.
Why: the HTML gets the window, not leftover pane width.
Hypothesis: fewer spatial distractions during close reading.

02 / Make metadata disclosure earn its height.
Observed: labels, date, images and status stack above HTML.
Anchor: gpui-poc/src/reader.rs:563–640.
Proposal: subject + one identity/state line; Details / images
opens full address, labels, date and the per-message toggle.
Keep load/error notices visible; long subjects may expand.
Why: less repeated chrome, more room for the actual argument.

03 / Collapse staging, not responsibility.
Observed: Apply lives in bins; footer has pane icons/count.
Anchor: gpui-poc/src/main.rs:1660–1690,2143–2150.
Proposal: persistent Pending N + Review & Apply in every mode.
Review replaces reading, rather than squeezing it or covering it.
Back returns to the same message and body scroll position.
Why: review remains discoverable without a permanent sidebar.

04 / Give reading actions a stable, singular scope.
Observed: checked actions share a wrapping toolbar with Auto-apply.
Anchor: main.rs:1939–2076; README / Auto-apply and read status.
Proposal: Stage Archive / Trash this 1; batch controls only in Browse.
Remove Auto-apply in this candidate: Archive/Trash always stage.
Reason: one predictable write boundary; imported ON needs a notice.
Read/unread remains explicitly “now” and writes immediately.

A / Proposed reading mode · 1100 × 600 content area · synthetic mail

← Back to Inbox

Preview 1 · 4 checked elsewhere

Pending 12

Review & Apply…

PROPOSED INTERACTION / navigation is reversible; writes are not

Browse retains sender groups, filter, Refresh, Rules and Run query, without a staging pane.
Click / Enter on one message enters Read. Group activation only expands the group.
Checkbox click / Space only checks. The four checked messages remain a separate batch.
Back restores the list, expansion, focus and checks; filtering still clears checks.

Stage Archive this 1 changes only Nora's mark: Pending 12 → 13. Unread stays unchanged.
Stay on this body at the same scroll offset; show “Staged Archive · Put back this 1”.
Do not auto-advance. Put back cancels only that unsubmitted mark, not Gmail changes.
Review & Apply opens review without writing. Apply there names Archive 11 / Trash 2.
It applies all pending marks, not the preview or four checked messages.
Run query always stages rule matches; existing pending marks still require Apply.

Riverwalk access: revised safety plan

Nora Chen · 14 Jun, 09:12    Unread · Not checked · Not staged

Details / images

Stage Archive · this 1

Stage Trash · this 1

More…

Riverwalk field notes / June access update

Hi Alex,

The east gate will stay closed through Monday. Please use the north entrance;
the route on last week's map is no longer safe after the overnight flooding.

Before your visit
• Arrive after 09:30, when the inspection team has cleared the walkway.
• Use the ramp beside the library, not the temporary stairs.
• If the river marker reaches the red band, postpone the visit.

The revised access table and site photographs continue below.

Keyboard proposal: Tab reaches every labeled control; Enter / Space activates it.
Escape closes Details / More first; from body it focuses Back; Back returns to Browse.
Ctrl+Enter outside text inputs opens review, rather than writing from the reader.
In Review, focus the named Apply button and press Enter. No new one-key write shortcut.

More contains “Mark read now” / “Mark unread now” and “Sender rule…”, scoped explicitly.
Read status writes immediately; only confirmed labels update. Unknown read status needs Refresh.
Details shows full address/labels/date, “Images allowed” and “Block images”. Default unchanged:
remote images are allowed per message; blocking cannot undo requests already sent.
HTML remains sanitized, body scrolls independently, and links open externally.

B / Same 1100 × 600 area · explicit review mode after partial Apply

TRADEOFFS / Opinion, not measured advantage

• More body width, less peripheral context: inspecting another sender needs Back.
  Preserve exact list/body positions; do not quietly replace the current message.
• Collapsed metadata reduces noise but makes image blocking and full labels one step away.
  Keep the labeled Details / images control; never bury load failures in that disclosure.
• Review mode avoids a cramped drawer, but interrupts reading for batch inspection.
  Back restores the body; the pending/error count remains visible when review is closed.
• Removing Auto-apply and changing Ctrl+Enter adds friction for fast triagers.
  This deliberately favors deliberation; disclose the behavior change, never switch silently.

Native risk: WebView2 is a child window, not ordinary GPUI paint. Review must hide it,
not draw over it. Reuse the reader and restore scroll/focus; verify on Windows.

← Back to reading

Pending review · 3 unresolved         4 checked elsewhere

Apply 13: Archive 11 / Trash 2 → 10 confirmed · 2 failed · 1 unknown

CONFIRMED 10 · Archive 9 / Trash 1 · removed from local Inbox
Includes Nora Chen / Riverwalk access. Preview kept; unread unchanged. No Put back.

FAILED 2 · Archive · Harbor Receipts
June receipt / Parking receipt · Gmail rejected these requests.
Still staged. Cancel these marks, or retry after unknown is resolved.

Put back 2

CHECKABLE TEST / Proposed synthetic prototype session; not performed

Set 1100 × 600; load 400 synthetic messages, four checked and 12 unrelated pending.
Ask the operator to read Nora's long HTML and identify the safe entrance and time.
Then stage only Nora for Archive, inspect pending work, and return to the same paragraph.

Pass checks: correct north entrance / after 09:30; no accidental write; pending becomes 13;
exactly the same four unrelated checks; unread unchanged; body position restored.
Before Apply, ask which messages will change: expect all 13 pending, not the checked four.
Inject 10 confirmed / 2 failed / 1 unknown. Expect Recheck, no resubmit of the unknown,
and no claim that Put back reverses the ten confirmed Gmail operations.
Repeat keyboard-only; record wrong-target actions, focus loss and discovery time.
Compare with current layout on equivalent mail; do not infer improvement from this sketch.

UNKNOWN 1 · Trash · Beacon Offers / Weekend pass
Connection lost after sending. Gmail may have changed this message.
Recheck this message's labels before retry or cancellation. No blind resubmit.

Recheck Gmail · 1

Apply 3 unavailable · recheck first

Recheck reads each message ID, not absence from the capped Inbox.
Requested state found → confirmed. Not applied → explicit retry. Unavailable → stays unknown.
Archive / Trash preserve unread. Trash is not permanent deletion.

EVIDENCE, UNCERTAINTY & BOUNDARIES

Read current working files, not HEAD: docs/design/layout-review/current-layout.md; gpui-poc/src/main.rs:1105–1294,1434–2219;
gpui-poc/src/reader.rs:545–660; gpui-poc/README.md; GOAL.md. Source wins over older screenshots. No sibling critic outputs consulted.
Only a design artifact: no app edits, commands, launch, credentials, Gmail requests or usability testing. Source observations are not empirical usability findings.

Keep Windows-only personal Gmail triage, sender rules, the 400-message cap, preview, checkmarks, staging and explicit Apply. No new mail-client or AI features.
Rules remain first-match-wins. New sender-rule confirmation states how many matching undecided messages it stages; editing an existing rule does not stage.
Unsubmitted marks remain temporary across restart; interrupted submissions retain journal recovery. No proposed persistent mailbox, global Undo or journal bypass.
Before submission, Review separates Archive and Trash, with sender/message detail and scoped Put back. While unknown exists, staging and Apply remain blocked.
The sketch's type/color is illustrative, not a verified accessible palette. Screen-reader, IME, scaling, long subjects and native focus/scroll restoration need validation.
GOAL.md excludes redesign during the initial rewrite. This reading-first candidate requires a later product decision; it is not an approved migration change.


## critic-4-astra-organization.excalidraw

ASTRA / ORGANIZATION — Sender context + decision ledger

Later design candidate • dirty working source reviewed • synthetic mail only • not an approved migration redesign

MODEL / Information-architecture critic
Organize by sender identity, represented set, then decision.
My opinion: explain membership before offering bulk action.

Question to make answerable:
“Which of this sender's loaded messages are here, and why
are 12 going to Archive and 6 to Trash?”

This is a design lens, not a claim about observed users.
Strategy: stable sender master + inspectable decision ledger.

REVIEW / What works now — three concrete reasons
1. Sender aggregation gives a useful unit for volume triage.
   Address grouping + count ordering: triage.rs:83–119.
   Fewer repeated identities to scan; retain this model.
2. Label unions expose mixed membership, not a false single
   label for a group. labels.rs:45–71; main.rs:581–583.
   Numerators/denominators already have meaningful scope.
3. Preview, checkbox selection and unread are independent.
   main.rs:1165–1206; README “Triage” and “Write outcomes”.
   Inspection need not change targets or read status;
   staging + outcome-specific recovery protects intent.

EVIDENCE / Boundaries
Read current-layout.md, GOAL.md, gpui-poc/README.md and live
working files, not HEAD. Source anchors below are under gpui-poc/src/.
No sibling critiques, credentials, Gmail access or program launches.

Windows personal triage; fetch capped at 400 Inbox messages.
No compose, reply, forward, attachments, full mailbox, AI or sync.
GOAL.md excludes redesign during the initial migration.
Every mockup below is a later proposal, not current behavior.
Observed = source fact. Hypothesis = untested design interpretation.
Review verdict: design exploration only; no application diff reviewed.

01 / Keep sender context stable across decisions
OBSERVED — triage.rs:83–119 excludes marked messages
before grouping. main.rs:581–583 summarizes row IDs;
labels.rs:45–99 counts their labels, then limits chips.
Filtering or staging changes the represented denominator.

HYPOTHESIS — a shrinking sender row may look like a
statement about all mail from that person.

PROPOSE — master lists senders in this loaded set;
detail explicitly partitions All / Undecided / Pending.
Always show represented N of loaded M, plus unread N.
Show a full visible-label union for the active subset;
label counts can overlap and are not message totals.
Keep all-context counts alongside subset counts.
Checkboxes target only eligible represented messages.
RATIONALE — make scope inspectable before selection.
Not a sender-wide Gmail search or mailbox view.

02 / Explain actual origin, not present-day rule fit
OBSERVED — triage.rs:42–45 stores action/outcome,
not provenance. main.rs:bins (around 1580–1620)
computes “RULE” from the first email's current From.
triage.rs:68–73 uses first substring match on full From.
apply_rules:180–195 skips existing marks.

HYPOTHESIS — “RULE” can be read as the cause even
when a user manually staged that sender's messages.

PROPOSE — capture origin when a mark is created:
manual, query, or new-rule save; rule ID/order/pattern
snapshot for rule-derived marks. Show later matches
as “also matches; not chosen”. Never recalculate origin
from current settings. Unrecorded history = unavailable.
RATIONALE — explain the 12/6 split without implying
labels drove sender rules. Same address can have
varying display names, hence partial From matches.

03 / Replace staged peeks with a context-preserving view
OBSERVED — main.rs:2160–2250 builds an overlay
for one sender/action; its items show subject/snippet.
Render's reader visibility gate hides the native body
while peek/hover is active (around main.rs:1910).

HYPOTHESIS — reviewing a bin obscures the evidence
needed to compare pending and remaining messages.

PROPOSE — click an Archive/Trash subtotal to switch
the center membership tab. No hover-to-replace view.
Sender stays selected; pending rows expose labels,
unread and origin. Click a subject for the same reader.
Back to members restores subset, scroll and focus.
The ledger remains visible while the body is open.
RATIONALE — inspect decisions as part of one sender's
context, not as an unrelated floating subject list.
Reader-first expansion is explicit, never selection.

04 / Make the order of decisions a visible contract
OBSERVED — main.rs:render toolbar (around 1970–2080)
mixes query, rules, checked actions and Auto-apply.
README “Triage”: direct actions can auto-submit;
Run query always stages; read/unread writes now.

PROPOSE — remove Auto-apply in this later design.
All Archive/Trash actions, including drops and new
sender-rule saves, stage. Only Apply submits them.
Keep read/unread separate and label “writes now”.
Put retrieval at top; targets below membership;
commit and recovery stay in the decision ledger.
Run query (stage) refreshes the capped Inbox, preserves
existing marks, and explains matches among eligible mail.
RATIONALE — one commit boundary is easier to explain.
Cost: intentional loss of immediate Archive/Trash speed.
Existing pending marks still require Apply; no silent
migration of an ON preference without explaining change.

A / Proposed sender workspace — after Run query; all counts synthetic; schematic desktop proportions

B / Compact interaction state — Apply had mixed outcomes

MADO / SENDER DECISIONS       [ Filter loaded messages…                         ]       [ Refresh ]       [ Run query (stage) ]       [ Rules ]
Loaded Inbox: 400 / fetch cap 400 • 382 undecided • 18 pending • no mailbox-wide totals
Query result: 8 newly staged; 10 existing marks kept. Selected sender: 8 of 10 previously undecided matched. No Gmail writes.

[ Back to sender ]     Field Notes / DECISION RESULTS
Submitted: 12 Archive + 6 Trash
Confirmed 15 • Failed 2 • Unknown 1 — these are not one “pending” category.
Selected sender now: 5 retained / 2 undecided, 2 failed, 1 unknown.
Last fetch contained 400; 15 confirmed removed locally. [ View submission ]

SENDERS / loaded set
Sort: loaded count, then address

> Field Notes
  newsletter@post.test
  20 loaded • 7 unread
  2 undecided
  12 Archive / 6 Trash pending

  Harbor Receipts
  receipts@harbor.test
  16 loaded • 4 unread
  16 undecided

  City Library
  notices@library.test
  9 loaded • 2 unread
  9 undecided

  More senders…


CONTEXT, NOT A BULK TARGET
Choose a sender to inspect it.
No checkbox on the master.

This is not all sender mail.
Only this loaded Inbox set.

Pending keeps its sender here.
Confirmed writes remove items
from the local Inbox context.

Refresh can change membership.
Outstanding retained items are
shown separately if outside the
latest capped fetch.

FIELD NOTES / newsletter@post.test                       [ Sender rule… ]
20 loaded: 2 undecided + 12 pending Archive + 6 pending Trash
Full From varies: Field Notes / Notes Promo / F.N. Billing

Loaded label union: Newsletters 14/20 • Finance 6/20 • Projects 3/20
7/20 unread • labels overlap • user labels only • [ Full label details ]

DECISION LEDGER / all senders
18 pending • all from selected sender
No submissions yet. [ Cancel all pending ]

[ ARCHIVE 12 → inspect members ]
8 / Query • R2 “Field Notes”
4 / Manual • checked-message action
Example A01: Weekend reading / unread
Example A09: April receipt / read
[ Put back Archive 12 ]

[ TRASH 6 → inspect members ]
6 / Manual • checked-message action
Example T01: Spring offer / unread
Existing marks kept by Run query.
[ Put back Trash 6 ]

UNKNOWN 1 / Archive A01 — Weekend reading
Origin: Query / R2 “Field Notes” • unread before submission
Connection lost. Gmail may already have applied Archive.
[ Preview A01 ]     Put back: unavailable     Resubmit: unavailable

Recheck this message ID in Gmail. Not the capped Inbox list.
No ordinary Undo and no blind retry.

[ All 20 ]   [ UNDECIDED 2 ]   [ Archive 12 ]   [ Trash 6 ]
Represented now: 2 of 20 loaded • 1 unread • both eligible to stage
Subset label union: Finance 2/2 • Projects 1/2

FAILED 2 / Trash T01, T02 — Spring offer; Last chance
Origin: Manual • Gmail rejected these writes; marks remain staged.
[ Inspect errors ]       [ Put back these 2 ]
Apply is disabled while any unknown remains.
After recheck resolves unknowns: explicit Apply can retry failed items.

[✓] Check represented eligible 2          CHECKED ≠ PREVIEW ≠ UNREAD

[✓] U19  UNREAD  •  PREVIEW                              Today 09:10
    Annual renewal receipt — F.N. Billing
    Finance, Projects • Undecided • no sender rule matched

[✓] U20  READ                                            Yesterday
    Billing address confirmed — F.N. Billing
    Finance • Undecided • no sender rule matched

WHY THESE 8? / query-time trace
From: Field Notes <newsletter@post.test>
R1 “receipts@” → no match
R2 “Field Notes” → Archive / FIRST HIT
R3 “Notes” → Trash / later hit, ignored
Case-insensitive substring of full From.
Labels did not participate.

U19/U20 From: F.N. Billing <same address>
Neither “Field Notes” nor “Notes” matches.
6 Notes Promo marks were already manual;
query did not overwrite them.
[ Inspect rule order ]

CONFIRMED 15 / Archive 11 + Trash 4
Removed from the local Inbox. Unread preserved.
Session receipt only — not a new synced mailbox or permanent archive.
No Put back control for these completed writes.

PREVIEW U19 / unread unchanged            [ Expand body ] [ Close ]
Annual renewal receipt
F.N. Billing <newsletter@post.test> • Today 09:10
Finance, Projects        [ Mark U19 read — writes now ]

Your Field Notes annual subscription renewed for $48.
Your next renewal is 14 June. Thank you for supporting our work.

Images allowed for this message. [ Block images ]

[ RECHECK GMAIL / 1 unknown ]                 Apply: disabled
Recheck reads labels; it does not replay the Archive request.

Already archived → confirmed. Still in Inbox → staged for explicit retry.
Unavailable → remains unknown and locked against resubmission.
A restart uses the recovery journal; never discard it to bypass recovery.

APPLY / 12 Archive + 6 Trash
Writes all 18 pending to Gmail

Checked: U19 + U20 / 2 messages, 1 sender              [ Clear ]
[ Stage Archive 2 ]       [ Stage Trash 2 ]
Acts on checkmarks only. Preview is not an implicit target.

Archive/Trash preserve unread.
Trash is not permanent deletion.
Put back cancels marks, not Gmail writes.

Interaction annotation: the result view replaces the center/ledger, not the sender identity.
Session receipts and recorded origins are proposed additions; do not infer old history.
Existing outcome contract: triage.rs:203–232 and README “Write outcomes and recovery”.
Unknown blocks new staging and Apply; failed items remain distinguishable and cancellable.
This is an error-state sketch, not a claimed 1100×600 pixel-fit validation.

1 Inspect sender  →  2 Check messages  →  3 Stage decisions  →  4 Review origins  →  5 Apply     •     Pending decisions are temporary until submitted.

PROPOSED INTERACTION / click, keyboard, membership
Click sender or Enter on master → inspect; never check its messages.
Click subject or Enter on member → preview; unread stays unchanged.
Space/Enter on checkbox toggles only that target. Mixed → check all eligible.
All/Pending tabs keep pending members visible but not eligible for restaging.
Explicit Put back cancels their marks before they can be staged again.

Tab / Shift+Tab traverse master, subset tabs, checkboxes, actions, ledger.
Up/Down navigate the focused list; focus outline is separate from preview.
Ctrl+F focuses loaded-message filter. Filter changes clear checkmarks.
PROPOSED: changing sender/subset also clears checks, with an announced count
in visible status; avoid hidden targets. This costs cross-sender convenience.
A global matching-messages view can retain existing bulk selection scope;
its group checkboxes must still name the represented eligible count.

Ledger subtotal → exact sender/action membership; origin line → explanation.
Escape from expanded body restores member focus and scroll, not unread.
Ctrl+Enter outside text inputs uses Apply's same enabled/blocked state.
Row menu retains Shift+F10 and row-local targets; never uses preview implicitly.
Drag can remain optional: fully checked row = checked batch; otherwise row.
Drop only stages; Escape/outside cancels. No hover-only path is required.
These are proposed interactions; keyboard or assistive-tech testing not run.

DECISION ORDER / preserve the safe write contract
Fixture before query: sender 20 = 10 undecided + 4 manual Archive + 6 manual Trash.
Of those 10 undecided: 8 “Field Notes” Froms match R2; 2 F.N. Billing do not.
Run query refreshes capped Inbox, stages those 8, keeps the existing 10 marks.
After query: Archive 12 = query 8 + manual 4; Trash 6 = manual 6.
R3 “Notes” also matches the 8, but R2 wins by list order, not specificity.
Rules do not target labels. No regex, priority scoring or new rule language.

Rule inspector shows list positions and full From examples beside members.
No implicit reordering. Editing an existing rule only saves the rule.
New sender-rule editor says “Save rule + stage matching undecided messages”.
Show its literal From pattern and eligible count; do not imply all sender mail.
New provenance needs an explicit data-model addition; it does not exist today.

Stage → temporary intent. Apply → Gmail write. Put back → cancel only.
Unsubmitted marks remain unsaved across restart; warn before discarding them.
Read/unread → immediate write, independent of Archive/Trash and selection.
Only confirmed read results change local unread; uncertainty needs refresh.
Previewing pending/removed mail retains an explicit status and body.
Images remain allowed by default per message, as in reader.rs:545–660
and README “Reader and privacy”; blocking cannot undo sent requests.
No remote-image policy change is proposed here.

TRADEOFFS / intentional costs, not free improvements
1. Stable sender identity vs faster disappearing work.
   Keeping pending senders visible makes progress less visually dramatic.
   Partition counts and an “undecided senders” view must prevent clutter.

2. Provenance clarity vs model and recovery complexity.
   Store decision-time rule snapshots, not just a computed RULE badge.
   Recovery must tolerate missing origins; no fabricated historical reasons.
   Session receipts must not become an accidental local mailbox or log of bodies.

3. Single commit boundary vs expert throughput.
   Removing Auto-apply adds Apply to quick Archive/Trash work.
   Explicit “writes now” remains necessary for immediate read/unread actions.

4. Sender-first navigation vs cross-sender bulk work.
   Clearing checks on context switch is safer but breaks carrying targets around.
   Keep an explicitly scoped global results route, rather than hidden selection.

SMALL WINDOW DIRECTION / not a pixel-validated implementation
At 1100×600, use Senders / Members / Ledger as named workspace modes.
Keep loaded scope and pending/recovery summary pinned; preserve sender ID.
Preview replaces Members temporarily. No simultaneous three squeezed columns.

CHECKABLE USABILITY TEST / proposed, not performed
Setup: synthetic loaded Inbox of 400; Field Notes fixture as in A; R1 receipts@, R2 Field Notes → Archive, R3 Notes → Trash.
Use an interactive prototype and a local fake write sink only. Compare current layout with this candidate; counterbalance order.
Task: “Explain the 12 Archive / 6 Trash split, find the two remaining messages, inspect the receipt, then review an uncertain Apply.”

[ ] Scope: participant says 20 loaded from this address, not all Gmail mail; subset 2 is not sender total.
[ ] Labels: explains Finance 2/2 versus 6/20 and why label sums can overlap; never attributes sender rules to labels.
[ ] Rules: identifies 8 query-derived + 4 manual Archive; 6 manual Trash; R2 beats R3 by order, not specificity.
[ ] Partial match: identifies varying full From display names; does not assume all same-address mail must match R2.
[ ] Selection: opening U19 changes neither checkmarks nor unread. Checking U19/U20 changes only the checked count.
[ ] Cancellation: Put back one unsubmitted item changes intent and sends zero fake writes; Apply is the Archive/Trash boundary.
[ ] Recovery: for state B, chooses Recheck rather than retry/cancel A01; distinguishes failed 2 from confirmed 15.
[ ] Keyboard: completes the same route with visible focus and no pointer-only reveal dependency.

Pass gate: every scope/rule/outcome answer correct and zero unintended writes; unknown is never blindly resubmitted.
Record time to explain the split, wrong-target attempts and requests for help; do not infer speed superiority from this sketch.
Run at desktop size and 1100×600, including 150% Windows scaling, long labels and unavailable label metadata.
A failure of the scope or provenance questions rejects this organization, even if task time improves.

UNCERTAINTY / implementation and evidence limits
Source observation is not evidence of confusion: the four changes are design hypotheses, not measured usability defects.
The present RULE indicator is demonstrably computed from current rules, while Mark has no provenance; that is the narrow source fact.
A later implementation must decide how origin snapshots survive interrupted submissions without storing unnecessary message content.
Existing recovery journals may have no origin: display “Origin unavailable”, never reconstruct a historical explanation from current rules.

Loaded scope is not always simply emails.len(): triage.rs:233 onward retains marked messages absent from a refreshed capped fetch.
Show “latest fetch” and “retained outstanding” separately when they differ; do not imply the fetch limit has increased.
Keep hidden-label policy explicit: current rows omit hidden user labels, reader details include them; unavailable catalog entries stay visible.
The proposed group union is the union of visible user labels, not proof that all possible labels were fetched successfully.

No app was launched, no screenshots newly verified, no tests or Git commands run, no files modified directly.
Native WebView2 layout/focus constraints still apply; expanding the body is not proof that a GPUI overlay can cover it safely.
Font and colors are sketch choices, not a validated accessible palette. Screen-reader, IME and clipboard usability remain unverified.
No real-account operations, memory benchmarks or throughput claims. All sender names, subjects, rules and counts are synthetic.

RECOMMENDATION / explore sender context + provenance before adjusting density or decoration.
Keep migration scope unchanged. If this later concept is pursued, prototype the ledger and test the scope questions first.
Residual risk: extra context may slow expert bulk triage; only the proposed comparison can establish whether the benefit outweighs it.

