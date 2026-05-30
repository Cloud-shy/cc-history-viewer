import { useEffect, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';
import { Sidebar } from './Sidebar';
import { MainPanel } from './MainPanel';
import { SettingsPanel } from '../shared/SettingsPanel';
import { ToastContainer } from '../shared/Toast';

export function Shell() {
  const { state, dispatch, showToast } = useAppState();
  const { settings } = state;

  useEffect(() => {
    const html = document.documentElement;
    html.className = html.className.replace(/theme-\w+/g, '');
    html.classList.add(`theme-${settings.theme}`);
    html.className = html.className.replace(/font-\w+/g, '');
    html.classList.add(`font-${settings.fontFamily}`);
    html.setAttribute('data-font-size', settings.fontSize);
    html.classList.toggle('dark', settings.darkMode);
  }, [settings.theme, settings.fontFamily, settings.fontSize, settings.darkMode]);

  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable]')) return;

      // Ctrl+B — toggle sidebar (expanded ↔ icons)
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault();
        const next = state.sidebarState === 'expanded' ? 'icons' : 'expanded';
        dispatch({ type: 'SET_SIDEBAR_STATE', state: next });
        return;
      }

      // Ctrl+Shift+B — hide sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && e.shiftKey) {
        e.preventDefault();
        const next = state.sidebarState === 'hidden' ? 'expanded' : 'hidden';
        dispatch({ type: 'SET_SIDEBAR_STATE', state: next });
        return;
      }

      // Ctrl+Shift+F — toggle reader mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'SET_READER_MODE', enabled: !state.filters.readerMode });
        return;
      }

      if (!state.selectedSessionId || !state.selectedProjectId) return;

      // F2 — rename session
      if (e.key === 'F2') {
        e.preventDefault();
        const session = state.sessions.find((s) => s.sessionId === state.selectedSessionId);
        const newTitle = prompt('Rename session:', session?.title || '');
        if (newTitle && newTitle.trim() && newTitle.trim() !== session?.title) {
          api
            .updateSession(state.selectedProjectId, state.selectedSessionId, { title: newTitle.trim() })
            .then(() => {
              dispatch({ type: 'RENAME_SESSION', sessionId: state.selectedSessionId!, title: newTitle.trim() });
              showToast('Session renamed');
            })
            .catch((err: any) => {
              showToast(err?.message || 'Failed to rename session', 'error');
            });
        }
        return;
      }

      // Ctrl+E — export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        const { downloadMarkdown } = await import('../../utils/exportMarkdown');
        try {
          const data = await api.getTranscript(state.selectedProjectId, state.selectedSessionId, 4000, 0);
          downloadMarkdown(data.events, `conversation-${state.selectedSessionId!.slice(0, 8)}.md`);
          showToast('Exported as Markdown');
        } catch (err: any) {
          showToast(err?.message || 'Failed to export', 'error');
        }
        return;
      }

      // Ctrl+[ / Ctrl+] — navigate sessions
      if ((e.ctrlKey || e.metaKey) && (e.key === '[' || e.key === ']')) {
        e.preventDefault();
        const idx = state.sessions.findIndex((s) => s.sessionId === state.selectedSessionId);
        const nextIdx = e.key === ']' ? idx + 1 : idx - 1;
        if (nextIdx >= 0 && nextIdx < state.sessions.length) {
          const nextSession = state.sessions[nextIdx];
          dispatch({ type: 'SELECT_SESSION', projectId: state.selectedProjectId!, sessionId: nextSession.sessionId });
        }
        return;
      }

      // Delete
      if (e.key === 'Delete' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!confirm('Delete this conversation? This cannot be undone.')) return;
        const pid = state.selectedProjectId!;
        const sid = state.selectedSessionId!;
        try {
          await api.deleteSession(pid, sid);
          dispatch({ type: 'CLEAR_SESSION' });
          try {
            const data = await api.getSessions(pid);
            dispatch({ type: 'SET_SESSIONS', sessions: data.sessions });
          } catch { /* list refresh failed */ }
          showToast('Session deleted');
        } catch (err: any) {
          showToast(err?.message || 'Failed to delete session', 'error');
        }
      }
    },
    [state.sidebarState, state.filters.readerMode, state.selectedSessionId, state.selectedProjectId, state.sessions, dispatch, showToast]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: `linear-gradient(to bottom right, var(--page-from), var(--page-to))` }}>
      <Sidebar />
      <MainPanel />
      <SettingsPanel />
      <ToastContainer />
    </div>
  );
}
