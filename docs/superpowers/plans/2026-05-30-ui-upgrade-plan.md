# UI Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add fluid spring-based motion, three-state collapsible sidebar, larger code blocks with JetBrains Mono, spatial depth layering, command palette search, and UX refinements to the CC History Viewer.

**Architecture:** Keep the existing React Context + useReducer state pattern. Add `sidebarState` and `commandPaletteOpen` to AppState. Extract code rendering into a standalone CodeBlock component. Replace inline SearchBar with a floating CommandPalette overlay. Use CSS custom properties for all motion tokens, z-index layers, and shadow scales. Replace inline SVG icons with Lucide React components.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3.4, CSS custom properties, Lucide React (icons), JetBrains Mono (code font), react-syntax-highlighter (Prism)

---

## File Map

| File | Role |
|------|------|
| `client/package.json` | Add lucide-react, @fontsource/jetbrains-mono |
| `client/src/index.css` | Motion tokens, z-index, shadow scale, code sizing, font import, syntax theme vars, animation keyframes |
| `client/src/types/index.ts` | Add `SidebarState` type |
| `client/src/context/AppContext.tsx` | Add `sidebarState`, `commandPaletteOpen` fields, actions, reducer cases |
| `client/src/utils/syntaxTheme.ts` | **New** — Prism theme object using CSS variables |
| `client/src/components/chat/CodeBlock.tsx` | **New** — Code block with header bar, copy button, 15px font, max-height |
| `client/src/components/shared/CommandPalette.tsx` | **New** — Floating search overlay, grouped results, keyboard nav |
| `client/src/components/chat/TextBlock.tsx` | Replace inline code rendering with CodeBlock component |
| `client/src/components/chat/ChatWindow.tsx` | Message grouping, stagger animation, scroll-to-bottom button, skeleton loader, empty states |
| `client/src/components/chat/AssistantMessage.tsx` | Extract code rendering, add animation delay prop, grouping styles |
| `client/src/components/chat/UserMessage.tsx` | Add animation delay prop, grouping styles |
| `client/src/components/layout/Shell.tsx` | Expanded keyboard shortcuts, sidebar state wiring |
| `client/src/components/layout/Sidebar.tsx` | Three-state rendering, collapse button, icon bar, hover tooltips |
| `client/src/components/layout/MainPanel.tsx` | Edge hover zone for hidden sidebar, scroll button |
| `client/src/components/shared/FilterBar.tsx` | Transition polish, Lucide icons |
| `client/src/components/sidebar/SearchBar.tsx` | Redirect Ctrl+K to command palette |

---

### Task 1: Install new dependencies

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Add dependencies**

```bash
cd client && npm install lucide-react @fontsource/jetbrains-mono
```

- [ ] **Step 2: Verify versions in package.json**

Run: `bash -c "node -e \"const p = require('./client/package.json'); console.log('lucide-react:', p.dependencies['lucide-react']); console.log('jetbrains-mono:', p.dependencies['@fontsource/jetbrains-mono']);\""`

Expected: Both packages show version numbers.

- [ ] **Step 3: Commit**

```bash
git add client/package.json client/package-lock.json
git commit -m "chore: add lucide-react and JetBrains Mono font dependency"
```

---

### Task 2: CSS foundation — motion tokens, z-index, shadows, code sizing

**Files:**
- Modify: `client/src/index.css`

- [ ] **Step 1: Add JetBrains Mono import**

After the existing font imports (after line 12), insert:

```css
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
```

- [ ] **Step 2: Add motion tokens, z-index, shadow scale after the `:root` block (after line 599)**

Insert after the closing `}` of `:root`:

```css
/* ---- Motion tokens ---- */
:root {
  --duration-fast: 150ms;
  --duration-normal: 240ms;
  --duration-slow: 350ms;
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}

/* ---- Z-index scale ---- */
:root {
  --z-base: 0;
  --z-surface: 10;
  --z-panel: 20;
  --z-overlay: 30;
  --z-toast: 40;
}

/* ---- Shadow scale ---- */
:root {
  --shadow-surface: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-panel: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-overlay: 0 8px 30px rgba(0,0,0,0.12);
  --shadow-toast: 0 4px 16px rgba(0,0,0,0.10);
}

html.dark {
  --shadow-surface: 0 1px 3px rgba(0,0,0,0.30);
  --shadow-panel: 0 4px 12px rgba(0,0,0,0.40);
  --shadow-overlay: 0 8px 30px rgba(0,0,0,0.50);
  --shadow-toast: 0 4px 16px rgba(0,0,0,0.35);
}
```

- [ ] **Step 3: Update the font-mono variable in `:root` (line 583)**

Replace:
```css
--font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Menlo, monospace;
```

With:
```css
--font-mono: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'SF Mono', Menlo, monospace;
```

- [ ] **Step 4: Add syntax theme CSS variables into `:root` (append after shadow scale)**

```css
/* ---- Syntax highlighting token colors ---- */
:root {
  --syntax-keyword: #7c3aed;
  --syntax-string: #059669;
  --syntax-comment: #a8a29e;
  --syntax-function: #2563eb;
  --syntax-number: #d97706;
  --syntax-operator: #475569;
  --syntax-property: #0891b2;
  --syntax-punctuation: #78716c;
  --syntax-boolean: #dc2626;
  --syntax-selector: #4f46e5;
  --syntax-variable: #334155;
}

html.dark {
  --syntax-keyword: #c4b5fd;
  --syntax-string: #6ee7b7;
  --syntax-comment: #78716c;
  --syntax-function: #93c5fd;
  --syntax-number: #fcd34d;
  --syntax-operator: #94a3b8;
  --syntax-property: #67e8f9;
  --syntax-punctuation: #a8a29e;
  --syntax-boolean: #fca5a5;
  --syntax-selector: #a5b4fc;
  --syntax-variable: #e2e8f0;
}
```

- [ ] **Step 5: Add new animation keyframes after the existing keyframes (after line 610)**

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes messageIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

- [ ] **Step 6: Add code block sizing and sidebar transition utilities at end of file**

```css
/* ---- Sidebar transition ---- */
.sidebar-transition {
  transition: width var(--duration-normal) var(--ease-spring);
}

.sidebar-text-fade {
  transition: opacity 100ms var(--ease-in);
}

/* ---- Message grouping ---- */
.message-group .message-bubble {
  margin-top: 8px;
}

.message-group .message-bubble:first-child {
  margin-top: 20px;
}

/* ---- Skeleton loader ---- */
.skeleton {
  background: linear-gradient(90deg, var(--skeleton-from, #e7e5e4) 25%, var(--skeleton-to, #d6d3d1) 50%, var(--skeleton-from, #e7e5e4) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 4px;
}

:root { --skeleton-from: #e7e5e4; --skeleton-to: #d6d3d1; }

html.dark { --skeleton-from: #334155; --skeleton-to: #475569; }
```

