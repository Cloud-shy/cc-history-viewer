import { useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';
import { SearchBar } from '../sidebar/SearchBar';
import { SessionList } from '../sidebar/SessionList';

export function Sidebar() {
  const { state, dispatch } = useAppState();

  useEffect(() => {
    dispatch({ type: 'SET_LOADING', key: 'projects', value: true });
    api.getProjects()
      .then((data) => dispatch({ type: 'SET_PROJECTS', projects: data.projects }))
      .catch((err) => dispatch({ type: 'SET_ERROR', error: err.message }));
  }, [dispatch]);

  const handleProjectClick = (projectId: string) => {
    dispatch({ type: 'SELECT_PROJECT', projectId });
    api.getSessions(projectId)
      .then((data) => dispatch({ type: 'SET_SESSIONS', sessions: data.sessions }))
      .catch((err) => dispatch({ type: 'SET_ERROR', error: err.message }));
  };

  const handleSessionClick = (projectId: string, sessionId: string) => {
    dispatch({ type: 'SELECT_SESSION', projectId, sessionId });
  };

  const projectGroups = state.searchResults
    ? groupByProject(state.searchResults, state.projects)
    : null;

  return (
    <aside
      className="w-80 flex-shrink-0 border-r flex flex-col h-full shadow-2xl z-10"
      style={{
        background: `linear-gradient(to bottom, var(--sidebar-from), var(--sidebar-to))`,
        borderColor: 'var(--sidebar-border)',
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: `linear-gradient(to bottom right, var(--empty-icon-from), var(--empty-icon-to))` }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--sidebar-text)' }}>Claude Code History</h1>
        </div>
        <SearchBar />
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.loadingProjects && (
          <div className="p-4 text-sm" style={{ color: 'var(--sidebar-text-muted)' }}>Loading projects...</div>
        )}
        {state.error && (
          <div className="p-4 text-sm text-rose-400">{state.error}</div>
        )}
        {projectGroups ? (
          <SessionList
            groups={projectGroups}
            selectedSessionId={state.selectedSessionId}
            onSessionClick={handleSessionClick}
          />
        ) : state.searchQuery ? (
          <div className="p-4 text-sm" style={{ color: 'var(--sidebar-text-muted)' }}>Type to search...</div>
        ) : (
          state.projects.map((project) => (
            <div key={project.id}>
              <button
                onClick={() => handleProjectClick(project.id)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-between"
                style={{
                  color: state.selectedProjectId === project.id ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                  backgroundColor: state.selectedProjectId === project.id ? 'var(--sidebar-active-bg)' : 'transparent',
                  borderLeft: state.selectedProjectId === project.id ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (state.selectedProjectId !== project.id) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                }}
                onMouseLeave={(e) => {
                  if (state.selectedProjectId !== project.id) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span className="truncate">{project.shortName}</span>
                <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--sidebar-text-muted)' }}>
                  {project.sessionCount}
                </span>
              </button>
              {state.selectedProjectId === project.id && (
                <div className="ml-2">
                  {state.loadingSessions ? (
                    <div className="p-3 text-xs" style={{ color: 'var(--sidebar-text-muted)' }}>Loading...</div>
                  ) : (
                    state.sessions.map((session) => (
                      <button
                        key={session.sessionId}
                        onClick={() => handleSessionClick(project.id, session.sessionId)}
                        className="w-full text-left px-3 py-2.5 text-sm transition-all rounded-r-lg mr-1"
                        style={{
                          color: state.selectedSessionId === session.sessionId ? 'var(--sidebar-text)' : 'var(--sidebar-text-muted)',
                          backgroundColor: state.selectedSessionId === session.sessionId ? 'var(--sidebar-active-bg)' : 'transparent',
                          borderLeft: state.selectedSessionId === session.sessionId ? '3px solid var(--sidebar-active-border)' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (state.selectedSessionId !== session.sessionId) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover-bg)';
                        }}
                        onMouseLeave={(e) => {
                          if (state.selectedSessionId !== session.sessionId) e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <div className="truncate font-medium">{session.title || session.firstPrompt || 'Untitled'}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--sidebar-text-muted)', opacity: 0.6 }}>
                          {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleDateString() : ''}
                          {session.gitBranch ? ` · ${session.gitBranch}` : ''}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Settings gear at bottom */}
      <div className="border-t p-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
          style={{ color: 'var(--sidebar-text-muted)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>
    </aside>
  );
}

function groupByProject(
  results: { projectId: string; sessionId: string; title: string | null; timestamp: string | null; matchSnippet: string }[],
  projects: { id: string; shortName: string }[]
) {
  const map = new Map<string, typeof results>();
  for (const r of results) {
    const arr = map.get(r.projectId) || [];
    arr.push(r);
    map.set(r.projectId, arr);
  }
  return Array.from(map.entries()).map(([projectId, sessions]) => {
    const project = projects.find((p) => p.id === projectId);
    return { projectId, projectName: project?.shortName || projectId, sessions };
  });
}
