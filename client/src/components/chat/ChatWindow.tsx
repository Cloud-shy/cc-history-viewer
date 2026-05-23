import { useEffect, useState, useRef, useMemo } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';
import { MessageBubble } from './MessageBubble';
import { FilterBar } from '../shared/FilterBar';
import { downloadMarkdown } from '../../utils/exportMarkdown';
import type { NormalizedEvent } from '../../types';

interface ChatWindowProps {
  projectId: string;
  sessionId: string;
}

export function ChatWindow({ projectId, sessionId }: ChatWindowProps) {
  const { state, dispatch } = useAppState();
  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEvents([]);
    setLoading(true);
    api.getTranscript(projectId, sessionId, 10000, 0)
      .then((data) => { setEvents(data.events); setLoading(false); })
      .catch((err) => {
        dispatch({ type: 'SET_ERROR', error: err.message });
        setLoading(false);
      });
  }, [projectId, sessionId, dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

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

  const handleDelete = async () => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.deleteSession(projectId, sessionId);
      dispatch({ type: 'CLEAR_SESSION' });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', error: err.message });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3" style={{ color: 'var(--loading-color)' }}>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-base">Loading transcript...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className="flex items-center justify-between px-5 py-2.5 backdrop-blur-sm border-b shadow-sm shrink-0"
        style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
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
            style={{ backgroundColor: 'var(--btn-bg)', color: 'var(--btn-text)' }}
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
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
          {events.map((event, i) => (
            <MessageBubble key={event.uuid || i} event={event} index={i} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