- [ ] **Step 7: Commit**

```bash
git add client/src/index.css
git commit -m "feat: add motion tokens, z-index scale, shadows, syntax vars, JetBrains Mono, and animation keyframes"
```

---

### Task 3: Add SidebarState type and update AppContext

**Files:**
- Modify: `client/src/types/index.ts`
- Modify: `client/src/context/AppContext.tsx`

- [ ] **Step 1: Add SidebarState type**

In `client/src/types/index.ts`, add after the existing imports:

```typescript
export type SidebarState = 'expanded' | 'icons' | 'hidden';
```

- [ ] **Step 2: Add new fields to AppState**

In `client/src/context/AppContext.tsx`, add to the `AppState` interface (after `contextMenu` on line 40):

```typescript
sidebarState: SidebarState;
commandPaletteOpen: boolean;
```

Also import `SidebarState` at top:

```typescript
import type { Project, Session, SearchResult, FilterState, SidebarState } from '../types';
```

- [ ] **Step 3: Add new state fields to initialState**

In `initialState` (after line 111, after `contextMenu: null`):

```typescript
sidebarState: 'expanded' as SidebarState,
commandPaletteOpen: false,
```

- [ ] **Step 4: Add new action types**

Add to the `Action` union type (after line 68):

```typescript
| { type: 'SET_SIDEBAR_STATE'; state: SidebarState }
| { type: 'TOGGLE_COMMAND_PALETTE' }
| { type: 'CLOSE_COMMAND_PALETTE' }
```

- [ ] **Step 5: Add reducer cases**

Add to the reducer function's switch statement (before `default:` on line 194):

```typescript
case 'SET_SIDEBAR_STATE':
  return { ...state, sidebarState: action.state };
case 'TOGGLE_COMMAND_PALETTE':
  return { ...state, commandPaletteOpen: !state.commandPaletteOpen };
case 'CLOSE_COMMAND_PALETTE':
  return { ...state, commandPaletteOpen: false };
```

- [ ] **Step 6: Commit**

```bash
git add client/src/types/index.ts client/src/context/AppContext.tsx
git commit -m "feat: add SidebarState type and sidebar/command palette actions to AppContext"
```

---

### Task 4: Create syntax theme utility

**Files:**
- Create: `client/src/utils/syntaxTheme.ts`

- [ ] **Step 1: Write the syntax theme file**

```typescript
// Prism syntax highlighting theme driven by CSS variables.
// The actual color values are defined in index.css per theme + dark mode.

const cssVar = (name: string, fallback: string): string =>
  `var(--syntax-${name}, ${fallback})`;

export const lightTheme = {
  'code[class*="language-"]': {
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    lineHeight: '1.6',
    direction: 'ltr',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: '2',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0',
    padding: '0',
    overflow: 'auto',
  },
  comment: { color: cssVar('comment', '#a8a29e'), fontStyle: 'italic' },
  prolog: { color: cssVar('comment', '#a8a29e') },
  doctype: { color: cssVar('comment', '#a8a29e') },
  cdata: { color: cssVar('comment', '#a8a29e') },
  punctuation: { color: cssVar('punctuation', '#78716c') },
  property: { color: cssVar('property', '#0891b2') },
  tag: { color: cssVar('keyword', '#7c3aed') },
  boolean: { color: cssVar('boolean', '#dc2626') },
  number: { color: cssVar('number', '#d97706') },
  constant: { color: cssVar('number', '#d97706') },
  symbol: { color: cssVar('keyword', '#7c3aed') },
  selector: { color: cssVar('selector', '#4f46e5') },
  'attr-name': { color: cssVar('property', '#0891b2') },
  string: { color: cssVar('string', '#059669') },
  char: { color: cssVar('string', '#059669') },
  builtin: { color: cssVar('keyword', '#7c3aed') },
  operator: { color: cssVar('operator', '#475569') },
  entity: { color: cssVar('keyword', '#7c3aed'), cursor: 'help' },
  url: { color: cssVar('string', '#059669') },
  'attr-value': { color: cssVar('string', '#059669') },
  keyword: { color: cssVar('keyword', '#7c3aed') },
  function: { color: cssVar('function', '#2563eb') },
  'class-name': { color: cssVar('function', '#2563eb') },
  regex: { color: cssVar('string', '#059669') },
  important: { color: cssVar('boolean', '#dc2626'), fontWeight: 'bold' },
  variable: { color: cssVar('variable', '#334155') },
  italic: { fontStyle: 'italic' },
  bold: { fontWeight: 'bold' },
  inserted: { color: cssVar('string', '#059669') },
  deleted: { color: cssVar('boolean', '#dc2626') },
};

export type PrismTheme = typeof lightTheme;
```

- [ ] **Step 2: Commit**

```bash
git add client/src/utils/syntaxTheme.ts
git commit -m "feat: add CSS-variable-driven Prism syntax theme"
```

---

### Task 5: Create CodeBlock component

**Files:**
- Create: `client/src/components/chat/CodeBlock.tsx`

- [ ] **Step 1: Write CodeBlock component**

```tsx
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { lightTheme } from '../../utils/syntaxTheme';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="relative group my-3 rounded-xl overflow-hidden border"
      style={{
        borderColor: 'var(--code-border)',
        boxShadow: 'var(--shadow-surface)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 text-xs font-medium border-b"
        style={{
          backgroundColor: 'var(--code-bg)',
          borderColor: 'var(--code-border)',
          color: 'var(--header-text)',
        }}
      >
        <span className="uppercase tracking-wider opacity-50">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100"
          style={{ color: 'var(--header-text)' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={lightTheme}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0',
          fontSize: '15px',
          lineHeight: '1.6',
          padding: '16px',
          maxHeight: '600px',
          overflowY: 'auto',
          backgroundColor: 'var(--code-bg)',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/chat/CodeBlock.tsx
git commit -m "feat: add CodeBlock component with header bar, copy button, and larger font"
```

---

### Task 6: Wire CodeBlock into TextBlock

**Files:**
- Modify: `client/src/components/chat/TextBlock.tsx`

- [ ] **Step 1: Replace inline code rendering in TextBlock**

