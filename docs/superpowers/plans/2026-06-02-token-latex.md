# Token Tracking & LaTeX Rendering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix per-message token visibility, add cumulative session token count in header, and add KaTeX-based LaTeX rendering in assistant messages.

**Architecture:** Five focused changes to the client: (1) install LaTeX deps, (2) fix AssistantMessage token footer to always render, (3) extend ChatWindow's stats useMemo with cumulative token summing, (4) wire remark-math + rehype-katex into TextBlock's react-markdown pipeline, (5) import KaTeX CSS with theme overrides. No server changes needed — TokenUsage is already parsed correctly.

**Tech Stack:** React 18, TypeScript, react-markdown, KaTeX, remark-math, rehype-katex, Tailwind CSS 3.4

---

### Task 1: Install LaTeX rendering dependencies

**Files:**
- Modify: `client/package.json`

- [ ] **Step 1: Install dependencies**

Run from the project root:
```bash
npm install --workspace=client katex remark-math rehype-katex
npm install --workspace=client -D @types/katex
```

Expected: packages added to `client/package.json` dependencies and devDependencies.

- [ ] **Step 2: Commit**

```bash
git add client/package.json client/package-lock.json
git commit -m "chore: add katex, remark-math, rehype-katex for LaTeX rendering"
```

---

### Task 2: Fix token footer visibility in AssistantMessage

**Files:**
- Modify: `client/src/components/chat/AssistantMessage.tsx:47-56`

- [ ] **Step 1: Replace the token/timestamp footer**

The current footer is gated behind `!compact` and has double-opacity styling making it nearly invisible. Replace lines 47-56.

**Old code (lines 47-56):**
```tsx
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

**New code (replace lines 47-56 with):**
```tsx
        <div
          className="flex items-center gap-2 mt-1 ml-2 text-xs"
          style={{ color: 'var(--system-text)' }}
        >
          {!compact && event.timestamp && <span>{formatDate(event.timestamp)}</span>}
          {!compact && event.model && <span>{event.model}</span>}
          {event.usage && (
            <span>
              {event.usage.input_tokens}+{event.usage.output_tokens} tokens
            </span>
          )}
        </div>
```

Key changes:
- Remove `{!compact && (...)}` gate — footer always renders
- In compact mode: timestamp and model hidden, only token count shows
- Replace Tailwind opacity classes with `var(--system-text)` for theme-compatible color
- Remove `opacity-60` wrapper from token span

- [ ] **Step 2: Verify the file looks correct**

Read `client/src/components/chat/AssistantMessage.tsx` to confirm the edit is clean.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/chat/AssistantMessage.tsx
git commit -m "fix: make token counts always visible in assistant messages"
```

---

### Task 3: Add cumulative token total to ChatWindow header

**Files:**
- Modify: `client/src/components/chat/ChatWindow.tsx:51-65` (stats useMemo)
- Modify: `client/src/components/chat/ChatWindow.tsx:135-155` (header JSX)

- [ ] **Step 1: Add token summing to the stats useMemo**

Replace the `stats` useMemo block (lines 51-65) with this version that adds `totalTokens`:

```tsx
  const stats = useMemo(() => {
    const models = new Set<string>();
    let msgCount = 0;
    let firstTs: string | null = null;
    let lastTs: string | null = null;
    let totalTokens = 0;
    for (const e of events) {
      if (e.type === 'user' || e.type === 'assistant') msgCount++;
      if (e.model) models.add(e.model);
      if (e.timestamp) {
        if (!firstTs || e.timestamp < firstTs) firstTs = e.timestamp;
        if (!lastTs || e.timestamp > lastTs) lastTs = e.timestamp;
      }
      if (e.usage) {
        totalTokens += e.usage.input_tokens + e.usage.output_tokens;
      }
    }
    return { msgCount, models: Array.from(models), firstTs, lastTs, totalTokens };
  }, [events]);
```

- [ ] **Step 2: Add the token pill to the header bar**

Find the header JSX section after `<div className="flex items-center gap-4 text-xs" ...>` (around line 145). Add a new pill before the model pill. Current order is: message count, model pill, date range. Insert the token pill between message count and model pill.

