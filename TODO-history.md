# TODO: Rewrite code-analyze skill

- [x] Create pressure scenarios (RED Phase) <!-- id: 0 -->
- [x] Run scenarios against current skill (or baseline) <!-- id: 1 -->
- [x] Draft new skill structure based on `writing-skills` standards <!-- id: 2 -->
- [x] Implement GREEN Phase: Minimal skill that passes scenarios <!-- id: 3 -->
- [x] Implement REFACTOR Phase: Close loopholes and add red flags <!-- id: 4 -->
- [x] Final verification <!-- id: 5 -->
- [x] Analyze project and update README <!-- id: 6 -->
- [x] Add info about $HOME/.mado folder to README <!-- id: 7 -->
- [x] Add detailed credential setup guide to README and code <!-- id: 8 -->
- [x] Beautify authentication error message and make links clickable <!-- id: 9 -->
- [x] Fix UI error display to preserve whitespace and linkify URLs <!-- id: 10 -->

# TODO: Marked items query flow

- [x] Inspect current mail UI and IPC/data flow <!-- id: 11 -->
- [x] Add marked items state and view toggle <!-- id: 12 -->
- [x] Add Alt-click popup to create/update marked items <!-- id: 13 -->
- [x] Add inbox query/filter action and apply-all flow <!-- id: 14 -->
- [x] Run build/check verification (`react-check` passed; full build blocked by existing `gmail.ts` unused variables) <!-- id: 15 -->

# TODO: Reduce search input size

- [x] Shrink search input header width <!-- id: 16 -->
- [x] Run React check <!-- id: 17 -->

# TODO: Refactor App.tsx into deep modules

- [x] Identify stable module boundaries <!-- id: 18 -->
- [x] Extract shared types <!-- id: 19 -->
- [x] Extract header/error/table/list/modal UI modules <!-- id: 20 -->
- [x] Wire App.tsx to extracted modules without behavior changes <!-- id: 21 -->
- [x] Run React check <!-- id: 22 -->

# TODO: Unmark all fallback

- [x] Change unmark button label/disabled state for marked-only state <!-- id: 23 -->
- [x] Clear all marks when UNMARK_ALL is pressed <!-- id: 24 -->
- [x] Run React check <!-- id: 25 -->

# TODO: Alt mark cursor affordance

- [x] Track Alt key state in mail table <!-- id: 26 -->
- [x] Change hovered row cursor/style when Alt can mark item <!-- id: 27 -->
- [x] Run React check <!-- id: 28 -->

# TODO: Fit email columns

- [x] Add fit-columns control to header <!-- id: 29 -->
- [x] Change grid sizing so Date and From can fit while Subject fills rest <!-- id: 30 -->
- [x] Implement auto-fit sizing from visible inbox data <!-- id: 31 -->
- [x] Run React check <!-- id: 32 -->

# TODO: Stable list toggle width

- [x] Give List toggle a fixed width <!-- id: 33 -->
- [x] Run React check <!-- id: 34 -->

# TODO: Move fit columns control

- [x] Remove FIT_COLS from header controls <!-- id: 35 -->
- [x] Add FIT_COLS beside table titles <!-- id: 36 -->
- [x] Run React check <!-- id: 37 -->

# TODO: Replace app icons

- [x] Identify icon source files and app icon targets <!-- id: 38 -->
- [x] Replace runtime/build PNG icon assets <!-- id: 39 -->
- [x] Regenerate package icons if conversion tools are available <!-- id: 40 -->
- [x] Run build/check verification (`bun run build` still blocked by existing `gmail.ts` unused variables) <!-- id: 41 -->

# TODO: Sort item list alphabetically

- [x] Find the item list data/rendering path <!-- id: 42 -->
- [x] Sort the displayed items alphabetically <!-- id: 43 -->
- [x] Run focused verification <!-- id: 44 -->

# TODO: Build Windows release

- [x] Run `bun run build:win` and capture blockers <!-- id: 45 -->
- [x] Fix build-blocking issues only <!-- id: 46 -->
- [x] Re-run `bun run build:win` successfully <!-- id: 47 -->

# TODO: Add filter input to MarkedItemsView

- [x] Add filter input to `MarkedItemsView.tsx` <!-- id: 48 -->
- [x] Implement filtering logic for marked items <!-- id: 49 -->
- [x] Ensure consistent styling with the rest of the app <!-- id: 50 -->
- [x] Run React check <!-- id: 51 -->
