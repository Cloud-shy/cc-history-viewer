import { useRef, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';

export function SearchBar() {
  const { state, dispatch } = useAppState();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.searchQuery) {
      dispatch({ type: 'SET_SEARCH_RESULTS', results: null });
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      api.search(state.searchQuery)
        .then((data) => dispatch({ type: 'SET_SEARCH_RESULTS', results: data.results }))
        .catch(() => {});
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.searchQuery, dispatch]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search (Ctrl+K)..."
      value={state.searchQuery}
      onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', query: e.target.value })}
      className="w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[var(--sidebar-search-focus-ring)] focus:border-[var(--sidebar-search-focus-ring)] placeholder-[var(--sidebar-search-placeholder)]"
      style={{
        backgroundColor: 'var(--sidebar-search-bg)',
        borderColor: 'var(--sidebar-search-border)',
        color: 'var(--sidebar-search-text)',
      }}
    />
  );
}
