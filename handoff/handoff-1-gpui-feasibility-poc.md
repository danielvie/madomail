# Rust + GPUI feasibility PoC handoff

## Goal and current phase

The user wants a faster, lower-memory Rust + GPUI version of Mado Mail. We are building small proofs of concept to validate feasibility before implementing the full application. The current PoC is not the triage rewrite and does not establish that the performance goal has been met.

Rust + GPUI is mandatory, not a candidate framework. Failed feasibility tests identify work or blockers; switching frameworks requires an explicit user decision.

The settled product scope, behavior changes, and success criteria are in `GOAL.md`. The framework decision is in `docs/adr/0001-rust-gpui.md`. Read those rather than reconstructing requirements from this handoff.

## Workspace and Git state

- Active implementation worktree: `C:/SANDBOX/REPOS/mado_mail.feat-gpui-migration`.
- Branch: `feat/gpui-migration`.
- HEAD at handoff: `9ca431475d2cd96b17fa6979d4322dee3a918cfd`.
- All session work is uncommitted. Tracked modifications are `.gitignore`, `README.md`, and `Taskfile.yml`. New paths are `GOAL.md`, `docs/adr/`, `docs/research/`, `gpui-poc/`, and this handoff.
- Use the active worktree for repository operations. The original Electron implementation remains here as the reference; it was not deleted or migrated.
- The user initially permitted replacing worktree files, but the agreed approach is to preserve the old app and user settings until validation and migration gates pass.

Paths below are relative to the active worktree.

## Read first

- `GOAL.md`: canonical requirements and agreed boundaries.
- `docs/adr/0001-rust-gpui.md`: mandatory framework decision.
- `gpui-poc/README.md`: current PoC behavior, setup, limitations, auth storage, and commands.
- `Taskfile.yml`: `run`, `build`, `test`, and `clean` target the Rust PoC; `reader-demo` opens synthetic HTML without Gmail access; `check-reader` runs the native reader regression check. `dev` still runs Electron.
- `gpui-poc/Cargo.toml` and `Cargo.lock`: pinned dependencies and resolved build.
- `docs/research/gpui-feasibility.md`: saved primary-source research. The researcher timed out after writing it, so treat it as partial research, not a completed validation gate. Follow its primary-source links when needed.
- `docs/research/gpui-html-reader.md`: HTML reader design, restrictions, native integration issue, and primary-source evidence for the rendering fix.

`CONTEXT.md` contains stale Svelte-to-React migration notes. `docs/project-overview.md` also disagrees with some current interactions. For behavioral parity, inspect the Electron source: `src/renderer/src/App.tsx`, `components/TriageRows.tsx`, `components/StagingBins.tsx`, `lib/selection.ts`, and `src/main/gmail.ts`. Do not copy existing write-response handling as a correctness standard.

## What was done

1. Inspected the existing application and developed a staged feasibility plan. Three independent skeptic reviews agreed that prototypes were justified but replacement was premature. Their main concerns were write outcomes, concurrency, authentication, deployment, accessibility, migration, and unmeasured performance.
2. Recorded the user's decisions in the goal and ADR. The full scope is Windows-only, personal use, existing triage workflow/layout, and a 400-message limit; detailed requirements belong to those artifacts.
3. Created the isolated Rust application in `gpui-poc/`. Its initial question is whether a native GPUI UI can authenticate with Gmail and list Inbox messages. See its README for the exact implemented scope; full triage features remain absent.
4. Added remembered authorization in Windows Credential Manager, startup restoration, automatic refresh, and retention after temporary failures. Initial sign-in requests consent and offline access. Existing Electron token files are not migrated or changed.
5. The user approved HTML bodies and images, expanding the earlier text-preview scope in `GOAL.md`. Opening a message fetches its body on demand and reuses a separate reader window. GPUI owns the UI controls; Wry hosts WebView2 for sanitized HTML/CSS. Embedded raster images display directly; remote HTTPS images require per-message permission. Gmail access remains read-only. See the PoC README for restrictions and limits.
6. Inbox and reader jobs share one session lock. Stale body/error completions are rejected, and a revoked session cannot delete newly saved authorization after reconnection.

Implementation entry points:

- `gpui-poc/src/main.rs`: startup renderer setting, Inbox UI, and reader opening.
- `gpui-poc/src/gmail.rs`: authorization, credential storage, MIME body/inline-image reads, and synthetic HTTP tests.
- `gpui-poc/src/message.rs`: sanitization, content/URL policies, and embedded-image resolution.
- `gpui-poc/src/reader.rs`: WebView2 hosting, native restrictions, loading, and image permission.
- `gpui-poc/src/reader_check.rs`, `gpui-poc/check-reader.ps1`, and `gpui-poc/check-window.ps1`: synthetic browser and parent-window regression checks.

