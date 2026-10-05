# App icon

The app uses Signal, concept 8 from the ten-icon comparison. A cream circular badge holds a charcoal envelope and an orange unread dot. The dot is artwork, not a live unread count.

- `build/icon.svg` is the editable source.
- `build/icon.ico` is the checked-in Windows icon with 16, 24, 32, 48, 64, 128, and 256 pixel representations.

`build.rs` embeds the icon through `build/app.rc` for the executable, taskbar, and native windows. A regular Rust build needs no icon generator or separate runtime icon file.

Build with `task build`; the executable is `target/release/mado-mail.exe`.

The original comparison gallery and selection verdict remain on the Git branch `prototype/mail-icon-study`.
