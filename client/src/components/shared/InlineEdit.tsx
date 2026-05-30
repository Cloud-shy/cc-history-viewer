import { useState, useRef, useEffect } from 'react';

interface InlineEditProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  placeholder?: string;
}

export function InlineEdit({ value, onSave, className = '', placeholder = 'Untitled' }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (trimmed && trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
    setText(value);
  };

  const handleCancel = () => {
    setEditing(false);
    setText(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`w-full px-2 py-0.5 text-sm border outline-none ${className}`}
        style={{
          backgroundColor: 'var(--inline-edit-bg)',
          borderColor: 'var(--inline-edit-border)',
          color: 'var(--inline-edit-text)',
          fontFamily: 'var(--font-mono)',
        }}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:underline decoration-dotted underline-offset-2 ${className}`}
      title="Click to rename"
    >
      {value || placeholder}
    </span>
  );
}
