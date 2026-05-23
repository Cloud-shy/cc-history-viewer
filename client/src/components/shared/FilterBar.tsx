import { useAppState } from '../../context/AppContext';
import type { FilterState } from '../../types';

const FILTER_LABELS: { key: keyof FilterState; label: string; shortLabel: string }[] = [
  { key: 'showThinking', label: 'Thinking', shortLabel: 'Think' },
  { key: 'showToolUse', label: 'Tool Calls', shortLabel: 'Tools' },
  { key: 'showToolResult', label: 'Tool Results', shortLabel: 'Results' },
  { key: 'showSystemEvents', label: 'System Events', shortLabel: 'System' },
];

export function FilterBar() {
  const { state, dispatch } = useAppState();
  const { filters } = state;

  const handleToggle = (key: keyof FilterState) => {
    dispatch({ type: 'TOGGLE_FILTER', key });
  };

  const handleReaderMode = () => {
    dispatch({ type: 'SET_READER_MODE', enabled: !filters.readerMode });
  };

  return (
    <div className="flex items-center gap-2 px-5 py-2 bg-white/60 dark:bg-stone-950/30 backdrop-blur-sm border-b border-stone-200 dark:border-stone-800/20 overflow-x-auto shrink-0">
      <button
        onClick={handleReaderMode}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0"
        style={
          filters.readerMode
            ? {
                background: `linear-gradient(to right, var(--reader-from), var(--reader-to))`,
                color: '#fff',
                boxShadow: `0 4px 6px -1px var(--bubble-user-shadow)`,
              }
            : {
                backgroundColor: 'var(--reader-inactive-bg)',
                color: 'var(--reader-inactive-text)',
              }
        }
      >
        Reader
      </button>

      <span className="w-px h-4 shrink-0" style={{ backgroundColor: 'var(--filter-sep)' }} />

      {FILTER_LABELS.map(({ key, label, shortLabel }) => (
        <button
          key={key}
          onClick={() => handleToggle(key)}
          className="px-2.5 py-1.5 text-xs rounded-lg transition-all shrink-0"
          style={{
            backgroundColor: filters[key] ? 'var(--filter-active-bg)' : 'transparent',
            color: filters[key] ? 'var(--filter-active-text)' : 'var(--filter-inactive-text)',
            fontWeight: filters[key] ? 500 : 400,
          }}
        >
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </button>
      ))}
    </div>
  );
}
