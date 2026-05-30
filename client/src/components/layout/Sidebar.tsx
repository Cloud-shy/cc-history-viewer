import { useEffect, useState, useCallback } from 'react';
import { useAppState } from '../../context/AppContext';
import { api } from '../../api/client';
import { SearchBar } from '../sidebar/SearchBar';
import { SessionList } from '../sidebar/SessionList';
import { ContextMenu } from '../shared/ContextMenu';
import {
  PanelLeftOpen,
  PanelLeftClose,
  Search,
  Star,
  Settings,
  Folder,
  MessageSquare,
} from 'lucide-react';

export function Sidebar() {
  const { state, dispatch, showToast } = useAppState();
  const [tooltipProject, setTooltipProject] = useState<string | null>(null);

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

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, projectId: string, sessionId: string, title: string | null) => {
      e.preventDefault();
      dispatch({
        type: 'SHOW_CONTEXT_MENU',
        menu: { x: e.clientX, y: e.clientY, projectId, sessionId, title },
      });
    },
    [dispatch]
  );

  const handleRename = useCallback(
    async (projectId: string, sessionId: string, newTitle: string) => {
      try {
        await api.updateSession(projectId, sessionId, { title: newTitle });
        dispatch({ type: 'RENAME_SESSION', sessionId, title: newTitle });
        showToast('Session renamed');
      } catch (err: any) {
        showToast(err?.message || 'Failed to rename session', 'error');
      }
    },
    [dispatch, showToast]
  );

  const handleToggleStar = useCallback(
    async (projectId: string, sessionId: string, currentStarred: boolean) => {
      try {
        await api.updateSession(projectId, sessionId, { starred: !currentStarred });
        dispatch({ type: 'TOGGLE_STAR_SESSION', sessionId });
        showToast(currentStarred ? 'Removed from favorites' : 'Added to favorites');
      } catch (err: any) {
        showToast(err?.message || 'Failed to update session', 'error');
      }
    },
    [dispatch, showToast]
  );

  const handleDelete = useCallback(
    async (projectId: string, sessionId: string) => {
      if (!confirm('Delete this conversation? This cannot be undone.')) return;
      try {
        await api.deleteSession(projectId, sessionId);
        if (sessionId === state.selectedSessionId) {
          dispatch({ type: 'CLEAR_SESSION' });
        }
        const data = await api.getSessions(projectId);
        dispatch({ type: 'SET_SESSIONS', sessions: data.sessions });
        showToast('Session deleted');
      } catch (err: any) {
        showToast(err?.message || 'Failed to delete session', 'error');
      }
    },
    [state.selectedSessionId, dispatch, showToast]
  );

  const toggleSidebar = () => {
    const next = state.sidebarState === 'expanded' ? 'icons' : 'expanded';
    dispatch({ type: 'SET_SIDEBAR_STATE', state: next });
  };

  const starCount = state.sessions.filter((s) => s.starred).length;

  // --- ICON BAR ---
  if (state.sidebarState === 'icons') {
    return (
      <aside
        className="flex-shrink-0 border-r flex flex-col items-center h-full shadow-2xl sidebar-transition"
        style={{
          width: 56,
          background: `linear-gradient(to bottom, var(--sidebar-from), var(--sidebar-to))`,
          borderColor: 'var(--sidebar-border)',
        }}
      >
        <button
          onClick={toggleSidebar}
          className="w-full flex justify-center py-3 hover:bg-white/5 transition-colors"
          style={{ color: 'var(--sidebar-text-muted)' }}
          title="Expand sidebar (Ctrl+B)"
        >
          <PanelLeftOpen size={18} />
        </button>

        <button
          onClick={() => dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors my-2"
          style={{ color: 'var(--sidebar-text-muted)' }}
          title="Search (Ctrl+K)"
        >
          <Search size={18} />
        </button>

        {starCount > 0 && (
          <div
            className="flex items-center gap-1 text-[11px] mb-2"
            style={{ color: 'var(--star-color)' }}
            title={`${starCount} favorites`}
          >
            <Star size={14} fill="currentColor" />
            <span>{starCount}</span>
          </div>
        )}

        <div className="w-8 h-px my-2 opacity-10" style={{ backgroundColor: 'var(--sidebar-text)' }} />

        <div className="flex-1 flex flex-col items-center gap-1 py-2 overflow-y-auto w-full">
          {state.projects.map((project) => (
            <div key={project.id} className="relative">
              <button
                onClick={() => handleProjectClick(project.id)}
                onMouseEnter={() => setTooltipProject(project.id)}
                onMouseLeave={() => setTooltipProject(null)}
                className="w-10 h-10 flex items-center justify-center rounded-lg transition-all"
                style={{
                  backgroundColor: state.selectedProjectId === project.id
                    ? 'var(--sidebar-active-bg)'
                    : 'transparent',
                  color: state.selectedProjectId === project.id
                    ? 'var(--sidebar-text)'
                    : 'var(--sidebar-text-muted)',
                }}
                title={project.shortName}
              >
                <Folder size={18} />
              </button>
              {tooltipProject === project.id && (
                <div
                  className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs whitespace-nowrap rounded-lg shadow-lg pointer-events-none"
                  style={{
                    backgroundColor: 'var(--context-menu-bg)',
                    color: 'var(--context-menu-text)',
                    border: '1px solid var(--context-menu-border)',
                    boxShadow: 'var(--shadow-overlay)',
                    zIndex: 'var(--z-overlay)',
                    animation: 'scaleIn var(--duration-fast) var(--ease-spring)',
                  }}
                >
                  <div className="font-medium">{project.shortName}</div>
                  <div className="opacity-50">{project.sessionCount} sessions</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors mb-2"
          style={{ color: 'var(--sidebar-text-muted)' }}
          title="Settings"
        >
          <Settings size={18} />
        </button>

        {state.contextMenu && (
          <ContextMenu
            x={state.contextMenu.x}
            y={state.contextMenu.y}
            onClose={() => dispatch({ type: 'HIDE_CONTEXT_MENU' })}
            items={[
              {
                label: 'Rename', shortcut: 'F2',
                action: () => {
                  const newTitle = prompt('New name:', state.contextMenu!.title || '');
                  if (newTitle && newTitle.trim()) {
                    handleRename(state.contextMenu!.projectId, state.contextMenu!.sessionId, newTitle.trim());
                  }
                },
              },
              {
                label: state.sessions.find((s) => s.sessionId === state.contextMenu?.sessionId)?.starred
                  ? 'Remove from favorites' : 'Add to favorites',
                shortcut: '',
                action: () => {
                  const session = state.sessions.find((s) => s.sessionId === state.contextMenu?.sessionId);
                  if (session) handleToggleStar(state.contextMenu!.projectId, state.contextMenu!.sessionId, session.starred);
                },
              },
              {
                label: 'Delete', shortcut: 'Del', danger: true,
                action: () => handleDelete(state.contextMenu!.projectId, state.contextMenu!.sessionId),
              },
            ]}
          />
        )}
      </aside>
    );
  }

  // --- HIDDEN ---
  if (state.sidebarState === 'hidden') {
    return null;
  }

  // --- EXPANDED (full sidebar) ---
  const projectGroups = state.searchResults
    ? groupByProject(state.searchResults, state.projects)
    : null;

  return (
    <aside
      className="flex-shrink-0 border-r flex flex-col h-full shadow-2xl sidebar-transition relative"
      style={{
        width: 320,
        background: `linear-gradient(to bottom, var(--sidebar-from), var(--sidebar-to))`,
        borderColor: 'var(--sidebar-border)',
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
            style={{ background: `linear-gradient(to bottom right, var(--empty-icon-from), var(--empty-icon-to))` }}
          >
            <MessageSquare size={16} className="text-white" />
          </div>
          <h1 className="text-base font-semibold flex-1" style={{ color: 'var(--sidebar-text)' }}>CC History</h1>
          <button
            onClick={toggleSidebar}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors flex-shrink-0"
            style={{ color: 'var(--sidebar-text-muted)' }}
            title="Collapse sidebar (Ctrl+B)"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
        <SearchBar />
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.loadingProjects && (
          <div className="p-4 space-y-2">
            <div className="skeleton h-8" />
            <div className="skeleton h-8" />
            <div className="skeleton h-8" />
          </div>
        )}
        {state.error && (
          <div className="p-4 text-sm text-rose-400">{state.error}</div>
        )}
        {projectGroups ? (
          <SessionList
            groups={projectGroups}
            selectedSessionId={state.selectedSessionId}
            onSessionClick={handleSessionClick}
            onContextMenu={handleContextMenu}
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
                <span className="truncate flex items-center gap-2">
                  <Folder size={14} style={{ color: 'var(--sidebar-text-muted)', opacity: 0.5 }} />
                  {project.shortName}
                </span>
                <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--sidebar-text-muted)' }}>
                  {project.sessionCount}
                </span>
              </button>
              {state.selectedProjectId === project.id && (
                <div className="ml-2">
                  {state.loadingSessions ? (
                    <div className="p-3 space-y-2">
                      <div className="skeleton h-10" />
                      <div className="skeleton h-10" />
                      <div className="skeleton h-10" />
                    </div>
                  ) : (
                    state.sessions.map((session) => (
                      <div
                        key={session.sessionId}
                        onContextMenu={(e) => handleContextMenu(e, project.id, session.sessionId, session.title)}
                      >
                        <button
                          onClick={() => handleSessionClick(project.id, session.sessionId)}
                          className="w-full text-left px-3 py-2.5 text-sm transition-all rounded-r-lg mr-1 flex items-center gap-1.5"
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
                          {session.starred && (
                            <Star size={12} className="flex-shrink-0" style={{ color: 'var(--star-color)' }} fill="currentColor" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{session.title || session.firstPrompt || 'Untitled'}</div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--sidebar-text-muted)', opacity: 0.6 }}>
                              {session.lastActivityAt ? new Date(session.lastActivityAt).toLocaleDateString() : ''}
                              {session.gitBranch ? ` · ${session.gitBranch}` : ''}
                            </div>
                          </div>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="border-t p-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
          style={{ color: 'var(--sidebar-text-muted)' }}
        >
          <Settings size={18} />
          Settings
        </button>
      </div>

      {state.contextMenu && (
        <ContextMenu
          x={state.contextMenu.x}
          y={state.contextMenu.y}
          onClose={() => dispatch({ type: 'HIDE_CONTEXT_MENU' })}
          items={[
            {
              label: 'Rename', shortcut: 'F2',
              action: () => {
                const newTitle = prompt('New name:', state.contextMenu!.title || '');
                if (newTitle && newTitle.trim()) {
                  handleRename(state.contextMenu!.projectId, state.contextMenu!.sessionId, newTitle.trim());
                }
              },
            },
            {
              label: state.sessions.find((s) => s.sessionId === state.contextMenu?.sessionId)?.starred
                ? 'Remove from favorites' : 'Add to favorites',
              shortcut: '',
              action: () => {
                const session = state.sessions.find((s) => s.sessionId === state.contextMenu?.sessionId);
                if (session) handleToggleStar(state.contextMenu!.projectId, state.contextMenu!.sessionId, session.starred);
              },
            },
            {
              label: 'Delete', shortcut: 'Del', danger: true,
              action: () => handleDelete(state.contextMenu!.projectId, state.contextMenu!.sessionId),
            },
          ]}
        />
      )}
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
