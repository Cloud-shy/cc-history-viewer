import { useState } from 'react';
import { useAppState } from '../../context/AppContext';
import type { ContentBlock } from '../../types';

interface ThinkingBlockProps {
  block: ContentBlock & { blockType: 'thinking' };
  index: number;
}

export function ThinkingBlock({ block, index }: ThinkingBlockProps) {
  const { state } = useAppState();
  const [open, setOpen] = useState(state.settings.expandThinkingByDefault || index === 0);

  return (
    <div className="border-l-2 pl-3" style={{ borderColor: 'var(--thinking-border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium hover:underline w-full text-left"
        style={{ color: 'var(--thinking-text)' }}
      >
        <span className="transition-transform inline-block text-xs" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        Thinking
        {block.signature && (
          <span className="opacity-50 font-mono text-xs">{block.signature.slice(0, 8)}</span>
        )}
      </button>
      {open && (
        <div className="mt-2 text-sm text-stone-600 dark:text-stone-400 font-mono whitespace-pre-wrap leading-relaxed">
          {block.content}
        </div>
      )}
    </div>
  );
}
