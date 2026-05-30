# UI Upgrade Design

## Summary

Upgrade the CC History Viewer with fluid spring-based motion, a three-state collapsible sidebar, larger code blocks, a depth/layering system, and UX refinements (command palette search, keyboard navigation, message grouping, loading skeletons). Keep the existing sidebar + main panel layout — evolve it, don't replace it.

---

## 1. Motion System

All animations use CSS custom properties so durations and easings are centralized.

### Tokens

```css
--duration-fast:   150ms;   /* hover, icon, toggle */
--duration-normal: 240ms;   /* sidebar, panel, filter */
--duration-slow:   350ms;   /* modal, page transition */
--ease-spring:     cubic-bezier(0.34, 1.56, 0.64, 1);  /* panels, sidebar */
--ease-out:        cubic-bezier(0.16, 1, 0.3, 1);       /* reveal, appear */
--ease-in:         cubic-bezier(0.4, 0, 1, 1);          /* hide, dismiss */
```

### Where motion applies

| Target | Property | Duration | Easing | Notes |
|--------|----------|----------|--------|-------|
| Sidebar collapse | width | 240ms | spring | Text fades at 100ms before width shrinks |
| Message entry | opacity + translateY(8px → 0) | 200ms | ease-out | 30ms stagger per message, cap at 15 |
| Panel open (settings, palette) | opacity + scale(0.95 → 1) | 240ms | spring | With backdrop blur transition |
| Panel close | opacity + scale(1 → 0.97) | 200ms | ease-in | |
| Filter toggle | background-color | 150ms | ease-out | |
| Hover | background, color, box-shadow | 150ms | ease-out | All interactive surfaces |
| Code copy button | scale + checkmark icon swap | 150ms | spring | Button bounces on confirm |
| Scroll to message | scroll-behavior: smooth | — | — | Native smooth scroll |

### Staggered message reveal

Messages animate in from below with opacity. A `--message-index` CSS variable drives the delay:
- Delay = `min(index, 15) * 30ms`
- Uses `animation-fill-mode: backwards` so unseen messages are invisible until their slot
- After message 15, no more stagger (all remaining appear at 450ms)

---

## 2. Collapsible Sidebar

Three states managed by a `sidebarState` value in AppContext: `'expanded' | 'icons' | 'hidden'`.

### Expanded (320px, default)

Full sidebar: search bar, scrollable project list with session children, settings gear at bottom. This is the current sidebar — no layout changes.

### Icon bar (56px)

- Narrow vertical strip of centered icons
- One icon per project (first letter or emoji avatar)
- Selected project icon gets accent background
- Hovering an icon spawns a floating tooltip panel (delayed 200ms) showing the project name and session count
- Star icon in sidebar header shows count
- Search opens as a floating command palette (see §4) instead of inline
- Settings gear at bottom

### Hidden (0px)

- Sidebar fully retracted
- A 4px wide hover zone on the left edge of the screen
- Hovering the zone reveals a slim handle; clicking restores icon bar
- `Ctrl+Shift+B` to toggle hidden, `Ctrl+B` to toggle expanded ↔ icons

### Transition behavior

- Width animated with `--ease-spring` over 240ms
- Text/labels fade out (opacity → 0, 100ms, `--ease-in`) before the width shrinks
- Icons remain visible throughout
- On expand: icons appear first, then text fades in after width settles

---

## 3. Code Block Upgrade

### Font

- Primary: JetBrains Mono (`@fontsource/jetbrains-mono`, weight 400 + 500)
- Fallback: `'Cascadia Code', 'Fira Code', 'SF Mono', Menlo, monospace`
- Ligatures: enabled via `font-variant-ligatures` CSS
- Font weight 400 for body, 500 for keywords in syntax highlighting

### Sizing

| Element | Before | After |
|---------|--------|-------|
| Code block font | ~13px | **15px** |
| Inline code font | ~13px | **14px** |
| Block line-height | ~1.4 | **1.6** |
| Inline line-height | inherit | **1.5** |
| Block padding | 12px | **16px 16px** |

### Styling

- Border-radius: 8px (keep existing)
- Max-height: 600px with `overflow-y: auto`
- Each block gets a header bar with language label (left) and copy button (right)
- Header bar: 28px tall, subtle background, matches theme's `--code-border`
- Copy button: icon-only, appears on block hover, shows checkmark for 2s after click
- Inline code: `--inline-code-bg` background, 4px horizontal padding, 2px border-radius

### Syntax highlighting

- Keep Prism via `react-syntax-highlighter`
- Create a custom Prism theme object that reads from CSS variables:
  - `--syntax-keyword`, `--syntax-string`, `--syntax-comment`, `--syntax-function`, `--syntax-number`, `--syntax-operator`
- These variables are defined per-theme in `index.css`, one set for light, one overridden in `html.dark`
- Single light + single dark variant — no per-color-theme syntax palettes

### Implementation notes

- Add `@fontsource/jetbrains-mono` to client/package.json
- Import weights 400 and 500 in index.css
- Create `client/src/components/chat/CodeBlock.tsx` extracting the code rendering from AssistantMessage
- The syntax theme object lives in `client/src/utils/syntaxTheme.ts`

---

## 4. Depth & Layering

Z-space hierarchy to create the "layered and spatial" feel.

