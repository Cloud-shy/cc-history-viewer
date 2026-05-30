import type { NormalizedEvent } from '../../types';
import { formatDate } from '../../utils/dateFormat';
import { CopyButton } from '../shared/CopyButton';

interface UserMessageProps {
  event: NormalizedEvent;
  compact?: boolean;
}

export function UserMessage({ event, compact }: UserMessageProps) {
  return (
    <div className={`flex justify-end ${compact ? 'message-bubble' : ''}`}>
      <div className="max-w-[70%] group relative">
        <CopyButton text={event.content || ''} />
        <div
          className={`rounded-2xl rounded-br-md px-4 py-3 text-base leading-relaxed whitespace-pre-wrap break-words shadow-lg ${compact ? 'rounded-tr-md' : ''}`}
          style={{
            background: `linear-gradient(to bottom right, var(--bubble-user-from), var(--bubble-user-to))`,
            color: 'var(--bubble-user-text)',
            boxShadow: `0 10px 15px -3px var(--bubble-user-shadow)`,
          }}
        >
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
