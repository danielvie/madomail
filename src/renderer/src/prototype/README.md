# PROTOTYPE — throwaway

Layout variants for the Mado Mail inbox-triage workspace.
Answers: "what should this look like?" — the current single dense table is not liked.

Run:

    pnpm prototype

Switch with the floating bottom bar, `?v=1` .. `?v=23`, `Alt+1..0`, or `[` / `]`.

Nothing here is wired to Gmail. All data is in `fixtures.ts`, all state is in memory
(`store.ts`). Switching variants resets the workspace.

## Round one (1-10) — graded by the user

| #   | Variant       | Grade                                               |
| --- | ------------- | --------------------------------------------------- |
| 1   | Sender Stacks | 2                                                   |
| 2   | Card Deck     | 1 — does not help with volume                       |
| 3   | Commander     | 8 — great concept                                   |
| 4   | Digest        | 6                                                   |
| 5   | Palette       | 4 — needs work on effectiveness                     |
| 6   | Board         | 6                                                   |
| 7   | Three Pane    | 7                                                   |
| 8   | Terminal      | 4                                                   |
| 9   | Rule Cockpit  | 7                                                   |
| 10  | Focus Queue   | 3 — too many steps, decide faster on the entry page |

Principles extracted from those grades, applied to round two:

- bulk beats one-at-a-time; volume is the whole problem
- pending marks need a visible place (3)
- reading without leaving the screen matters (7)
- rules are a good control surface (9)
- everything actionable on load: no start screen, no rounds, no wizard (10)
- density is fine; grids of cards are not (1 vs 3)

## Round two (11-15)

| #   | Variant      | Lineage                                                                       |
| --- | ------------ | ----------------------------------------------------------------------------- |
| 11  | Triage Desk  | 3 + 7 — Inbox / Reader / Staged, shift-ranges, +N sender grab                 |
| 12  | Sweep Table  | retry of 1 as a dense table of collapsible sender bands + docked tray         |
| 13  | Rule Rail    | 9 at table density; one-click "always" writes a rule and stages retroactively |
| 14  | By Example   | click one row, get the batch it belongs to (same sender, or repeated subject) |
| 15  | Marked Table | control: today's table with marks painted in place, ranges, ledger footer     |

Round-two grades, and what they said:

| #   | Variant      | Grade                                                                  |
| --- | ------------ | ---------------------------------------------------------------------- | ----------------------------------------- |
| 11  | Triage Desk  | 7 — selection was background-only, so unselecting gave no confirmation |
| 12  | Sweep Table  | 8 — best of the round                                                  |
| 13  | Rule Rail    | 6 — no clear staging area; the `A D                                    | ALWAYS A ALWAYS D` control was the keeper |
| 14  | By Example   | 4                                                                      |
| 15  | Marked Table | 4                                                                      |

## Round three (16-20) — staging areas

Staging is the variable under test, so the list is held constant across all five:
`TriageList.tsx` is variant 12's sender bands, with an explicit selection checkbox
(fixing 11) and 13's `A D | ALWAYS A ALWAYS D` control on every row. Only the staging
area differs between variants.

| #   | Variant        | Staging idea                                                                          |
| --- | -------------- | ------------------------------------------------------------------------------------- |
| 16  | Bin Drawer     | Two named bins always on screen, each grouped by sender; Apply spells out both counts |
| 17  | Operation Log  | Stage _moves_, not messages — "archived 4 from UW CIRCLE", each undoable alone        |
| 18  | Before / After | Stage as outcome: "Inbox after apply: 20, was 32", and chips for what leaves          |
| 19  | Review Sheet   | One counter while working; a full-screen grouped review gates Gmail                   |
| 20  | Conveyor       | A narrow rail of tinted tiles — batch shape readable at a glance, hover to peek       |

`store.ts` gained an `ops` log (bulk moves with per-op undo) to support 17.

Round-three grades:

| #   | Variant        | Grade                                                |
| --- | -------------- | ---------------------------------------------------- |
| 16  | Bin Drawer     | 9                                                    |
| 17  | Operation Log  | 8 — staging area too big for the information shown   |
| 18  | Before / After | 7 — a bit polluted                                   |
| 19  | Review Sheet   | 5 — worse than the others                            |
| 20  | Conveyor       | 8 — good layout, staged area communicates too little |

## Round four (21-22) — the finalists

Both share `TriageRows.tsx`, which adds the three-button selection model in
`selection.ts`:

- **left** — toggle this row, and make it the anchor
- **right** — select everything between the anchor and this row
- **middle** — flood the contiguous run this row belongs to:
  on an unselected row, select all unselected rows next to it;
  on a selected row, unselect all selected rows next to it

A row is the unit, not a message: a collapsed sender band is one row holding several
ids, so a middle-click run covers senders. Expanded band headers are skipped by the
model. The checkbox remains as the state display, which is what made unselecting
legible in round three.

| #   | Variant | Staging                                                                                                                    |
| --- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| 21  | Bins    | 16 unchanged (two named bins, per-bin sender count, Apply spells out both totals)                                          |
| 22  | Ledger  | 17+20 merged: a 250px column where each ~22px line carries a length-proportional bar, sender, RULE origin, count, and undo |

## Round five (23) — the combination

`?v=23` is the current candidate:

- **from 21** — staging split into two named bins, so Archive and Delete never mix;
  each bin header carries its sender count and total, and Apply spells out both.
- **from 22** — the dense line (bar length = count, sender, RULE origin) and the hover
  peek, which now tracks the hovered line's vertical position and shows subject +
  snippet for up to six messages.
- **changed on request** — a staged line is inert. Hovering peeks; putting messages
  back takes its own `↩` control, so nothing is undone by a stray click.

Selection is still the three-button model from round four.

## Outcome — rounds closed

**Variant 23 won and has been promoted.** Its layout now lives in the real app:

- `src/renderer/src/components/TriageRows.tsx`
- `src/renderer/src/components/StagingBins.tsx`
- `src/renderer/src/lib/selection.ts`, `src/renderer/src/lib/sender.ts`
- wired up in `src/renderer/src/App.tsx`

`?v=23` no longer renders a sketch — it renders those same components against the
fixture store, which is how colour themes get judged without Gmail credentials.
The superseded `MailTable.tsx` and `HeaderControls.tsx` were removed.

Variants 1-22 are kept only as a record of what was tried and rejected. They still use
the legacy colour names, which `main.css` aliases onto the new palette.

This directory is throwaway: delete it once the record is no longer wanted.
The only change outside it is the `prototype` script in `package.json`.
