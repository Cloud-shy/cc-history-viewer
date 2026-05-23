import type { NormalizedEvent } from '../../types';
import { useAppState } from '../../context/AppContext';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';
import { SystemEvent } from './SystemEvent';

interface MessageBubbleProps {
  event: NormalizedEvent;
  index: number;
}

export function MessageBubble({ event }: MessageBubbleProps) {
  const { state } = useAppState();
  const { filters } = state;

  if (event.type === 'system') {
    if (!filters.showSystemEvents) return null;
    return <SystemEvent event={event} />;
  }

  if (event.type === 'user') {
    return <UserMessage event={event} />;
  }

  if (event.type === 'assistant') {
    return <AssistantMessage event={event} />;
  }

  return null;
}
