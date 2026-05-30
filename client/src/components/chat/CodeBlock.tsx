import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { lightTheme } from '../../utils/syntaxTheme';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="relative group my-3 rounded-xl overflow-hidden border"
      style={{
        borderColor: 'var(--code-border)',
        boxShadow: 'var(--shadow-surface)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 text-xs font-medium border-b"
        style={{
          backgroundColor: 'var(--code-bg)',
          borderColor: 'var(--code-border)',
          color: 'var(--header-text)',
        }}
      >
        <span className="uppercase tracking-wider opacity-50">{language || 'text'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100"
          style={{ color: 'var(--header-text)' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <SyntaxHighlighter
        style={lightTheme}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '0',
          fontSize: '15px',
          lineHeight: '1.6',
          padding: '16px',
          maxHeight: '600px',
          overflowY: 'auto',
          backgroundColor: 'var(--code-bg)',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
