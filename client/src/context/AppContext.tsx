import { createContext, useContext, useReducer, useEffect, type Dispatch } from 'react';
import type { Project, Session, SearchResult, FilterState } from '../types';
import { DEFAULT_FILTERS } from '../types';

export type ThemeName = 'forest' | 'aurora' | 'sunset' | 'ocean' | 'midnight' | 'moss';
export type FontFamily = 'inter' | 'plex' | 'lora' | 'geist';
export type FontSize = 'sm' | 'md' | 'lg';

interface SettingsState {
  theme: ThemeName;
  fontFamily: FontFamily;
  fontSize: FontSize;
  expandThinkingByDefault: boolean;
  expandToolCallsByDefault: boolean;
  darkMode: boolean;
}

interface AppState {
  projects: Project[];
  sessions: Session[];
  selectedProjectId: string | null;
  selectedSessionId: string | null;
  searchQuery: string;
  searchResults: SearchResult[] | null;
  collapsedBlocks: Set<string>;
  loadingProjects: boolean;
  loadingSessions: boolean;
  loadingTranscript: boolean;
  error: string | null;
  filters: FilterState;
  settings: SettingsState;
  settingsOpen: boolean;
}

type Action =
  | { type: 'SET_PROJECTS'; projects: Project[] }
  | { type: 'SET_SESSIONS'; sessions: Session[] }
  | { type: 'SELECT_PROJECT'; projectId: string }
  | { type: 'SELECT_SESSION'; projectId: string; sessionId: string }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_SEARCH_RESULTS'; results: SearchResult[] | null }
  | { type: 'TOGGLE_BLOCK'; blockId: string }
  | { type: 'SET_LOADING'; key: 'projects' | 'sessions' | 'transcript'; value: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'TOGGLE_FILTER'; key: keyof FilterState }
  | { type: 'SET_READER_MODE'; enabled: boolean }
  | { type: 'CLEAR_SESSION' }
  | { type: 'SET_THEME'; theme: ThemeName }
  | { type: 'SET_FONT_FAMILY'; fontFamily: FontFamily }
  | { type: 'SET_FONT_SIZE'; fontSize: FontSize }
  | { type: 'SET_EXPAND_THINKING'; value: boolean }
  | { type: 'SET_EXPAND_TOOL_CALLS'; value: boolean }
  | { type: 'SET_DARK_MODE'; value: boolean }
  | { type: 'TOGGLE_SETTINGS' };

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem('cc-history-settings');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    theme: 'forest',
    fontFamily: 'inter',
    fontSize: 'md',
    expandThinkingByDefault: false,
    expandToolCallsByDefault: false,
    darkMode: false,
  };
}

function saveSettings(s: SettingsState) {
  try {
    localStorage.setItem('cc-history-settings', JSON.stringify(s));
  } catch { /* ignore */ }
}

const saved = loadSettings();

const initialState: AppState = {
  projects: [],
  sessions: [],
  selectedProjectId: null,
  selectedSessionId: null,
  searchQuery: '',
  searchResults: null,
  collapsedBlocks: new Set(),
  loadingProjects: false,
  loadingSessions: false,
  loadingTranscript: false,
  error: null,
  filters: { ...DEFAULT_FILTERS },
  settings: saved,
  settingsOpen: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects, loadingProjects: false };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.sessions, loadingSessions: false };
    case 'SELECT_PROJECT':
      return { ...state, selectedProjectId: action.projectId, sessions: [], loadingSessions: true };
    case 'SELECT_SESSION':
      return {
        ...state,
        selectedProjectId: action.projectId,
        selectedSessionId: action.sessionId,
        loadingTranscript: true,
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query, searchResults: action.query ? state.searchResults : null };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.results };
    case 'TOGGLE_BLOCK': {
      const next = new Set(state.collapsedBlocks);
      if (next.has(action.blockId)) next.delete(action.blockId);
      else next.add(action.blockId);
      return { ...state, collapsedBlocks: next };
    }
    case 'SET_LOADING':
      return { ...state, [`loading${action.key.charAt(0).toUpperCase() + action.key.slice(1)}`]: action.value };
    case 'SET_ERROR':
      return { ...state, error: action.error, loadingTranscript: false, loadingSessions: false, loadingProjects: false };
    case 'TOGGLE_FILTER': {
      const key = action.key;
      const newFilters = { ...state.filters, [key]: !state.filters[key] };
      if (key !== 'readerMode') newFilters.readerMode = false;
      return { ...state, filters: newFilters };
    }
    case 'SET_READER_MODE':
      return {
        ...state,
        filters: action.enabled
          ? { showThinking: false, showToolUse: false, showToolResult: false, showSystemEvents: false, readerMode: true }
          : { showThinking: true, showToolUse: true, showToolResult: true, showSystemEvents: true, readerMode: false },
      };
    case 'CLEAR_SESSION':
      return { ...state, selectedSessionId: null, loadingTranscript: false };
    case 'SET_THEME':
      return { ...state, settings: { ...state.settings, theme: action.theme } };
    case 'SET_FONT_FAMILY':
      return { ...state, settings: { ...state.settings, fontFamily: action.fontFamily } };
    case 'SET_FONT_SIZE':
      return { ...state, settings: { ...state.settings, fontSize: action.fontSize } };
    case 'SET_EXPAND_THINKING':
      return { ...state, settings: { ...state.settings, expandThinkingByDefault: action.value } };
    case 'SET_EXPAND_TOOL_CALLS':
      return { ...state, settings: { ...state.settings, expandToolCallsByDefault: action.value } };
    case 'SET_DARK_MODE':
      return { ...state, settings: { ...state.settings, darkMode: action.value } };
    case 'TOGGLE_SETTINGS':
      return { ...state, settingsOpen: !state.settingsOpen };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    saveSettings(state.settings);
  }, [state.settings]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