```
--z-base:      0     /* background gradient */
--z-surface:   10    /* message bubbles, sidebar items, filter pills */
--z-panel:     20    /* header, icon sidebar, search palette backdrop */
--z-overlay:   30    /* settings modal, command palette, context menus, tooltips */
--z-toast:     40    /* toast notifications */
```

Shadow scale (light mode):

| Layer | Shadow |
|-------|--------|
| surface | `0 1px 3px rgba(0,0,0,0.06)` |
| panel | `0 4px 12px rgba(0,0,0,0.08)` + `backdrop-filter: blur(12px)` |
| overlay | `0 8px 30px rgba(0,0,0,0.12)` + `backdrop-filter: blur(16px)` |
| toast | `0 4px 16px rgba(0,0,0,0.10)` + `backdrop-filter: blur(16px)` |

Dark mode versions: same structure, darker shadow colors (`rgba(0,0,0,0.3)` to `0.5`).

All components reference `var(--z-*)` — no raw z-index numbers.

---

## 5. UX Refinements

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Toggle sidebar (expanded ↔ icons) |
| `Ctrl+Shift+B` | Toggle sidebar hidden |
| `Ctrl+K` | Open command palette (search) |
| `F2` | Rename selected session (existing) |
| `Delete` | Delete selected session (existing) |
| `Escape` | Close overlay / clear selection |
| `Ctrl+E` | Export session as .md |
| `Ctrl+[` / `Ctrl+]` | Previous / next session |
| `Ctrl+Shift+F` | Toggle reader mode |
| `Space` | Scroll one page down in transcript |
| `Ctrl+Home` | Scroll to top of transcript |

### Command palette (search)

- `Ctrl+K` opens a centered floating overlay (520px wide, max 60vh)
- Input auto-focused on open
- Results grouped by project as user types, 3 matches per project max
- Arrow keys navigate, Enter selects session, Escape dismisses
- Shows "No results for '{query}'" when empty
- Backdrop blur + `--overlay` shadow
- 240ms spring-in animation, 200ms ease-in dismiss

### Message grouping

- Consecutive messages of the same role (e.g., Assistant → Assistant) are visually grouped
- Reduced gap between grouped messages (8px vs 20px normal)
- No repeated avatar/timestamp within a group
- Tool use → tool result pairs are indented and grouped together

### Empty states

- No projects: icon + "No Claude Code history found" + "Start a conversation with Claude Code first."
- Project with no sessions: "No sessions in this project"
- Search with no results: "No results for '{query}'" + suggestion text
- Session with no messages: "This session is empty"

### Loading states

- Session list: skeleton placeholders (3 pulsing gray rectangles with subtle shimmer)
- Transcript: shows loaded count vs total as it streams ("Loaded 200 of 1200 events...")
- Project list: single skeleton row while loading

### Transcript scroll

- "Scroll to bottom" floating button appears when scrolled up > 200px
- Auto-scrolls to bottom on new session load
- Respects user scroll position (doesn't force-scroll if user is reading earlier messages)
- Smooth scroll to target message when using keyboard nav

---

## 6. Implementation Scope

### What stays
- All 6 themes and their CSS variables
- Font family choices (Inter, Plex, Lora, Geist) — JetBrains Mono added only for code
- Font size options (14/16/18px)
- Dark mode toggle
- Reader mode and filter toggles (Thinking, Tool Calls, Results, System)
- Context menu, toast, inline edit (WIP components in working tree)
- Session metadata (rename, star, delete)
- Markdown export
- Server-side project scanning and transcript reading
- Tauri desktop shell

### What changes
| File | Change |
|------|--------|
| `client/src/index.css` | Add motion tokens, z-index tokens, shadow scale, code block sizing, JetBrains Mono import, syntax theme vars, animation keyframes |
| `client/src/components/layout/Shell.tsx` | Wire keyboard shortcuts, render sidebar in correct state |
| `client/src/components/layout/Sidebar.tsx` | Three-state rendering (expanded/icon bar/hidden), collapse button, hover tooltips for icon bar, transition logic |
| `client/src/components/layout/MainPanel.tsx` | Add edge hover zone for hidden sidebar, scroll-to-bottom button |
| `client/src/components/chat/ChatWindow.tsx` | Message grouping logic, staggered entry animation, scroll-to-bottom button, loading skeleton, empty states |
| `client/src/components/chat/AssistantMessage.tsx` | Extract code rendering to new CodeBlock component |
| `client/src/components/chat/CodeBlock.tsx` | **New** — Code block with header bar, copy button, larger font, max-height, syntax theme |
| `client/src/components/shared/FilterBar.tsx` | Transition polish (150ms morph) |
| `client/src/components/shared/SearchBar.tsx` | Replace with command palette (`client/src/components/shared/CommandPalette.tsx`) |
| `client/src/components/shared/CommandPalette.tsx` | **New** — Floating search overlay, grouped results, keyboard nav |
| `client/src/context/AppContext.tsx` | Add `sidebarState`, `commandPaletteOpen`, scroll position actions, message grouping helpers |
| `client/src/types/index.ts` | Add `SidebarState` type |
| `client/package.json` | Add `@fontsource/jetbrains-mono` |
| `client/src/utils/syntaxTheme.ts` | **New** — Prism theme object using CSS variables |

### What stays out
- No layout rearchitecture (keep sidebar + main panel)
- No per-theme syntax highlighting palettes
- No virtual scrolling (complexity not justified by typical session size)
- No drag-to-resize sidebar (added complexity; collapsed states address the space concern)
- No route-based navigation (single page is fine)
