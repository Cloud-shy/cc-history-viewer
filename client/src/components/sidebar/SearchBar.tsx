import { useRef } from 'react';
import { useAppState } from '../../context/AppContext';

export function SearchBar() {
  const { dispatch } = useAppState();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
    inputRef.current?.blur();
  };

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search (Ctrl+K)..."
      onFocus={handleFocus}
      readOnly
      className="w-full px-3 py-2 text-sm rounded-lg border transition-all focus:outline-none focus:ring-2 cursor-pointer"
      style={{
        backgroundColor: 'var(--sidebar-search-bg)',
        borderColor: 'var(--sidebar-search-border)',
        color: 'var(--sidebar-search-text)',
        ['--tw-ring-color' as any]: 'var(--sidebar-search-focus-ring)',
      }}
    />
  );
}
