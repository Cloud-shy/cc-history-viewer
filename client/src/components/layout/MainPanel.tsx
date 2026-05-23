import { useAppState } from '../../context/AppContext';
import { ChatWindow } from '../chat/ChatWindow';

export function MainPanel() {
  const { state } = useAppState();

  if (!state.selectedSessionId) {
    return (
      <main
        className="flex-1 flex items-center justify-center"
        style={{ background: `linear-gradient(to bottom right, var(--page-from), var(--page-to))` }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-lg"
            style={{
              background: `linear-gradient(to bottom right, var(--empty-icon-from), var(--empty-icon-to))`,
              boxShadow: `0 4px 12px var(--empty-icon-shadow)`,
            }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium" style={{ color: 'var(--empty-title)' }}>Select a session</p>
          <p className="text-sm mt-1" style={{ color: 'var(--empty-subtitle)' }}>Choose a project and session from the sidebar</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="flex-1 flex flex-col min-w-0"
      style={{ background: `linear-gradient(to bottom right, var(--page-from), var(--page-to))` }}
    >
      <ChatWindow projectId={state.selectedProjectId!} sessionId={state.selectedSessionId} />
    </main>
  );
}
