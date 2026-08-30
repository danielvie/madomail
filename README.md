# Mado Mail

A desktop Gmail client built with Electron, React, and TypeScript. Mado Mail provides a interface for managing your emails with a focus on speed.

## Features

- **Gmail Integration**: Direct integration with Gmail APIs.
- **Modern UI**: Built with React and Tailwind CSS 4.
- **Cross-Platform**: Desktop support for Windows, macOS, and Linux.
- **Advanced Interactions**: Includes pragmatic drag-and-drop for email organization.

## Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **Frontend**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [electron-vite](https://electron-vite.org/)
- **APIs**: [Google APIs (Gmail)](https://github.com/googleapis/google-api-nodejs-client)

## Documentation

- [Project overview](docs/project-overview.md) — current user workflows, domain model, architecture, and limitations.
- [Domain context](CONTEXT.md) — canonical terminology for Inbox triage, marks, and sender rules.

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm
- **Google API Credentials**: This application requires `client_secret.json` and `token.json` to be present in `$HOME/.mado/mado_mail`.

#### How to setup credentials:

1. Go to the [Google Cloud Console Credentials page](https://console.cloud.google.com/apis/credentials).
2. Create or select a project.
3. Click **Create Credentials** -> **OAuth client ID**.
4. Select **Desktop app** as the application type.
5. Download the JSON file and rename it to `client_secret.json`.
6. Place `client_secret.json` in `$HOME/.mado/mado_mail`.
7. Run the authentication utility (e.g., the associated Go application) to generate the `token.json`.

### Installation

```bash
npm install
```

### Development

To run the application in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

### Build

To build the application for your specific platform:

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

The build artifacts will be located in the `dist` directory.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
