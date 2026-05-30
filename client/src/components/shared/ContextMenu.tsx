import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: {
    label: string;
    shortcut?: string;
    danger?: boolean;
    action: () => void;
  }[];
}

export function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 38);

  return (
    <div
      ref={ref}
      className="fixed z-50 py-1 w-48 animate-[scaleIn_0.1s_ease-out]"
      style={{
        left: adjustedX,
        top: adjustedY,
        backgroundColor: 'var(--context-menu-bg)',
        border: '1px solid var(--context-menu-border)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => { item.action(); onClose(); }}
          className="w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors uppercase tracking-wider"
          style={{
            color: item.danger ? 'var(--danger-text)' : 'var(--context-menu-text)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = item.danger
              ? 'var(--danger-hover-bg)'
              : 'var(--context-menu-hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <span>{item.label}</span>
          {item.shortcut && (
            <span className="text-[10px] opacity-30 ml-4 normal-case tracking-normal" style={{ fontFamily: 'var(--font-mono)' }}>
              {item.shortcut}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
