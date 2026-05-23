interface SessionListProps {
  groups: {
    projectId: string;
    projectName: string;
    sessions: {
      sessionId: string;
      title: string | null;
      timestamp: string | null;
      matchSnippet?: string;
    }[];
  }[];
  selectedSessionId: string | null;
  onSessionClick: (projectId: string, sessionId: string) => void;
}

export function SessionList({ groups, selectedSessionId, onSessionClick }: SessionListProps) {
  return (
    <div>
      {groups.map((group) => (
        <div key={group.projectId}>
          <div
            className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--sidebar-text-muted)' }}
          >
            {group.projectName}
          </div>
          {group.sessions.map((session) => (
            <button
              key={session.sessionId}
              onClick={() => onSessionClick(group.projectId, session.sessionId)}
              className="w-full text-left px-4 py-2.5 transition-all"
              style={{
                color: selectedSessionId === session.sessionId ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                backgroundColor: selectedSessionId === session.sessionId ? 'var(--sidebar-active-bg)' : 'transparent',
                borderLeft: selectedSessionId === session.sessionId ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (selectedSessionId !== session.sessionId) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
              }}
              onMouseLeave={(e) => {
                if (selectedSessionId !== session.sessionId) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="text-sm font-medium truncate">
                {session.title || session.matchSnippet || 'Untitled'}
              </div>
              {session.timestamp && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--sidebar-text-muted)', opacity: 0.6 }}>
                  {new Date(session.timestamp).toLocaleDateString()}
                </div>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
