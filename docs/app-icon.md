# App icon

The app uses **Signal**, concept 8 from the ten-icon comparison. The user selected it for promotion. A cream circular badge holds a charcoal envelope and an orange unread dot. The dot is part of the artwork, not a live unread count.

The editable source is `build/icon.svg`. Regenerate all platform assets with:

```bash
npm run icons
```

The generator uses the project's installed Electron and adds no dependencies. It writes:

- `build/icon.ico`: Windows, with 16, 24, 32, 48, 64, 128, and 256 pixel representations.
- `build/icon.icns`: macOS, with standard and Retina representations up to 1024 pixels.
- `build/icon.png`: 1024 pixel image for Linux packaging.
- `resources/icon.png`: the same image for Electron windows.

These generated files are checked in, so a regular app build does not need to regenerate icons. `electron-builder.yml` explicitly selects each platform's asset. Windows and Linux windows also receive the PNG through `BrowserWindow`; the packaged macOS Dock icon comes from the ICNS bundle resource.

Build the portable Windows executable with:

```bash
npm run build
npx electron-builder --win portable --x64 --publish never
```

The original comparison gallery and selection verdict are archived on the Git branch `prototype/mail-icon-study`. That branch contains `src/renderer/src/prototype/icons/README.md` and the `npm run prototype:icons` command. The prototype is not part of the production application.
