// Prism syntax highlighting theme driven by CSS variables.
// The actual color values are defined in index.css per theme + dark mode.

import type { CSSProperties } from 'react';

const cssVar = (name: string, fallback: string): string =>
  `var(--syntax-${name}, ${fallback})`;

export const lightTheme: Record<string, CSSProperties> = {
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
