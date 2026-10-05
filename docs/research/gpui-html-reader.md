# GPUI HTML reader PoC

## Scope and approach

The operator approved read-only HTML bodies and images after showing a branded membership email. `GOAL.md` now includes that preview scope; compose, reply, forward, and attachment browsing remain excluded.

The PoC keeps the Inbox and reader controls in GPUI 0.2.2. Wry 0.57.0 embeds WebView2 as a child of a separate GPUI reader window. Wry documents `build_as_child` for Windows and exposes settings for disabling page JavaScript, downloads, context menus, and browser-specific accelerators. GPUI exposes its native window handle and laid-out canvas bounds. The implementation maps those logical bounds to Wry's child bounds.

One reader window is reused. Opening a message fetches `users.messages.get` with `format=full`; externally stored MIME bodies and inline images use `users.messages.attachments.get`. Google documents the recursive MIME payload, base64url data, and `attachmentId` storage. No Gmail write methods or broader OAuth scope were added.

## Restrictions

Microsoft recommends treating WebView content as untrusted, disabling unnecessary capabilities, and checking navigation before exposing native functionality. The reader sanitizes email HTML with Ammonia, disables JavaScript/host objects/web messaging, denies permissions and downloads, and blocks top-level navigation except the internal document. User-initiated safe links open through the system browser.

A CSP response header and native resource filter block external requests except HTTPS images after per-message permission. Embedded raster images become data URLs. Fonts, remote stylesheets, forms, frames, and file URLs remain blocked. The reader never receives OAuth tokens or Gmail HTTP headers. HTML/CSS can affect only the child reader area, not the native controls.

These restrictions do not promise exact Gmail rendering or a completed security audit. Remote-image permission permits tracking requests. InPrivate is not a secure-erasure guarantee. The current embedded-image implementation has byte/count limits and does not support inline SVG or CID references inside CSS.

## Verification

`task test` exercises MIME body selection, character decoding, full-message and CID-part GET requests against a synthetic local server, sanitization, URL policy, and authorization refresh behavior. Tests use synthetic credentials only.

`task check-reader` starts a synthetic-only application mode and verifies the real WebView2 renderer: HTML layout, embedded-image decoding, remote images blocked/allowed/reblocked, disabled scripts and host objects, stale body/error completion rejection, child resizing, and scrolling. The permitted remote image is served from a local fixture through the native request handler. The check writes a JSON report and a browser-body PNG, then exits.

The initial check incorrectly treated the blank parent-window capture as a capture limitation. The operator then reported a blank body onscreen. Inspection of the pinned GPUI source found `CreateTargetForHwnd(hwnd, true)`. Microsoft documents that `true` places that composition tree above child windows, which covered WebView2 despite a loaded document and visible controller.

Startup now sets `GPUI_DISABLE_DIRECT_COMPOSITION=1` before platform initialization. GPUI uses its supported DirectX HWND swap-chain path instead of the above-children composition tree. The expanded check captures only the synthetic reader's parent window and requires the fixture's blue banner to appear. It failed before the startup change and passed afterward. Browser-only `CapturePreview` remains a separate content check, not proof of onscreen integration. Parent-window `PrintWindow` can still omit GPUI's own GPU header. Neither check uses desktop capture.

Real Gmail rendering, keyboard/focus behavior, screen-reader support, and performance against Electron remain operator/measurement gates. Include all app-owned WebView2 processes in memory comparisons.

## Primary sources

- [Wry 0.57.0 WebViewBuilder](https://docs.rs/wry/0.57.0/wry/struct.WebViewBuilder.html)
- [Wry Windows extension](https://docs.rs/wry/0.57.0/wry/trait.WebViewExtWindows.html)
- [GPUI 0.2.2 Window](https://docs.rs/gpui/0.2.2/gpui/struct.Window.html)
- [Pinned GPUI composition and swap-chain source](https://docs.rs/crate/gpui/0.2.2/source/src/platform/windows/directx_renderer.rs)
- [Pinned GPUI renderer startup configuration](https://docs.rs/crate/gpui/0.2.2/source/src/platform/windows/platform.rs)
- [Microsoft composition target layering](https://learn.microsoft.com/en-us/windows/win32/api/dcomp/nf-dcomp-idcompositiondevice-createtargetforhwnd)
- [Ammonia 4.2.0 Builder](https://docs.rs/ammonia/4.2.0/ammonia/struct.Builder.html)
- [Gmail full-message read](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get)
- [Gmail MIME payload and body storage](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages)
- [Gmail externally stored parts](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages.attachments/get)
- [Microsoft WebView2 security guidance](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/security)
- [WebView2 CapturePreview](https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/win32/icorewebview2#capturepreview)
