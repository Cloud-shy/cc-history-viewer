import type { NormalizedEvent } from '../types';

function formatMdDate(ts: string): string {
  return new Date(ts).toLocaleString();
}

export function eventsToMarkdown(events: NormalizedEvent[], title?: string): string {
  const lines: string[] = [];

  if (title) {
    lines.push(`# ${title}`, '');
  }

  for (const event of events) {
    if (event.type === 'system') continue;

    if (event.type === 'user') {
      lines.push('---', '');
      lines.push('**You:**');
      if (event.timestamp) lines.push(`*${formatMdDate(event.timestamp)}*`);
      lines.push('', event.content || '', '');
    }

    if (event.type === 'assistant') {
      lines.push('**Claude:**');
      if (event.timestamp) lines.push(`*${formatMdDate(event.timestamp)}*`);
      if (event.model) lines.push(`*Model: ${event.model}*`);
      lines.push('');

      if (event.blocks) {
        for (const block of event.blocks) {
          switch (block.blockType) {
            case 'text':
              lines.push(block.content, '');
              break;
            case 'thinking':
              lines.push('<details>', '<summary>Thinking</summary>', '', block.content, '', '</details>', '');
              break;
            case 'tool_use':
              lines.push(
                '```json',
                `// Tool: ${block.toolName}`,
                JSON.stringify(block.toolInput, null, 2),
                '```',
                ''
              );
              break;
            case 'tool_result':
              lines.push(
                '<details>',
                block.isError ? '<summary>Error</summary>' : '<summary>Result</summary>',
                '',
                '```',
                block.content.slice(0, 5000),
                '```',
                '',
                '</details>',
                ''
              );
              break;
          }
        }
      }
    }
  }

  return lines.join('\n');
}

export function downloadMarkdown(events: NormalizedEvent[], filename: string) {
  const md = eventsToMarkdown(events);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
