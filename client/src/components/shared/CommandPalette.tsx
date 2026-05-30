import { useEffect, useRef } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';
import { Search } from 'lucide-react';

export function CommandPalette() {
  const { state, dispatch } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (state.commandPaletteOpen) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [state.commandPaletteOpen]);

  // Debounced search
  useEffect(() => {
    if (!state.searchQuery || !state.commandPaletteOpen) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      api.search(state.searchQuery)
        .then((data) => dispatch({ type: 'SET_SEARCH_RESULTS', results: data.results }))
        .catch(() => {});
    }, 200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [state.searchQuery, state.commandPaletteOpen, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
      }
      if (e.key === 'Escape' && state.commandPaletteOpen) {
        dispatch({ type: 'CLOSE_COMMAND_PALETTE' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.commandPaletteOpen, dispatch]);

  if (!state.commandPaletteOpen) return null;

  const grouped = groupResults(state.searchResults, state.projects);

  const handleSelect = (projectId: string, sessionId: string) => {
    dispatch({ type: 'SELECT_SESSION', projectId, sessionId });
    dispatch({ type: 'CLOSE_COMMAND_PALETTE' });
  };

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[15vh]"
      style={{ zIndex: 'var(--z-overlay)' }}
      onClick={() => dispatch({ type: 'CLOSE_COMMAND_PALETTE' })}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn var(--duration-fast) var(--ease-out)',
        }}
      />

      {/* Palette */}
      <div
        className="relative w-[520px] max-h-[60vh] flex flex-col shadow-2xl border overflow-hidden"
        style={{
          backgroundColor: 'var(--context-menu-bg)',
          borderColor: 'var(--context-menu-border)',
          boxShadow: 'var(--shadow-overlay)',
          backdropFilter: 'blur(16px)',
          animation: 'scaleIn var(--duration-normal) var(--ease-spring)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--context-menu-border)' }}
        >
          <Search size={18} style={{ color: 'var(--header-text)', opacity: 0.5 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search across all sessions..."
            value={state.searchQuery}
            onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })}
            className="flex-1 bg-transparent border-none outline-none text-base"
            style={{ color: 'var(--context-menu-text)' }}
          />
          <kbd
            className="px-2 py-0.5 rounded text-[10px] font-mono"
            style={{
              backgroundColor: 'var(--filter-active-bg)',
              color: 'var(--header-text)',
              border: '1px solid var(--filter-sep)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto py-2">
          {!state.searchQuery && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--empty-subtitle)' }}>
              Type to search across all projects and sessions
            </div>
          )}

          {state.searchQuery && grouped.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--empty-subtitle)' }}>
              No results for "{state.searchQuery}"
            </div>
          )}

          {grouped.map((group) => (
            <div key={group.projectId}>
              <div
                className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--header-text)', opacity: 0.5 }}
              >
                {group.projectName}
              </div>
              {group.sessions.slice(0, 3).map((s) => (
                <button
                  key={`${group.projectId}-${s.sessionId}`}
                  onClick={() => handleSelect(group.projectId, s.sessionId)}
                  className="w-full text-left px-6 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: 'var(--context-menu-text)' }}
                >
                  <div className="truncate font-medium">{s.title || s.matchSnippet || 'Untitled'}</div>
                  {s.timestamp && (
                    <div className="text-xs mt-0.5 opacity-40">
                      {new Date(s.timestamp).toLocaleDateString()}
                    </div>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function groupResults(
  results: { projectId: string; sessionId: string; title: string | null; timestamp: string | null; matchSnippet: string }[] | null,
  projects: { id: string; shortName: string }[]
) {
  if (!results || results.length === 0) return [];
  const map = new Map<string, typeof results>();
  for (const r of results) {
    const arr = map.get(r.projectId) || [];
    arr.push(r);
    map.set(r.projectId, arr);
  }
  return Array.from(map.entries()).map(([projectId, sessions]) => {
    const project = projects.find((p) => p.id === projectId);
    return { projectId, projectName: project?.shortName || projectId, sessions };
  });
}
