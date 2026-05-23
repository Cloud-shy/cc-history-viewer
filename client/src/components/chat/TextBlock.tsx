import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TextBlockProps {
  content: string;
}

export function TextBlock({ content }: TextBlockProps) {
  return (
    <div className="prose dark:prose-invert max-w-none text-base leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');
            const isInline = !match && !codeStr.includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md text-[0.875em] font-mono border"
                  style={{
                    backgroundColor: 'var(--inline-code-bg)',
                    color: 'var(--inline-code-text)',
                    borderColor: 'var(--inline-code-border)',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div
                className="relative group my-3 rounded-xl overflow-hidden border shadow-md"
                style={{
                  borderColor: 'var(--code-border)',
                  boxShadow: `0 4px 6px -1px var(--code-shadow)`,
                }}
              >
                <button
                  onClick={() => navigator.clipboard.writeText(codeStr)}
                  className="absolute top-2 right-2 z-10 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                  }}
                >
                  Copy
                </button>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match?.[1] || 'text'}
                  PreTag="div"
                  customStyle={{ margin: 0, borderRadius: '0', fontSize: '0.85rem', padding: '1rem' }}
                >
                  {codeStr}
                </SyntaxHighlighter>
              </div>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--link)' }}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