Replace the `code` renderer inside the `ReactMarkdown` components in `client/src/components/chat/TextBlock.tsx`. The current code block rendering (lines 37-64) gets replaced with the new CodeBlock component.

Import CodeBlock at the top:
```typescript
import { CodeBlock } from './CodeBlock';
```

Replace the existing code block return JSX (lines 37-64 — the `!isInline` branch):

```tsx
return (
  <CodeBlock language={match?.[1] || 'text'} code={codeStr} />
);
```

Also increase inline code font-size from `0.875em` to `0.925em` on line 24:

```tsx
className="px-1.5 py-0.5 rounded-md text-[0.925em] font-mono border"
```

- [ ] **Step 2: Remove unused imports**

Remove the `SyntaxHighlighter` and `oneDark` imports from TextBlock.tsx (lines 3-4):
```typescript
// Remove these lines:
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/chat/TextBlock.tsx
git commit -m "feat: use CodeBlock component in TextBlock, increase inline code font size"
```

---

### Task 7: Create CommandPalette component

**Files:**
- Create: `client/src/components/shared/CommandPalette.tsx`

- [ ] **Step 1: Write CommandPalette component**

```tsx
import { useEffect, useRef } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';
import { Search } from 'lucide-react';

export function CommandPalette() {
  const { state, dispatch } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (state.commandPaletteOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [state.commandPaletteOpen]);

  // Debounced search
  useEffect(() => {
    if (!state.searchQuery || !state.commandPaletteOpen) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      api.search(state.searchQuery)
        .then((data) => dispatch({ type: 'SET_SEARCH_RESULTS', results: data.results }))
        .catch(() => {});
    }, 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.searchQuery, state.commandPaletteOpen, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
      }
      if (e.key === 'Escape' && state.commandPaletteOpen) {
        dispatch({ type: 'CLOSE_COMMAND_PALETTE' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.commandPaletteOpen, dispatch]);

  if (!state.commandPaletteOpen) return null;

  const grouped = groupResults(state.searchResults, state.projects);

  const handleSelect = (projectId: string, sessionId: string) => {
    dispatch({ type: 'SELECT_SESSION', projectId, sessionId });
    dispatch({ type: 'CLOSE_COMMAND_PALETTE' });
  };

  const handleKeyDown = (e: React.KeyboardEvent, projectId: string, sessionId: string) => {
    if (e.key === 'Enter') {
      handleSelect(projectId, sessionId);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[15vh]"
      style={{ zIndex: 'var(--z-overlay)' }}
      onClick={() => dispatch({ type: 'CLOSE_COMMAND_PALETTE' })}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn var(--duration-fast) var(--ease-out)',
        }}
      />

      {/* Palette */}
      <div
        className="relative w-[520px] max-h-[60vh] flex flex-col shadow-2xl border overflow-hidden animate-[scaleIn_240ms_var(--ease-spring)]"
        style={{
          backgroundColor: 'var(--context-menu-bg)',
          borderColor: 'var(--context-menu-border)',
          boxShadow: 'var(--shadow-overlay)',
          backdropFilter: 'blur(16px)',
          animation: 'scaleIn var(--duration-normal) var(--ease-spring)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--context-menu-border)' }}
        >
          <Search size={18} style={{ color: 'var(--header-text)', opacity: 0.5 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across all sessions..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })}
            className="flex-1 bg-transparent border-none outline-none text-base"
            style={{ color: 'var(--context-menu-text)' }}
          />
          <kbd
            className="px-2 py-0.5 rounded text-[10px] font-mono"
            style={{
              backgroundColor: 'var(--filter-active-bg)',
              color: 'var(--header-text)',
              border: '1px solid var(--filter-sep)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-2">
          {!state.searchQuery && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--empty-subtitle)' }}>
              Type to search across all projects and sessions
            </div>
          )}

          {state.searchQuery && grouped.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--empty-subtitle)' }}>
              No results for "{state.searchQuery}"
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.projectId}>
              <div
                className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--header-text)', opacity: 0.5 }}
              >
                {group.projectName}
              </div>
              {group.sessions.slice(0, 3).map((s) => (
                <button
                  key={`${group.projectId}-${s.sessionId}`}
                  onClick={() => handleSelect(group.projectId, s.sessionId)}
                  onKeyDown={(e) => handleKeyDown(e, group.projectId, s.sessionId)}
                  className="w-full text-left px-6 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--context-menu-text)' }}
                >
                  <div className="truncate font-medium">{s.title || s.matchSnippet || 'Untitled'}</div>
                  {s.timestamp && (
                    <div className="text-xs mt-0.5 opacity-40">
                      {new Date(s.timestamp).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function groupResults(
  results: { projectId: string; sessionId: string; title: string | null; timestamp: string | null; matchSnippet: string }[] | null,
  projects: { id: string; shortName: string }[]
) {
  if (!results || results.length === 0) return [];
  const map = new Map<string, typeof results>();
  for (const r of results) {
    const arr = map.get(r.projectId) || [];
    arr.push(r);
    map.set(r.projectId, arr);
  }
  return Array.from(map.entries()).map(([projectId, sessions]) => {
    const project = projects.find((p) => p.id === projectId);
    return { projectId, projectName: project?.shortName || projectId, sessions };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/shared/CommandPalette.tsx
git commit -m "feat: add CommandPalette floating search overlay with grouped results and keyboard nav"
```

---

### Task 8: Update SearchBar to defer to CommandPalette

**Files:**
- Modify: `client/src/components/sidebar/SearchBar.tsx`

- [ ] **Step 1: Simplify SearchBar to only focus on Ctrl+K → open CommandPalette, and E2 inline edit support**

Replace the SearchBar content to delegate Ctrl+K to the command palette. Keep the inline search input for the sidebar search since it also works for sidebar filtering.

Actually, since Ctrl+K now opens the command palette, the SearchBar becomes a secondary interaction. Click on it opens the palette. Keep the inline sidebar search functional.

Replace the SearchBar component:

```tsx
import { useRef } from 'react';
import { useAppState } from '../../context/AppContext';

export function SearchBar() {
  const { state, dispatch } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
    inputRef.current?.blur();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search (Ctrl+K)..."
      onFocus={handleFocus}
      readOnly
      className="w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 cursor-pointer"
      style={{
        backgroundColor: 'var(--sidebar-search-bg)',
        borderColor: 'var(--sidebar-search-border)',
        color: 'var(--sidebar-search-text)',
        ['--tw-ring-color' as any]: 'var(--sidebar-search-focus-ring)',
      }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/sidebar/SearchBar.tsx
git commit -m "feat: SearchBar opens CommandPalette on focus, Ctrl+K handled by CommandPalette"
```

