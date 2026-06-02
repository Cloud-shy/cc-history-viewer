# Token Tracking & LaTeX Rendering

**Date:** 2026-06-02
**Status:** approved

## Overview

Two features for the CC-history-viewer chat interface:
1. Fix token visibility + add cumulative session token count
2. Add KaTeX-based LaTeX rendering in assistant messages

## Token Tracking

### Problem

Per-message token counts (`input_tokens` + `output_tokens`) already exist in the server-parsed data and the `AssistantMessage` component, but users cannot see them because:

- The footer (timestamp/model/tokens) is gated behind `{!compact && (...)}`. When messages are grouped (consecutive same-role), `compact` is `true` and the entire footer disappears.
- The remaining visibility chains `text-stone-400/60` (60% opacity) with `opacity-60` on the token span itself, making it ~36% effective opacity — nearly invisible even when rendered.

### Fix: Per-message visibility

**File:** `client/src/components/chat/AssistantMessage.tsx`

- Move the timestamp/model/tokens footer out of the `!compact` guard so it always renders.
- In compact mode: show only the token count (omit timestamp and model to stay trim).
- Remove the `opacity-60` wrapper from the token span.
- Change the text color from `text-stone-400/60` to a direct CSS variable so it works across themes.

### New: Cumulative header total

**File:** `client/src/components/chat/ChatWindow.tsx`

- Extend the existing `stats` useMemo to sum `input_tokens + output_tokens` across all assistant events.
- Display the total as a pill/badge in the header bar alongside the existing message count and model pills.
- Format large numbers with locale separators (e.g., `124,588 tokens`).
- Style: a distinct colored pill (blue accent) with a small clock/token icon.

### Data flow

```
history.jsonl → transcriptReader.ts (already extracts usage)
  → NormalizedEvent.usage (TokenUsage | null)
  → ChatWindow.stats useMemo (sums across events)
  → Header pill display + AssistantMessage footer display
```

No server changes needed — `TokenUsage` is already parsed and the `usage` field is already present in `NormalizedEvent`.

## LaTeX Rendering

### Approach

Add `remark-math` and `rehype-katex` plugins to the existing `react-markdown` pipeline in `TextBlock.tsx`. This handles both:

- Inline math: `$...$`
- Display/block math: `$$...$$`

KaTeX was chosen over MathJax for speed and smaller bundle size (~280KB vs ~2MB+).

### Dependencies

```
npm install katex remark-math rehype-katex
```

And types:
```
npm install -D @types/katex
```

### Changes

**File:** `client/src/components/chat/TextBlock.tsx`

- Import `remarkMath` and `rehypeKatex`.
- Add them to the `react-markdown` plugin arrays: `remarkPlugins={[remarkGfm, remarkMath]}` and `rehypePlugins={[rehypeKatex]}`.

**File:** `client/src/index.css`

- Import KaTeX CSS: `@import 'katex/dist/katex.min.css';`
- Add theme-compatible overrides so math renders in the correct color for each theme and dark mode:
  ```css
  .katex { color: inherit; }
  .katex .mathnormal { color: inherit; }
  /* Override KaTeX defaults that conflict with dark backgrounds */
  html.dark .katex { color: var(--text-color); }
  ```

### Error handling

- `rehype-katex` has a `strict` option. Set to `false` (or omit) to silently fall back to raw text on parse errors rather than throwing.
- Invalid LaTeX will render as the original source text, which matches current behavior of showing raw `$...$` strings.

## Files changed

| File | Change |
|------|--------|
| `client/src/components/chat/AssistantMessage.tsx` | Fix token footer visibility |
| `client/src/components/chat/ChatWindow.tsx` | Add cumulative token stat to header |
| `client/src/components/chat/TextBlock.tsx` | Add remark-math + rehype-katex plugins |
| `client/src/index.css` | Import KaTeX CSS + theme overrides |
| `client/package.json` | Add katex, remark-math, rehype-katex deps |

## Out of scope

- Token usage charts/graphs
- Per-turn token delta display
- MathJax support
- LaTeX in user messages (only assistant messages go through TextBlock)
- Server-side changes (usage data is already parsed correctly)