Find this block (around lines 145-154):
```tsx
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--header-text)' }}>
          <span className="font-medium" style={{ color: 'var(--header-text-strong)' }}>{stats.msgCount} messages</span>
          {stats.models.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--header-pill-bg)', color: 'var(--header-pill-text)' }}>
              {stats.models.join(', ')}
            </span>
          )}
          {stats.firstTs && (
```

Replace with:
```tsx
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--header-text)' }}>
          <span className="font-medium" style={{ color: 'var(--header-text-strong)' }}>{stats.msgCount} messages</span>
          {stats.totalTokens > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              {stats.totalTokens.toLocaleString()} tokens
            </span>
          )}
          {stats.models.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--header-pill-bg)', color: 'var(--header-pill-text)' }}>
              {stats.models.join(', ')}
            </span>
          )}
          {stats.firstTs && (
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/chat/ChatWindow.tsx
git commit -m "feat: add cumulative token count to chat header"
```

---

### Task 4: Add LaTeX rendering to TextBlock

**Files:**
- Modify: `client/src/components/chat/TextBlock.tsx:1-2` (imports)
- Modify: `client/src/components/chat/TextBlock.tsx:12-17` (plugin config)

- [ ] **Step 1: Add imports**

Replace lines 1-2:
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
```

With:
```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
```

- [ ] **Step 2: Add plugins to react-markdown**

Replace line 13:
```tsx
        remarkPlugins={[remarkGfm]}
```

With:
```tsx
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
```

- [ ] **Step 3: Verify the file**

Read `client/src/components/chat/TextBlock.tsx` — the full file should be:

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CodeBlock } from './CodeBlock';

interface TextBlockProps {
  content: string;
}

export function TextBlock({ content }: TextBlockProps) {
  return (
    <div className="prose dark:prose-invert max-w-none text-base leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');
            const isInline = !match && !codeStr.includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md text-[0.925em] font-mono border"
                  style={{
                    backgroundColor: 'var(--inline-code-bg)',
                    color: 'var(--inline-code-text)',
                    borderColor: 'var(--inline-code-border)',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match?.[1] || 'text'} code={codeStr} />
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--link)' }}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/chat/TextBlock.tsx
git commit -m "feat: add KaTeX LaTeX rendering to markdown text blocks"
```

---

### Task 5: Import KaTeX CSS with theme overrides

**Files:**
- Modify: `client/src/index.css:1` (add KaTeX import)
- Modify: `client/src/index.css:775-777` (add before closing dark section)

- [ ] **Step 1: Add KaTeX CSS import**

Add after the existing `@import` lines on line 15 (after the last `@fontsource` import and before `@tailwind base`):

```css
@import 'katex/dist/katex.min.css';
```

Replace line 16:
```css
@tailwind base;
```

With:
```css
@import 'katex/dist/katex.min.css';

@tailwind base;
```

- [ ] **Step 2: Add theme-compatible KaTeX overrides**

Add after the dark mode skeleton variables at line 777 (end of file):

```css
/* ---- KaTeX overrides ---- */
.katex {
  color: inherit;
  font-size: 1em;
}

.katex .mathnormal {
  color: inherit;
}

html.dark .katex {
  color: #e2e8f0;
}

html.dark .katex .mathnormal {
  color: #e2e8f0;
}

html.dark .katex-display {
  color: #e2e8f0;
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/index.css
git commit -m "feat: add KaTeX CSS import and dark mode overrides"
```

---

### Task 6: Build verification

- [ ] **Step 1: Type check**

```bash
npm run build --workspace=client
```

Expected: TypeScript compilation and Vite build succeed with no errors.

- [ ] **Step 2: Start dev server and manually verify**

```bash
npm run dev
```

Expected: App starts on port 5173 (client) and 3001 (server).

Open the app and:
1. Navigate to any session — verify token counts appear below each assistant message
2. Verify the cumulative token badge appears in the header bar
3. Find a session with LaTeX content (or verify the rendering is wired up correctly)
4. Toggle compact mode (message grouping) — verify tokens still show in compact

- [ ] **Step 3: Commit any final fixes if needed**
