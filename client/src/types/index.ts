export interface Project {
  id: string;
  displayPath: string;
  shortName: string;
  sessionCount: number;
}

export interface Session {
  sessionId: string;
  title: string | null;
  firstPrompt: string | null;
  messageCount: number;
  startedAt: string | null;
  lastActivityAt: string | null;
  gitBranch: string | null;
}

export interface NormalizedEvent {
  type: 'user' | 'assistant' | 'system';
  uuid?: string;
  timestamp?: string;
  content?: string;
  model?: string;
  blocks?: ContentBlock[];
  usage?: TokenUsage | null;
  systemType?: string;
  systemData?: Record<string, unknown>;
}

export type ContentBlock =
  | { blockType: 'thinking'; content: string; signature?: string }
  | { blockType: 'text'; content: string }
  | { blockType: 'tool_use'; toolName: string; toolInput: Record<string, unknown>; toolId: string }
  | { blockType: 'tool_result'; content: string; toolUseId: string; isError: boolean };

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface TranscriptResponse {
  projectId: string;
  sessionId: string;
  totalEvents: number;
  events: NormalizedEvent[];
  parseWarnings: number;
}

export interface SearchResult {
  projectId: string;
  sessionId: string;
  title: string | null;
  matchField: string;
  matchSnippet: string;
  timestamp: string | null;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface SessionsResponse {
  projectId: string;
  sessions: Session[];
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export interface FilterState {
  showThinking: boolean;
  showToolUse: boolean;
  showToolResult: boolean;
  showSystemEvents: boolean;
  readerMode: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  showThinking: true,
  showToolUse: true,
  showToolResult: true,
  showSystemEvents: true,
  readerMode: false,
};
