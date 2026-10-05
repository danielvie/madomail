# Mado Mail

A Windows Gmail triage app built with Rust and GPUI. The application lives in `gpui-poc/`; the previous Electron/React project has been removed.

## Requirements

- Stable Rust.
- Visual Studio C++ build tools with a Windows SDK.
- Microsoft Edge WebView2 Runtime for the restricted HTML reader.
- Task, optional. Cargo commands work directly.

## Run and check

```text
task run           # Build and launch with Gmail
task demo          # Synthetic Inbox, no Gmail access or personal settings writes
task reader-demo   # Synthetic HTML reader
task build         # Release executable in gpui-poc/target/release/mado-mail-poc.exe
task test          # Model, settings, OAuth, MIME, and synthetic HTTP tests
task check-triage  # Native UI checks with synthetic mail
task clean         # Remove Rust build artifacts
task --list        # Additional focused UI checks
```

Without Task, run `cargo run --manifest-path gpui-poc/Cargo.toml --release`. Cargo fetches the required Rust dependencies.

## Gmail setup

1. Enable Gmail API in your Google Cloud project and create a Desktop app OAuth client.
2. Save the downloaded JSON at `%USERPROFILE%\.mado\mado-mail\client_secret.json`.
3. Add your account as a test user if the consent app is in Testing.
4. Run the app and choose Connect Gmail. It requests `gmail.modify` permission.

Refresh tokens use Windows Credential Manager. Settings, sender rules, and submission recovery files live in `%USERPROFILE%\.mado\mado-mail`. Removing the old project does not remove personal settings or credentials. Existing exported settings can still be imported through Rules.

## Documentation

- [Application guide](gpui-poc/README.md): controls, settings, recovery, and checks.
- [Project overview](docs/project-overview.md): workflows, architecture, and limitations.
- [Code context](CONTEXT.md): module responsibilities and triage terminology.
- [App icon](docs/app-icon.md): Windows icon assets.

Design and research documents retain migration history. Matched speed and total-memory comparisons against the former Electron app have not been performed.
