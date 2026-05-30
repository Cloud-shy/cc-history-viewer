export interface HistoryEntry {
  display: string;
  pastedContents: Record<string, unknown>;
  timestamp: number;
  project: string;
  sessionId: string;
}

export interface ProjectSummary {
  id: string;
  displayPath: string;
  shortName: string;
  sessionCount: number;
}

export interface SessionSummary {
  sessionId: string;
  title: string | null;
  firstPrompt: string | null;
  messageCount: number;
  startedAt: string | null;
  lastActivityAt: string | null;
  gitBranch: string | null;
  starred: boolean;
}

export interface NormalizedEvent {
  type: 'user' | 'assistant' | 'system';
  uuid?: string;
  timestamp?: string;
  // user
  content?: string;
  // assistant
  model?: string;
  blocks?: ContentBlock[];
  usage?: TokenUsage | null;
  // system
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
  subagents: SubagentInfo[];
}

export interface SubagentInfo {
  agentType: string;
  description: string;
  sessionId: string;
  events: NormalizedEvent[];
}

export interface SearchResult {
  projectId: string;
  sessionId: string;
  title: string | null;
  matchField: string;
  matchSnippet: string;
  timestamp: string | null;
}
