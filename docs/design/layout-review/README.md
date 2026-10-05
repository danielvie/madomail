# GPUI layout review

Five editable Excalidraw boards: the current layout and four independent alternatives. Each critic board contains its opinion of the existing design, proposed layout, UX behavior, tradeoffs, source references and an unrun usability test.

Drag a `.excalidraw` file into https://excalidraw.com to open it.

## Boards

| Board | Model and design lens | Main layout idea | Elements |
|---|---|---|---:|
| [Current layout](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/docs/design/layout-review/current-layout.excalidraw) | Parent analysis | Default workspace, beside reader, below reader, Rules and write boundaries | 137 |
| [Triage speed](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/docs/design/layout-review/critic-1-sol-triage.excalidraw) | `openai-codex/gpt-6-sol`, keyboard-first operator | Fixed bulk-command rail and pending strip; separate review drawer | 55 |
| [Accessibility and recovery](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/docs/design/layout-review/critic-2-sol61-accessibility.excalidraw) | `openai-codex/gpt-6.1-sol`, accessibility specialist | Named tasks, literal states, persistent controls and deliberate full-width Review | 61 |
| [Focused reading](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/docs/design/layout-review/critic-3-astra-reading.excalidraw) | `openai-codex/gpt-6-astra`, reading-focused designer | Full-width reading, compact metadata and Back to preserved Inbox context | 62 |
| [Sender organization](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/docs/design/layout-review/critic-4-astra-organization.excalidraw) | `openai-codex/gpt-6-astra`, information-architecture specialist | Sender master, explicit message subsets and decision ledger with recorded origins | 61 |

[Baseline analysis](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/docs/design/layout-review/current-layout.md) records source behavior and the four distinct assignments. [Critic notes](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/docs/design/layout-review/critic-notes.md) collects the text from their boards. [Run record](C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration/docs/design/layout-review/critic-runs.md) records their completed outputs.

`current-demo.png` is a fresh synthetic, app-window-only capture. The two reader reference images are older synthetic captures, not freshly verified states.

## Comparison

All four keep sender grouping and distinguish reading from bulk targets. They agree that pending decisions and uncertain Gmail outcomes need explicit wording.

Their priorities differ. Speed keeps commands fixed and avoids repeated pointer travel. Accessibility adds named tasks and visible state labels. Reading gives the message the window instead of leftover column space. Organization makes sender membership and rule origins inspectable.

Speed retains an optional immediate-write mode with stronger wording. The other three propose removing Auto-apply. Accessibility and reading also change Ctrl+Enter from submitting to opening Review. These are deliberate behavior changes, not descriptions of the current app.

The organization proposal needs new decision-origin data. Current marks do not record that history; its proposed ledger cannot truthfully reconstruct old origins from today's rules.

No winner is established. The boards include synthetic tasks for comparing target errors, recovery understanding, focus behavior and task time.

## Validation and limits

All five files passed JSON/root checks, unique-ID checks, finite nonnegative dimensions, and text checks for Excalifont with font size at least 16. A geometry check found no intersecting text bounding boxes or text extending outside its smallest containing rectangle. Total: 376 elements.

This checks saved geometry, not browser font rendering. Actual Excalidraw opening, native UI behavior, scaling, screen-reader support and usability were not tested. The existing application was not changed by this review.

Source files changed during the review, so line numbers in the baseline and individual boards can differ from the latest working tree. Use the named functions and README contracts when following references. The baseline records the state inspected and captured at the start, not a permanently frozen source revision.

These are later design candidates. `GOAL.md` still excludes redesign during the initial GPUI migration. No alternative has been approved or implemented.
