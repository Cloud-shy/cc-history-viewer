import { useState } from 'react';
import { useAppState } from '../../context/AppContext';
import type { ContentBlock } from '../../types';

interface ToolCallBlockProps {
  block: ContentBlock & { blockType: 'tool_use' };
}

export function ToolCallBlock({ block }: ToolCallBlockProps) {
  const { state } = useAppState();
  const [open, setOpen] = useState(state.settings.expandToolCallsByDefault);

  const inputStr = JSON.stringify(block.toolInput, null, 2);

  return (
    <div className="border-l-2 pl-3" style={{ borderColor: 'var(--tool-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 font-medium hover:underline w-full text-left"
      >
        <span className="transition-transform inline-block text-xs" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        <span
          className="px-1.5 py-0.5 rounded text-xs font-mono border"
          style={{
            backgroundColor: 'var(--tool-badge-bg)',
            borderColor: 'var(--tool-badge-border)',
            color: 'var(--tool-badge-text)',
          }}
        >
          {block.toolName}
        </span>
        <span className="text-amber-600/70 dark:text-amber-500/70 truncate text-xs">
          {getToolSummary(block.toolName, block.toolInput)}
        </span>
      </button>
      {open && (
        <pre
          className="mt-2 p-3 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono border"
          style={{
            backgroundColor: 'var(--code-bg)',
            color: 'var(--inline-code-text)',
            borderColor: 'var(--code-border)',
          }}
        >
          {inputStr}
        </pre>
      )}
    </div>
  );
}

function getToolSummary(name: string, input: Record<string, unknown>): string {
  if (input.description) return String(input.description).slice(0, 100);
  if (input.command) return String(input.command).slice(0, 100);
  if (input.pattern) return String(input.pattern).slice(0, 100);
  if (input.file_path) return String(input.file_path).slice(0, 100);
  if (input.query) return String(input.query).slice(0, 100);
  return '';
}
