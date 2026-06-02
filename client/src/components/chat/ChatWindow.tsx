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
            {Array.from({ length: 5 }).map((_, i) => {
              const isUser = i % 2 === 0;
              return (
                <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`skeleton h-16 ${isUser ? 'rounded-2xl' : ''}`} style={{ width: `${40 + Math.random() * 30}%` }} />
                </div>
              );
            })}
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
