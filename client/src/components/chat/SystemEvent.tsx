import type { NormalizedEvent } from '../../types';

interface SystemEventProps {
  event: NormalizedEvent;
}

const LABELS: Record<string, string> = {
  'permission-mode': 'Permission mode changed',
  'ai-title': 'Session titled',
  'last-prompt': 'Last prompt',
  system: 'System',
  'file-history-snapshot': 'File snapshot saved',
};

export function SystemEvent({ event }: SystemEventProps) {
  const label = LABELS[event.systemType || ''] || event.systemType || 'System';
  const title = event.systemType === 'ai-title'
    ? `"${(event.systemData as Record<string, unknown>)?.title || 'Untitled'}"`
    : undefined;

  return (
    <div className="flex justify-center py-2">
      <div className="text-sm flex items-center gap-3" style={{ color: 'var(--system-text)' }}>
        <span className="h-px w-10" style={{ backgroundColor: 'var(--system-line)' }} />
        <span>{label}</span>
        {title && <span className="italic opacity-60">{title}</span>}
        <span className="h-px w-10" style={{ backgroundColor: 'var(--system-line)' }} />
      </div>
    </div>
  );
}