---

### Task 9: Three-state collapsible Sidebar

**Files:**
- Modify: `client/src/components/layout/Sidebar.tsx`

This is the largest change. The Sidebar needs to render three different layouts depending on `sidebarState`.

- [ ] **Step 1: Rewrite Sidebar.tsx with three-state rendering**

```tsx
import { useEffect, useState, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';
import { SearchBar } from '../sidebar/SearchBar';
import { SessionList } from '../sidebar/SessionList';
import { ContextMenu } from '../shared/ContextMenu';
import {
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  Star,
  Settings,
  Folder,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export function Sidebar() {
  const { state, dispatch, showToast } = useAppState();
  const [tooltipProject, setTooltipProject] = useState<string | null>(null);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', key: 'projects', value: true });
    api.getProjects()
      .then((data) => dispatch({ type: 'SET_PROJECTS', projects: data.projects }))
      .catch((err) => dispatch({ type: 'SET_ERROR', error: err.message }));
  }, [dispatch]);

  const handleProjectClick = (projectId: string) => {
    dispatch({ type: 'SELECT_PROJECT', projectId });
    api.getSessions(projectId)
      .then((data) => dispatch({ type: 'SET_SESSIONS', sessions: data.sessions }))
      .catch((err) => dispatch({ type: 'SET_ERROR', error: err.message }));
  };

  const handleSessionClick = (projectId: string, sessionId: string) => {
    dispatch({ type: 'SELECT_SESSION', projectId, sessionId });
  };

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, projectId: string, sessionId: string, title: string | null) => {
      e.preventDefault();
      dispatch({
        type: 'SHOW_CONTEXT_MENU',
        menu: { x: e.clientX, y: e.clientY, projectId, sessionId, title },
      });
    },
    [dispatch]
  );

  const handleRename = useCallback(
    async (projectId: string, sessionId: string, newTitle: string) => {
      try {
        await api.updateSession(projectId, sessionId, { title: newTitle });
        dispatch({ type: 'RENAME_SESSION', sessionId, title: newTitle });
        showToast('Session renamed');
      } catch (err: any) {
        showToast(err?.message || 'Failed to rename session', 'error');
      }
    },
    [dispatch, showToast]
  );

  const handleToggleStar = useCallback(
    async (projectId: string, sessionId: string, currentStarred: boolean) => {
      try {
        await api.updateSession(projectId, sessionId, { starred: !currentStarred });
        dispatch({ type: 'TOGGLE_STAR_SESSION', sessionId });
        showToast(currentStarred ? 'Removed from favorites' : 'Added to favorites');
      } catch (err: any) {
        showToast(err?.message || 'Failed to update session', 'error');
      }
    },
    [dispatch, showToast]
  );

  const handleDelete = useCallback(
    async (projectId: string, sessionId: string) => {
      if (!confirm('Delete this conversation? This cannot be undone.')) return;
      try {
        await api.deleteSession(projectId, sessionId);
        if (sessionId === state.selectedSessionId) {
          dispatch({ type: 'CLEAR_SESSION' });
        }
        const data = await api.getSessions(projectId);
        dispatch({ type: 'SET_SESSIONS', sessions: data.sessions });
        showToast('Session deleted');
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete session', 'error');
      }
    },
    [state.selectedSessionId, dispatch, showToast]
  );

  const toggleSidebar = () => {
    const next = state.sidebarState === 'expanded' ? 'icons' : 'expanded';
    dispatch({ type: 'SET_SIDEBAR_STATE', state: next });
  };

  const starCount = state.sessions.filter((s) => s.starred).length;

  // --- ICON BAR ---
  if (state.sidebarState === 'icons') {
    return (
      <aside
        className="flex-shrink-0 border-r flex flex-col items-center h-full shadow-2xl sidebar-transition"
        style={{
          width: 56,
          background: `linear-gradient(to bottom, var(--sidebar-from), var(--sidebar-to))`,
          borderColor: 'var(--sidebar-border)',
        }}
      >
        {/* Expand button */}
        <button
          onClick={toggleSidebar}
          className="w-full flex justify-center py-3 hover:bg-white/5 transition-colors"
          style={{ color: 'var(--sidebar-text-muted)' }}
          title="Expand sidebar (Ctrl+B)"
        >
          <PanelLeftOpen size={18} />
        </button>

        {/* Search icon */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors my-2"
          style={{ color: 'var(--sidebar-text-muted)' }}
          title="Search (Ctrl+K)"
        >
          <Search size={18} />
        </button>

        {/* Star count */}
        {starCount > 0 && (
          <div
            className="flex items-center gap-1 text-[11px] mb-2"
            style={{ color: 'var(--star-color)' }}
            title={`${starCount} favorites`}
          >
            <Star size={14} fill="currentColor" />
            <span>{starCount}</span>
          </div>
        )}

        <div className="w-8 h-px my-2 opacity-10" style={{ backgroundColor: 'var(--sidebar-text)' }} />

        {/* Project icons */}
        <div className="flex-1 flex flex-col items-center gap-1 py-2 overflow-y-auto w-full">
          {state.projects.map((project) => (
            <div key={project.id} className="relative">
              <button
                onClick={() => handleProjectClick(project.id)}
                onMouseEnter={() => setTooltipProject(project.id)}
                onMouseLeave={() => setTooltipProject(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
                style={{
                  backgroundColor: state.selectedProjectId === project.id
                    ? 'var(--sidebar-active-bg)'
                    : 'transparent',
                  color: state.selectedProjectId === project.id
                    ? 'var(--sidebar-text)'
                    : 'var(--sidebar-text-muted)',
                }}
                title={project.shortName}
              >
                <Folder size={18} />
              </button>
              {/* Tooltip on hover */}
              {tooltipProject === project.id && (
                <div
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs whitespace-nowrap rounded-lg shadow-lg pointer-events-none"
                  style={{
                    backgroundColor: 'var(--context-menu-bg)',
                    color: 'var(--context-menu-text)',
                    border: '1px solid var(--context-menu-border)',
                    boxShadow: 'var(--shadow-overlay)',
                    zIndex: 'var(--z-overlay)',
                    animation: 'scaleIn var(--duration-fast) var(--ease-spring)',
                  }}
                >
                  <div className="font-medium">{project.shortName}</div>
                  <div className="opacity-50">{project.sessionCount} sessions</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Settings */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors mb-2"
          style={{ color: 'var(--sidebar-text-muted)' }}
          title="Settings"
        >
          <Settings size={18} />
        </button>

        {/* Context Menu */}
        {state.contextMenu && (
          <ContextMenu
            x={state.contextMenu.x}
            y={state.contextMenu.y}
            onClose={() => dispatch({ type: 'HIDE_CONTEXT_MENU' })}
            items={[
              {
                label: 'Rename',
                shortcut: 'F2',
                action: () => {
                  const newTitle = prompt('New name:', state.contextMenu!.title || '');
                  if (newTitle && newTitle.trim()) {
                    handleRename(state.contextMenu!.projectId, state.contextMenu!.sessionId, newTitle.trim());
                  }
                },
              },
              {
                label: state.sessions.find((s) => s.sessionId === state.contextMenu?.sessionId)?.starred
                  ? 'Remove from favorites'
                  : 'Add to favorites',
                shortcut: '',
                action: () => {
                  const session = state.sessions.find((s) => s.sessionId === state.contextMenu?.sessionId);
                  if (session) handleToggleStar(state.contextMenu!.projectId, state.contextMenu!.sessionId, session.starred);
                },
              },
              {
                label: 'Delete',
                shortcut: 'Del',
                danger: true,
                action: () => handleDelete(state.contextMenu!.projectId, state.contextMenu!.sessionId),
              },
            ]}
          />
        )}
      </aside>
    );
  }

  // --- HIDDEN ---
  if (state.sidebarState === 'hidden') {
    return null;
  }

  // --- EXPANDED (full sidebar) ---
  const projectGroups = state.searchResults
    ? groupByProject(state.searchResults, state.projects)
    : null;

  return (
    <aside
      className="flex-shrink-0 border-r flex flex-col h-full shadow-2xl sidebar-transition relative"
      style={{
        width: 320,
        background: `linear-gradient(to bottom, var(--sidebar-from), var(--sidebar-to))`,
        borderColor: 'var(--sidebar-border)',
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
            style={{ background: `linear-gradient(to bottom right, var(--empty-icon-from), var(--empty-icon-to))` }}
          >
            <MessageSquare size={16} className="text-white" />
          </div>
          <h1 className="text-base font-semibold flex-1" style={{ color: 'var(--sidebar-text)' }}>CC History</h1>
          <button
            onClick={toggleSidebar}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ color: 'var(--sidebar-text-muted)' }}
            title="Collapse sidebar (Ctrl+B)"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
        <SearchBar />
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.loadingProjects && (
          <div className="p-4 space-y-2">
            <div className="skeleton h-8" />
            <div className="skeleton h-8" />
            <div className="skeleton h-8" />
          </div>
        )}
        {state.error && (
          <div className="p-4 text-sm text-rose-400">{state.error}</div>
        )}
        {projectGroups ? (
          <SessionList
            groups={projectGroups}
            selectedSessionId={state.selectedSessionId}
            onSessionClick={handleSessionClick}
            onContextMenu={handleContextMenu}
          />
        ) : state.searchQuery ? (
          <div className="p-4 text-sm" style={{ color: 'var(--sidebar-text-muted)' }}>Type to search...</div>
        ) : (
          state.projects.map((project) => (
            <div key={project.id}>
              <button
                onClick={() => handleProjectClick(project.id)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-between"
                style={{
                  color: state.selectedProjectId === project.id ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                  backgroundColor: state.selectedProjectId === project.id ? 'var(--sidebar-active-bg)' : 'transparent',
                  borderLeft: state.selectedProjectId === project.id ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (state.selectedProjectId !== project.id) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                }}
                onMouseLeave={(e) => {
                  if (state.selectedProjectId !== project.id) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="truncate flex items-center gap-2">
                  <Folder size={14} style={{ color: 'var(--sidebar-text-muted)', opacity: 0.5 }} />
                  {project.shortName}
                </span>
                <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--sidebar-text-muted)' }}>
                  {project.sessionCount}
                </span>
              </button>
              {state.selectedProjectId === project.id && (
                <div className="ml-2">
                  {state.loadingSessions ? (
                    <div className="p-3 space-y-2">
                      <div className="skeleton h-10" />
                      <div className="skeleton h-10" />
                      <div className="skeleton h-10" />
                    </div>
                  ) : (
                    state.sessions.map((session) => (
                      <div
                        key={session.sessionId}
                        onContextMenu={(e) => handleContextMenu(e, project.id, session.sessionId, session.title)}
                      >
                        <button
                          onClick={() => handleSessionClick(project.id, session.sessionId)}
                          className="w-full text-left px-3 py-2.5 text-sm transition-all rounded-r-lg mr-1 flex items-center gap-1.5"
                          style={{
                            color: state.selectedSessionId === session.sessionId ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                            backgroundColor: state.selectedSessionId === session.sessionId ? 'var(--sidebar-active-bg)' : 'transparent',
                            borderLeft: state.selectedSessionId === session.sessionId ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (state.selectedSessionId !== session.sessionId) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                          }}
                          onMouseLeave={(e) => {
                            if (state.selectedSessionId !== session.sessionId) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {session.starred && (
                            <Star size={12} className="flex-shrink-0" style={{ color: 'var(--star-color)' }} fill="currentColor" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{session.title || session.firstPrompt || 'Untitled'}</div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--sidebar-text-muted)', opacity: 0.6 }}>
                              {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleDateString() : ''}
                              {session.gitBranch ? ` · ${session.gitBranch}` : ''}
                            </div>
                          </div>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Settings gear */}
      <div className="border-t p-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
          style={{ color: 'var(--sidebar-text-muted)' }}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>

      {/* Context Menu */}
      {state.contextMenu && (
        <ContextMenu
          x={state.contextMenu.x}
          y={state.contextMenu.y}
          onClose={() => dispatch({ type: 'HIDE_CONTEXT_MENU' })}
          items={[
            {
              label: 'Rename', shortcut: 'F2',
              action: () => {
                const newTitle = prompt('New name:', state.contextMenu!.title || '');
                if (newTitle && newTitle.trim()) {
                  handleRename(state.contextMenu!.projectId, state.contextMenu!.sessionId, newTitle.trim());
                }
              },
            },
            {
              label: state.sessions.find((s) => s.sessionId === state.contextMenu?.sessionId)?.starred
                ? 'Remove from favorites' : 'Add to favorites',
              shortcut: '',
              action: () => {
                const session = state.sessions.find((s) => s.sessionId === state.contextMenu?.sessionId);
                if (session) handleToggleStar(state.contextMenu!.projectId, state.contextMenu!.sessionId, session.starred);
              },
            },
            {
              label: 'Delete', shortcut: 'Del', danger: true,
              action: () => handleDelete(state.contextMenu!.projectId, state.contextMenu!.sessionId),
            },
          ]}
        />
      )}
    </aside>
  );
}

function groupByProject(
  results: { projectId: string; sessionId: string; title: string | null; timestamp: string | null; matchSnippet: string }[],
  projects: { id: string; shortName: string }[]
) {
  const map = new Map<string, typeof results>();
  for (const r of results) {
    const arr = map.get(r.projectId) || [];
    arr.push(r);
    map.set(r.projectId, arr);
  }
  return Array.from(map.entries()).map(([projectId, sessions]) => {
    const project = projects.find((p) => p.id === projectId);
    return { projectId, projectName: project?.shortName || projectId, sessions };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/Sidebar.tsx
git commit -m "feat: three-state sidebar — expanded, icon bar, hidden — with spring transitions and hover tooltips"
```

