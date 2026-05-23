import type { NormalizedEvent, ContentBlock } from '../../types';
import { useAppState } from '../../context/AppContext';
import { formatDate } from '../../utils/dateFormat';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallBlock } from './ToolCallBlock';
import { TextBlock } from './TextBlock';
import { CopyButton } from '../shared/CopyButton';

function extractText(blocks: ContentBlock[]): string {
  return blocks
    .filter((b) => b.blockType === 'text' || b.blockType === 'thinking')
    .map((b) => b.content)
    .join('\n\n');
}

interface AssistantMessageProps {
  event: NormalizedEvent;
}

export function AssistantMessage({ event }: AssistantMessageProps) {
  const { state } = useAppState();
  const { filters } = state;

  if (!event.blocks || event.blocks.length === 0) return null;

  const visibleBlocks = event.blocks.filter((block) => {
    switch (block.blockType) {
      case 'thinking': return filters.showThinking;
      case 'tool_use': return filters.showToolUse;
      case 'tool_result': return filters.showToolResult;
      default: return true;
    }
  });

  if (visibleBlocks.length === 0) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] min-w-0 group relative">
        <CopyButton text={extractText(event.blocks)} />
        <div
          className="rounded-2xl rounded-bl-md px-4 py-3 space-y-3 shadow-md border"
          style={{
            backgroundColor: 'var(--bubble-asst-bg)',
            borderColor: 'var(--bubble-asst-border)',
            boxShadow: `0 4px 6px -1px var(--bubble-asst-shadow)`,
          }}
        >
          {visibleBlocks.map((block, i) => (
            <BlockRenderer key={i} block={block} index={i} />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1 ml-2 text-xs text-stone-400/60 dark:text-stone-500/60">
          {event.timestamp && <span>{formatDate(event.timestamp)}</span>}
          {event.model && <span className="opacity-60">{event.model}</span>}
          {event.usage && (
            <span className="opacity-60">
              {event.usage.input_tokens}+{event.usage.output_tokens} tokens
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function BlockRenderer({ block, index }: { block: ContentBlock; index: number }) {
  switch (block.blockType) {
    case 'thinking':
      return <ThinkingBlock block={block} index={index} />;
    case 'text':
      return <TextBlock content={block.content} />;
    case 'tool_use':
      return <ToolCallBlock block={block} />;
    case 'tool_result':
      return (
        <details className="text-sm">
          <summary
            className="cursor-pointer py-1 px-2 rounded text-sm"
            style={{
              color: block.isError ? 'var(--result-error-text)' : 'var(--result-text)',
              backgroundColor: block.isError ? 'var(--result-error-bg)' : 'var(--result-bg)',
            }}
          >
            {block.isError ? 'Error' : 'Result'}
          </summary>
          <pre
            className="mt-1 p-2 rounded text-xs overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono border"
            style={{
              backgroundColor: 'var(--code-bg)',
              color: 'var(--inline-code-text)',
              borderColor: 'var(--code-border)',
            }}
          >
            {truncate(block.content, 5000)}
          </pre>
        </details>
      );
    default:
      return null;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n... [truncated ${s.length - max} chars]`;
}
