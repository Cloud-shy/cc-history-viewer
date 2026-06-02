# Claude Code History Viewer

A desktop app for browsing your Claude Code conversation history. Reads `~/.claude/history.jsonl` and renders conversations as a rich, modern chat interface with syntax-highlighted code blocks, collapsible sections, spring-animated transitions, and a three-state sidebar.

## Features

**Navigation & Layout**
- Browse conversations grouped by project in a three-state sidebar (expanded / icon bar / hidden)
- Command palette (`Ctrl+K`) with instant full-text search across all sessions
- Keyboard-driven navigation: `Ctrl+[` / `Ctrl+]` for previous/next session, `Escape` to dismiss

**Chat Experience**
- Rich markdown rendering (headings, lists, tables, code blocks, inline code)
- Code blocks with JetBrains Mono at 15px, language header bar, and one-click copy
- Collapsible thinking blocks, tool calls, and tool results
- Reader mode — hides all non-conversation content for distraction-free reading
- Message grouping — consecutive same-role messages are visually combined
- Staggered entry animation with skeleton loader on session load
- Scroll-to-bottom floating button (appears when scrolled up)

**Session Management**
- Rename sessions (inline edit or `F2`)
- Star/favorite sessions for quick access
- Export conversations as Markdown (`Ctrl+E`)
- Delete sessions with confirmation
- Right-click context menu on any session

**Visual Customization**
- 6 themes — Forest, Aurora, Sunset, Ocean, Midnight, Moss
- 5 fonts — Inter, IBM Plex Sans, Lora, Geist Sans (body), JetBrains Mono (code)
- 3 font sizes — Small (14px), Medium (16px), Large (18px)
- Dark mode toggle
- All settings persisted to localStorage

**Polish**
- Spring-based CSS motion system (cubic-bezier with overshoot)
- Depth/layering system with 5 z-index levels and per-level shadow scale
- Backdrop blur on overlays and panels
- Toast notifications for actions
- All SVG icons via Lucide React (tree-shakeable)

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/) 1.77.2+ (only for building the Tauri desktop app)

## Quick Start (Development)

```bash
# Install dependencies (from repo root)
npm install

# Start both server and client with hot reload
npm run dev
```

Opens the client at `http://localhost:5173` with hot-reload via Vite. API requests are proxied to the Express server on port 3001.

## Build

```bash
# Build the React frontend (tsc + vite)
npm run build

# Bundle the Express server (esbuild)
npm run build:server

# Run the production build
npm start
```

The Express server at port 3001 serves both the API and the compiled React frontend.

## Desktop App (Tauri)

```bash
npx tauri build
```

Produces `cc-history-viewer.exe` in `src-tauri/target/release/`. The Tauri shell spawns the Express server as a hidden Node.js process and opens a native WebView2 window.

## Architecture

```
Tauri (Rust)                Express (Node.js)            React (TypeScript)
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────────┐
│ Spawns server    │ ──►    │ REST API         │ ◄───  │ Chat UI              │
│ Native window    │        │ Serves static    │        │ Sidebar navigation   │
│ WebView2         │        │ Reads            │        │ Search & filtering   │
│                 │        │ ~/.claude/       │        │ Theming & settings   │
│                 │        │ history.jsonl    │        │ Markdown rendering   │
└─────────────────┘        └─────────────────┘        └─────────────────────┘
```

1. **Tauri** — Spawns a hidden Node.js process running the Express server, then opens a native window pointing at `http://localhost:3001`.
2. **Express** — Reads `~/.claude/history.jsonl`, exposes a REST API, manages session metadata (`.meta.json`), and serves the compiled React frontend.
3. **React** — Fetches data from the API and renders the chat interface with theming, animations, and keyboard shortcuts.

## Project Structure

```
├── client/                React frontend (Vite + Tailwind CSS 3.4)
│   └── src/
│       ├── api/                 HTTP client for the Express API
│       ├── components/
│       │   ├── chat/              Message rendering (assistant, user, system, tool calls)
│       │   ├── layout/            Shell, Sidebar, MainPanel
│       │   ├── shared/            CommandPalette, FilterBar, Settings, ContextMenu, Toast
│       │   └── sidebar/           SearchBar, SessionList
│       ├── context/             Global state (React Context + useReducer)
│       ├── types/               TypeScript type definitions
│       └── utils/               Date formatting, Markdown export, syntax theme
├── server/                Express backend
│   └── src/
│       ├── routes/              /api/projects, /api/sessions, /api/search
│       ├── services/            historyReader, projectScanner, sessionMetadata, transcriptReader
│       ├── middleware/           Error handler
│       └── types/               Server type definitions
├── src-tauri/             Tauri native shell (Rust)
├── scripts/               esbuild bundler for server
└── dist-server/           Compiled server output (committed for Tauri bundling)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Rust + Tauri v2 |
| Backend | Node.js + Express |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS 3.4 + CSS custom properties |
| Fonts | @fontsource (self-hosted) |
| Icons | Lucide React |
| Markdown | react-markdown + remark-gfm + react-syntax-highlighter (Prism) |
| Bundlers | Vite (frontend), esbuild (server) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle sidebar (expanded / icon bar) |
| `Ctrl+Shift+B` | Toggle sidebar hidden |
| `Ctrl+K` | Open command palette |
| `Ctrl+E` | Export current session as Markdown |
| `Ctrl+[` / `Ctrl+]` | Previous / next session |
| `Ctrl+Shift+F` | Toggle reader mode |
| `F2` | Rename selected session |
| `Delete` | Delete selected session |
| `Escape` | Close overlay / clear selection |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/projects` | List all projects with session counts |
| `GET` | `/api/projects/:projectId/sessions` | List sessions for a project |
| `GET` | `/api/sessions/:projectId/:sessionId` | Get session transcript |
| `PATCH` | `/api/sessions/:projectId/:sessionId` | Update session metadata (title, starred) |
| `DELETE` | `/api/sessions/:projectId/:sessionId` | Delete a session |
| `GET` | `/api/search?q=query` | Full-text search across all sessions |