---

### Task 10: Update Shell with expanded keyboard shortcuts

**Files:**
- Modify: `client/src/components/layout/Shell.tsx`

- [ ] **Step 1: Add keyboard shortcuts for sidebar collapse, command palette, export, session nav, reader mode toggle**

Replace the `handleKeyDown` function in `client/src/components/layout/Shell.tsx` (lines 23-73):

```tsx
const handleKeyDown = useCallback(
  async (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, [contenteditable]')) return;

    // Ctrl+B — toggle sidebar (expanded ↔ icons)
    if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
      e.preventDefault();
      const next = state.sidebarState === 'expanded' ? 'icons' : 'expanded';
      dispatch({ type: 'SET_SIDEBAR_STATE', state: next });
      return;
    }

    // Ctrl+Shift+B — hide sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === 'b' && e.shiftKey) {
      e.preventDefault();
      const next = state.sidebarState === 'hidden' ? 'expanded' : 'hidden';
      dispatch({ type: 'SET_SIDEBAR_STATE', state: next });
      return;
    }

    // Ctrl+Shift+F — toggle reader mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && e.shiftKey) {
      e.preventDefault();
      dispatch({ type: 'SET_READER_MODE', enabled: !state.filters.readerMode });
      return;
    }

    if (!state.selectedSessionId || !state.selectedProjectId) return;

    // F2 — rename session
    if (e.key === 'F2') {
      e.preventDefault();
      const session = state.sessions.find((s) => s.sessionId === state.selectedSessionId);
      const newTitle = prompt('Rename session:', session?.title || '');
      if (newTitle && newTitle.trim() && newTitle.trim() !== session?.title) {
        api
          .updateSession(state.selectedProjectId, state.selectedSessionId, { title: newTitle.trim() })
          .then(() => {
            dispatch({ type: 'RENAME_SESSION', sessionId: state.selectedSessionId!, title: newTitle.trim() });
            showToast('Session renamed');
          })
          .catch((err: any) => {
            showToast(err?.message || 'Failed to rename session', 'error');
          });
      }
      return;
    }

    // Ctrl+E — export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      // Import happens at call site
      const { downloadMarkdown } = await import('../utils/exportMarkdown');
      const { api } = await import('../api/client');
      try {
        const data = await api.getTranscript(state.selectedProjectId, state.selectedSessionId, 4000, 0);
        downloadMarkdown(data.events, `conversation-${state.selectedSessionId!.slice(0, 8)}.md`);
        showToast('Exported as Markdown');
      } catch (err: any) {
        showToast(err?.message || 'Failed to export', 'error');
      }
      return;
    }

    // Ctrl+[ / Ctrl+] — navigate sessions
    if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.key === ']')) {
      e.preventDefault();
      const idx = state.sessions.findIndex((s) => s.sessionId === state.selectedSessionId);
      const nextIdx = e.key === ']' ? idx + 1 : idx - 1;
      if (nextIdx >= 0 && nextIdx < state.sessions.length) {
        const nextSession = state.sessions[nextIdx];
        dispatch({ type: 'SELECT_SESSION', projectId: state.selectedProjectId!, sessionId: nextSession.sessionId });
      }
      return;
    }

    // Delete
    if (e.key === 'Delete' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (!confirm('Delete this conversation? This cannot be undone.')) return;
      const pid = state.selectedProjectId!;
      const sid = state.selectedSessionId!;
      try {
        await api.deleteSession(pid, sid);
        dispatch({ type: 'CLEAR_SESSION' });
        try {
          const data = await api.getSessions(pid);
          dispatch({ type: 'SET_SESSIONS', sessions: data.sessions });
        } catch { /* list refresh failed */ }
        showToast('Session deleted');
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete session', 'error');
      }
    }
  },
  [state.sidebarState, state.filters.readerMode, state.selectedSessionId, state.selectedProjectId, state.sessions, dispatch, showToast]
);
```

