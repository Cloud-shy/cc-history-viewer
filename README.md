# Claude Code History Viewer

A native Windows desktop app for browsing your Claude Code conversation history. Reads `~/.claude/history.jsonl` and renders conversations as a rich chat interface with markdown, syntax-highlighted code blocks, and collapsible thinking/tool-call sections.

## Features

- Browse conversations grouped by project
- Full-text search across all sessions (`Ctrl+K` shortcut)
- Rich markdown rendering (headings, lists, tables, code blocks with syntax highlighting, inline code)
- Collapsible thinking blocks, tool calls, and tool results
- Reader mode — hides all non-conversation content for distraction-free reading
- Per-block-type visibility toggles (Thinking, Tool Calls, Tool Results, System Events)
- Copy message to clipboard (hover over any message)
- Export conversation as Markdown file
- Delete sessions
- **6 themes** — Forest, Aurora, Sunset, Ocean, Midnight, Moss
- **4 fonts** — Inter, IBM Plex Sans, Lora, Geist Sans (all self-hosted)
- **3 font sizes** — Small (14px), Medium (16px), Large (18px)
- Dark mode
- All settings persisted to local storage

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/) 1.77.2+ (for Tauri builds only)

## Quick Start (Development)

```bash
npm install
npm run dev
```

Opens the app at `http://localhost:5173` in your browser with hot-reload. The dev server proxies API requests to the Express backend on port 3001.

## Build the Desktop App

```bash
npm install
npx tauri build
```

The `.exe` is written to `src-tauri/target/release/cc-history-viewer.exe`.

## How It Works

The app has three layers:

1. **Tauri (Rust)** — Spawns a hidden Node.js process running the Express server, then opens a native WebView2 window pointing at `http://localhost:3001`.
2. **Express (Node.js)** — Reads `~/.claude/history.jsonl`, exposes a REST API, and serves the compiled React frontend.
3. **React (TypeScript)** — Fetches conversation data from the API and renders the chat UI.

## Project Structure

```
├── client/          React frontend (Vite + Tailwind CSS)
│   └── src/
│       ├── api/           HTTP client for the Express API
│       ├── components/    UI components (chat, layout, sidebar, shared)
│       ├── context/       Global state (React Context + useReducer)
│       ├── types/         TypeScript type definitions
│       └── utils/         Date formatting, Markdown export
├── server/          Express backend
│   └── src/
│       ├── routes/        REST API endpoints
│       └── services/      Reads, parses, and manages Claude Code history files
├── src-tauri/       Tauri native shell (Rust)
│   └── src/lib.rs         Spawns server, opens native window
└── scripts/         Build tooling (esbuild bundler for server)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Rust + Tauri v2 |
| Backend | Node.js + Express |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS 3.4 + CSS custom properties (theming) + @tailwindcss/typography |
| Fonts | @fontsource/inter, @fontsource/ibm-plex-sans, @fontsource/lora, @fontsource/geist-sans |
| Markdown | react-markdown + remark-gfm + react-syntax-highlighter (Prism) |
| Bundlers | Vite (frontend), esbuild (server) |