## WebView2 blank-body issue and fix

The user saw the message headers and image controls but no body, even after allowing images. The initial check passed because WebView2 had loaded the document and could capture it internally. That did not prove the body appeared in the GPUI window.

GPUI 0.2.2 creates its DirectComposition target with `CreateTargetForHwnd(hwnd, true)`. The `true` flag places GPUI's composition tree above child windows, covering the WebView2 child. This was a native layering issue, not a Gmail fetch or remote-image permission failure.

The fix is in `main.rs`: set `GPUI_DISABLE_DIRECT_COMPOSITION=1` before `Application::new()` or worker initialization. GPUI then uses its supported DirectX HWND swap-chain path. Rust + GPUI remains the framework; this is not a software-rendering or framework replacement. Preserve this startup ordering until a child-safe upstream composition path is validated. Include the setting in future performance comparisons.

`task check-reader` now requires the synthetic banner to appear in a capture of the GPUI parent window, as well as checking WebView2's document. The added visibility check failed before the fix and passed afterward. Captures remain restricted to the selected synthetic PoC window, never the desktop. `PrintWindow` can still omit GPUI's GPU-rendered header; browser-only `CapturePreview` is not sufficient evidence of onscreen integration.

After restarting with the fix, the user explicitly confirmed: "ok, it works now." Treat basic real-mail body display as user-confirmed, not as comprehensive rendering, accessibility, or performance validation.

## What was verified

- Release compilation succeeded on the session's Windows machine with stable Rust 1.95.0 and the MSVC target.
- The native GPUI window opened successfully, including after the auth update.
- `task test` passed all eight tests. Coverage includes OAuth callbacks/refresh, MIME selection and character decoding, synthetic full-message/CID-part GET requests, sanitization, and URL policies. Credential checks use synthetic Windows entries only; they do not inspect the user's saved tokens.
- `task check-reader` passed HTML loading, embedded-image decoding and parent-window visibility, remote-image permission/reblocking, disabled scripts/host objects, stale-completion rejection, resizing, and scrolling. It serves the synthetic remote-image fixture locally and never calls Gmail. Reports/captures are under `gpui-poc/target/`.
- Clippy with all targets and warnings denied, formatting checks, and `git diff --check` passed.
- The window-check script captures only the selected PoC window. Preserve its privacy boundary; do not replace it with desktop capture.
- Last process check found no running PoC. Launch instructions are in its README. Close the matching PoC window before rebuilding changed source because Windows locks a running executable; do not stop unrelated application processes.

The user's screenshot showed a loaded real Inbox, and the user confirmed the reader works after the fix. Agent-run reader checks used synthetic mail only. Google sign-in/token refresh and remembered authorization across a real-account restart have not been independently verified by the agent or explicitly confirmed as a restart test. Exact Gmail rendering parity, all image formats, and full keyboard/accessibility behavior remain unverified.

## Next work

1. Ask the user to confirm one offline-access sign-in followed by closing and reopening the PoC without another browser login. Investigate failures without reading or logging real credential values. Google Testing-mode token expiry can still force periodic reauthorization; see the README and linked Google documentation.
2. Establish an Electron release baseline and agree numeric speed/memory improvement targets. No matched benchmark exists yet. Initial empty-window memory observations are not performance proof. Include all app-owned WebView2 processes and the required GPUI renderer setting. Separate Gmail network time from UI time; use the research artifact's measurement recommendations as a starting point.
3. Keep subsequent work as bounded feasibility PoCs. Required input, keyboard/accessibility behavior, layout parity, clean-machine deployment, and safe write handling still need validation. Do not grow this directly into the full mail client.
4. Before any Gmail write experiments, use dedicated test messages and explicit outcome/reconciliation rules. Before replacing Electron, preserve a runnable build and validate rules/preferences export and import.
5. Implement the full application only after the feasibility gates pass and the user approves proceeding. No alternative UI framework is authorized.

## Suggested skills

- `unslop` and `clear-explanations`: concise, precise documentation and responses.
- `shared-understanding`: resolve performance targets and maintain the canonical goal and decisions.
- `prototype`: keep experiments small, explicit, and focused on a feasibility question.
- `research`: verify changing GPUI/OAuth facts against primary sources; avoid confusing Zed application requirements with standalone GPUI requirements.
- `domain-modeling`: when refining triage terminology or recording consequential architectural decisions.
- `pi-subagents`: only for newly authorized delegated work. The completed skeptic reviews are not blanket permission to delegate implementation.