Also update the dependency array at the bottom of useEffect to match.

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/Shell.tsx
git commit -m "feat: add keyboard shortcuts for sidebar toggle, export, session nav, reader mode"
```

---

### Task 11: Update MainPanel for hidden sidebar edge zone and scroll button

**Files:**
- Modify: `client/src/components/layout/MainPanel.tsx`

- [ ] **Step 1: Add edge hover zone for hidden sidebar restoration**

Replace `client/src/components/layout/MainPanel.tsx`:

```tsx
import { useAppState } from '../../context/AppContext';
import { ChatWindow } from '../chat/ChatWindow';
import { PanelLeftOpen } from 'lucide-react';

export function MainPanel() {
  const { state, dispatch } = useAppState();

  const showEdgeZone = state.sidebarState === 'hidden' && state.selectedSessionId;

  return (
    <main
      className="flex-1 flex flex-col min-w-0 relative"
      style={{ background: `linear-gradient(to bottom right, var(--page-from), var(--page-to))` }}
    >
      {/* Edge hover zone for hidden sidebar */}
      {showEdgeZone && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 group z-10"
          style={{ zIndex: 'var(--z-panel)' }}
          onMouseEnter={() => {
            dispatch({ type: 'SET_SIDEBAR_STATE', state: 'icons' });
          }}
          title="Show sidebar"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-16 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--sidebar-from)', color: 'var(--sidebar-text-muted)' }}>
            <PanelLeftOpen size={16} />
          </div>
        </div>
      )}

      {!state.selectedSessionId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(to bottom right, var(--empty-icon-from), var(--empty-icon-to))`,
                boxShadow: `0 4px 12px var(--empty-icon-shadow)`,
              }}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium" style={{ color: 'var(--empty-title)' }}>Select a session</p>
            <p className="text-sm mt-1" style={{ color: 'var(--empty-subtitle)' }}>Choose a project and session from the sidebar</p>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs" style={{ color: 'var(--empty-subtitle)', opacity: 0.6 }}>
              <span><kbd className="px-2 py-0.5 rounded-md font-mono text-xs border" style={{ borderColor: 'var(--filter-sep)', backgroundColor: 'var(--filter-active-bg)' }}>Ctrl+K</kbd> Search</span>
              <span><kbd className="px-2 py-0.5 rounded-md font-mono text-xs border" style={{ borderColor: 'var(--filter-sep)', backgroundColor: 'var(--filter-active-bg)' }}>Ctrl+B</kbd> Sidebar</span>
              <span><kbd className="px-2 py-0.5 rounded-md font-mono text-xs border" style={{ borderColor: 'var(--filter-sep)', backgroundColor: 'var(--filter-active-bg)' }}>Del</kbd> Delete</span>
            </div>
          </div>
        </div>
      ) : (
        <ChatWindow projectId={state.selectedProjectId!} sessionId={state.selectedSessionId} />
      )}
    </main>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/layout/MainPanel.tsx
git commit -m "feat: add edge hover zone for hidden sidebar restoration"
```

---

### Task 12: Message grouping, stagger animation, scroll button in ChatWindow

**Files:**
- Modify: `client/src/components/chat/ChatWindow.tsx`

- [ ] **Step 1: Add message grouping, stagger animation, scroll-to-bottom, skeleton, empty states**

Rewrite `client/src/components/chat/ChatWindow.tsx`:

```tsx
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';
import { MessageBubble } from './MessageBubble';
import { FilterBar } from '../shared/FilterBar';
import { downloadMarkdown } from '../../utils/exportMarkdown';
import { ArrowDown } from 'lucide-react';
import type { NormalizedEvent } from '../../types';

interface ChatWindowProps {
  projectId: string;
  sessionId: string;
}

export function ChatWindow({ projectId, sessionId }: ChatWindowProps) {
  const { state, dispatch, showToast } = useAppState();
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEvents([]);
    setLoading(true);
    setScrolledUp(false);
    api.getTranscript(projectId, sessionId, 4000, 0)
      .then((data) => { setEvents(data.events); setLoading(false); })
      .catch((err) => {
        dispatch({ type: 'SET_ERROR', error: err.message });
        setLoading(false);
      });
  }, [projectId, sessionId, dispatch]);

  // Auto-scroll on new events load, unless user scrolled up
  useEffect(() => {
    if (!scrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, scrolledUp]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setScrolledUp(distFromBottom > 200);
  }, []);

  const stats = useMemo(() => {
    const models = new Set<string>();
    let msgCount = 0;
    let firstTs: string | null = null;
    let lastTs: string | null = null;
    for (const e of events) {
      if (e.type === 'user' || e.type === 'assistant') msgCount++;
      if (e.model) models.add(e.model);
      if (e.timestamp) {
        if (!firstTs || e.timestamp < firstTs) firstTs = e.timestamp;
        if (!lastTs || e.timestamp > lastTs) lastTs = e.timestamp;
      }
    }
    return { msgCount, models: Array.from(models), firstTs, lastTs };
  }, [events]);

  // Build message groups for stagger + grouping
  const messageGroups = useMemo(() => {
    const groups: { role: 'user' | 'assistant' | 'system'; events: { event: NormalizedEvent; index: number }[] }[] = [];
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const role = event.type as 'user' | 'assistant' | 'system';
      const last = groups[groups.length - 1];
      if (last && last.role === role) {
        last.events.push({ event, index: i });
      } else {
        groups.push({ role, events: [{ event, index: i }] });
      }
    }
    return groups;
  }, [events]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setScrolledUp(false);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.deleteSession(projectId, sessionId);
      dispatch({ type: 'CLEAR_SESSION' });
      showToast('Session deleted');
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message });
      showToast('Failed to delete session', 'error');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center px-5 py-2.5 backdrop-blur-sm border-b shadow-sm shrink-0"
          style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="skeleton h-16 rounded-2xl" style={{ width: `${40 + Math.random() * 30}%` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center" style={{ color: 'var(--empty-subtitle)' }}>
          <p className="text-sm">This session is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className="flex items-center justify-between px-5 py-2.5 backdrop-blur-sm border-b shadow-sm shrink-0"
        style={{
          backgroundColor: 'var(--header-bg)',
          borderColor: 'var(--header-border)',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--header-text)' }}>
          <span className="font-medium" style={{ color: 'var(--header-text-strong)' }}>{stats.msgCount} messages</span>
          {stats.models.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--header-pill-bg)', color: 'var(--header-pill-text)' }}>
              {stats.models.join(', ')}
            </span>
          )}
          {stats.firstTs && (
            <span>{new Date(stats.firstTs).toLocaleDateString()}{stats.lastTs && stats.lastTs !== stats.firstTs ? ` — ${new Date(stats.lastTs).toLocaleDateString()}` : ''}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => downloadMarkdown(events, `conversation-${sessionId.slice(0, 8)}.md`)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--btn-bg)',
              color: 'var(--btn-text)',
              transition: 'background-color var(--duration-fast) var(--ease-out)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--btn-hover-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--btn-bg)'; }}
          >
            Export .md
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      <FilterBar />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messageGroups.map((group, gi) => (
            <div
              key={gi}
              className={group.events.length > 1 ? 'message-group' : ''}
              style={{
                animation: `messageIn var(--duration-normal) var(--ease-out) backwards`,
                animationDelay: `${Math.min(gi, 15) * 30}ms`,
              }}
            >
              {group.events.map(({ event, index }) => (
                <MessageBubble key={event.uuid || index} event={event} index={index} groupSize={group.events.length} />
              ))}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Scroll to bottom FAB */}
      {scrolledUp && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-8 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
          style={{
            backgroundColor: 'var(--bubble-user-from)',
            color: '#fff',
            boxShadow: 'var(--shadow-panel)',
            zIndex: 'var(--z-surface)',
            animation: 'scaleIn var(--duration-fast) var(--ease-spring)',
          }}
        >
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/chat/ChatWindow.tsx
git commit -m "feat: add message grouping, stagger animation, skeleton loader, scroll-to-bottom FAB"
```

---

### Task 13: Update AssistantMessage and UserMessage for animation and grouping

**Files:**
- Modify: `client/src/components/chat/MessageBubble.tsx`
- Modify: `client/src/components/chat/AssistantMessage.tsx`
- Modify: `client/src/components/chat/UserMessage.tsx`

- [ ] **Step 1: Update AssistantMessage for group support**

In `client/src/components/chat/AssistantMessage.tsx`:

Update the interface to include `groupSize`:
```tsx
interface AssistantMessageProps {
  event: NormalizedEvent;
  groupSize?: number;
}
```

Then update `MessageBubble` to pass `groupSize` through to both UserMessage and AssistantMessage.

Actually, let's update MessageBubble instead to pass groupSize:

In `client/src/components/chat/MessageBubble.tsx`, update the interface and pass-through:

```tsx
import type { NormalizedEvent } from '../../types';
import { useAppState } from '../../context/AppContext';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { SystemEvent } from './SystemEvent';

interface MessageBubbleProps {
  event: NormalizedEvent;
  index: number;
  groupSize?: number;
}

export function MessageBubble({ event, groupSize }: MessageBubbleProps) {
  const { state } = useAppState();
  const { filters } = state;

  const isGrouped = groupSize && groupSize > 1;

  if (event.type === 'system') {
    if (!filters.showSystemEvents) return null;
    return <SystemEvent event={event} />;
  }

  if (event.type === 'user') {
    return <UserMessage event={event} compact={isGrouped} />;
  }

  if (event.type === 'assistant') {
    return <AssistantMessage event={event} compact={isGrouped} />;
  }

  return null;
}
```

Then update UserMessage to accept `compact`:
```tsx
interface UserMessageProps {
  event: NormalizedEvent;
  compact?: boolean;
}

export function UserMessage({ event, compact }: UserMessageProps) {
  return (
    <div className={`flex justify-end ${compact ? 'message-bubble' : ''}`}>
      <div className="max-w-[70%] group relative">
        <CopyButton text={event.content || ''} />
        <div className={`rounded-2xl rounded-br-md px-4 py-3 text-base leading-relaxed whitespace-pre-wrap break-words shadow-lg ${compact ? 'rounded-tr-md' : ''}`}
          style={{
            background: `linear-gradient(to bottom right, var(--bubble-user-from), var(--bubble-user-to))`,
            color: 'var(--bubble-user-text)',
            boxShadow: `0 10px 15px -3px var(--bubble-user-shadow)`,
          }}>
          {event.content}
        </div>
        {!compact && event.timestamp && (
          <div className="text-right text-xs text-stone-400/60 dark:text-stone-500/60 mt-1 mr-2">
            {formatDate(event.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
```

And AssistantMessage:
```tsx
interface AssistantMessageProps {
  event: NormalizedEvent;
  compact?: boolean;
}

// In the return JSX, hide the timestamp footer when compact:
{!compact && (
  <div className="flex items-center gap-2 mt-1 ml-2 text-xs text-stone-400/60 dark:text-stone-500/60">
    {event.timestamp && <span>{formatDate(event.timestamp)}</span>}
    {event.model && <span className="opacity-60">{event.model}</span>}
    {event.usage && (
      <span className="opacity-60">
        {event.usage.input_tokens}+{event.usage.output_tokens} tokens
      </span>
    )}
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/chat/MessageBubble.tsx client/src/components/chat/AssistantMessage.tsx client/src/components/chat/UserMessage.tsx
git commit -m "feat: add compact mode for grouped messages, hide timestamps on grouped siblings"
```

---

### Task 14: FilterBar transition polish

**Files:**
- Modify: `client/src/components/shared/FilterBar.tsx`

- [ ] **Step 1: Add transition to filter buttons and use Lucide icons**

Replace the buttons with smooth background transitions. Add `transition` inline styles:

```tsx
style={{
  backgroundColor: filters[key] ? 'var(--filter-active-bg)' : 'transparent',
  color: filters[key] ? 'var(--filter-active-text)' : 'var(--filter-inactive-text)',
  fontWeight: filters[key] ? 500 : 400,
  transition: 'all var(--duration-fast) var(--ease-out)',
}}
```

Also on the Reader button, add the transition:
```tsx
style={{
  ...(filters.readerMode
    ? {
        background: `linear-gradient(to right, var(--reader-from), var(--reader-to))`,
        color: '#fff',
        boxShadow: `0 4px 6px -1px var(--bubble-user-shadow)`,
      }
    : {
        backgroundColor: 'var(--reader-inactive-bg)',
        color: 'var(--reader-inactive-text)',
      }),
  transition: 'all var(--duration-fast) var(--ease-out)',
}}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/shared/FilterBar.tsx
git commit -m "feat: add smooth transition to filter bar buttons"
```

---

### Task 15: Wire CommandPalette into Shell and final integration

**Files:**
- Modify: `client/src/components/layout/Shell.tsx`

- [ ] **Step 1: Add CommandPalette to Shell render**

In `client/src/components/layout/Shell.tsx`, add the import:

```tsx
import { CommandPalette } from '../shared/CommandPalette';
```

And add it to the JSX, after `ToastContainer`:

```tsx
<div className="flex h-screen overflow-hidden" style={{ background: `linear-gradient(to bottom right, var(--page-from), var(--page-to))` }}>
  <Sidebar />
  <MainPanel />
  <SettingsPanel />
  <CommandPalette />
  <ToastContainer />
</div>
```

- [ ] **Step 2: Build and verify TypeScript compilation**

```bash
cd client && npx tsc --noEmit
```

Expected: No type errors. Fix any that appear.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layout/Shell.tsx
git commit -m "feat: wire CommandPalette into Shell component"
```

---

### Task 16: End-to-end verification

**Files:**
- None (manual testing)

- [ ] **Step 1: Start dev server and verify**

```bash
npm run dev
```

Verify:
1. Sidebar toggles between expanded and icon bar with Ctrl+B
2. Ctrl+Shift+B hides sidebar, edge hover zone restores it
3. Ctrl+K opens command palette, Escape closes
4. Code blocks use larger JetBrains Mono font with header bar
5. Copy button works on code blocks
6. Messages animate in with stagger
7. Consecutive messages of same role are grouped
8. Scroll-to-bottom button appears when scrolled up
9. Skeleton loaders show during loading
10. Settings panel still works
11. Theme switching still works
12. Sessions can still be renamed, starred, deleted
13. Export still works

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: end-to-end verification fixes"
```
