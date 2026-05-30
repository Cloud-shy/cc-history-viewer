import { useAppState } from '../../context/AppContext';
import { ChatWindow } from '../chat/ChatWindow';
import { PanelLeftOpen } from 'lucide-react';

export function MainPanel() {
  const { state, dispatch } = useAppState();

  const showEdgeZone = state.sidebarState === 'hidden' && state.selectedSessionId;

  return (
    <main
      className="flex-1 flex flex-col min-w-0 relative"
      style={{ background: `linear-gradient(to bottom right, var(--page-from), var(--page-to))` }}
    >
      {/* Edge hover zone for hidden sidebar */}
      {showEdgeZone && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 group"
          style={{ zIndex: 'var(--z-panel)' }}
          onMouseEnter={() => {
            dispatch({ type: 'SET_SIDEBAR_STATE', state: 'icons' });
          }}
          title="Show sidebar"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-16 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--sidebar-from)', color: 'var(--sidebar-text-muted)' }}>
            <PanelLeftOpen size={16} />
          </div>
        </div>
      )}

      {!state.selectedSessionId ? (
        <div className="flex-1 flex items-center justify-center">
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
            <div className="mt-6 flex items-center justify-center gap-6 text-xs" style={{ color: 'var(--empty-subtitle)', opacity: 0.6 }}>
              <span><kbd className="px-2 py-0.5 rounded-md font-mono text-xs border" style={{ borderColor: 'var(--filter-sep)', backgroundColor: 'var(--filter-active-bg)' }}>Ctrl+K</kbd> Search</span>
              <span><kbd className="px-2 py-0.5 rounded-md font-mono text-xs border" style={{ borderColor: 'var(--filter-sep)', backgroundColor: 'var(--filter-active-bg)' }}>Ctrl+B</kbd> Sidebar</span>
              <span><kbd className="px-2 py-0.5 rounded-md font-mono text-xs border" style={{ borderColor: 'var(--filter-sep)', backgroundColor: 'var(--filter-active-bg)' }}>Del</kbd> Delete</span>
            </div>
          </div>
        </div>
      ) : (
        <ChatWindow projectId={state.selectedProjectId!} sessionId={state.selectedSessionId} />
      )}
    </main>
  );
}
