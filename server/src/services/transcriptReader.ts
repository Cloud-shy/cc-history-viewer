import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { CLAUDE_HOME } from '../config';
import type { NormalizedEvent, TranscriptResponse, ContentBlock, SubagentInfo } from '../types';

const PROJECTS_DIR = path.join(CLAUDE_HOME, 'projects');

export async function readTranscript(
  projectId: string,
  sessionId: string,
  options: { limit: number; offset: number; includeSubagents: boolean }
): Promise<TranscriptResponse> {
  const filePath = path.join(PROJECTS_DIR, projectId, `${sessionId}.jsonl`);

  if (!fs.existsSync(filePath)) {
    throw Object.assign(new Error(`Session not found: ${sessionId}`), { statusCode: 404 });
  }

  const { events, totalEvents, parseWarnings, toolResults } = await parseTranscriptFile(
    filePath,
    options.limit,
    options.offset
  );

  // Associate tool results with their tool calls
  const normalized = associateToolResults(events, toolResults);

  // Load subagents if requested
  let subagents: SubagentInfo[] = [];
  if (options.includeSubagents) {
    subagents = await loadSubagents(projectId, sessionId);
  }

  return {
    projectId,
    sessionId,
    totalEvents,
    events: normalized,
    parseWarnings,
    subagents,
  };
}

function parseTranscriptFile(
  filePath: string,
  limit: number,
  offset: number
): Promise<{
  events: NormalizedEvent[];
  totalEvents: number;
  parseWarnings: number;
  toolResults: Map<string, { content: string; isError: boolean; timestamp?: string }>;
}> {
  return new Promise((resolve, reject) => {
    const events: NormalizedEvent[] = [];
    let totalEvents = 0;
    let parseWarnings = 0;
    let skipped = 0;
    const toolResults = new Map<string, { content: string; isError: boolean; timestamp?: string }>();

    const stream = fs.createReadStream(filePath, 'utf-8');
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    rl.on('line', (line: string) => {
      if (!line.trim()) return;
      totalEvents++;

      let obj: Record<string, unknown>;
      try {
        obj = JSON.parse(line);
      } catch {
        parseWarnings++;
        return;
      }

      const event = normalizeEvent(obj);
      if (!event) return;

      // Collect tool results separately for association
      if (event.type === 'system' && event.systemType === 'tool_result') {
        const data = event.systemData || {};
        toolResults.set(data.toolUseId as string, {
          content: data.content as string || '',
          isError: (data.isError as boolean) || false,
          timestamp: event.timestamp,
        });
        return; // Don't add to events array directly
      }

      // Apply offset/limit (skip events before offset)
      if (skipped < offset) {
        skipped++;
        return;
      }
      if (events.length >= limit) return;

      events.push(event);
    });

    rl.on('close', () => {
      resolve({ events, totalEvents: totalEvents - toolResults.size, parseWarnings, toolResults });
    });

    rl.on('error', reject);
  });
}

function normalizeEvent(obj: Record<string, unknown>): NormalizedEvent | null {
  const type = obj.type as string;
  const timestamp = typeof obj.timestamp === 'number'
    ? new Date(obj.timestamp as number).toISOString()
    : (obj.timestamp as string) || undefined;

  // User message
  if (type === 'user') {
    const message = obj.message as Record<string, unknown> | undefined;
    if (!message || message.role !== 'user') return null;

    const content = message.content;
    if (typeof content === 'string') {
      return {
        type: 'user',
        uuid: obj.uuid as string,
        timestamp,
        content,
      };
    }

    // Content is an array — could be tool results
    if (Array.isArray(content)) {
      for (const block of content) {
        if (typeof block === 'object' && block && (block as Record<string, unknown>).type === 'tool_result') {
          const tr = block as Record<string, unknown>;
          return {
            type: 'system',
            timestamp,
            systemType: 'tool_result',
            systemData: {
              toolUseId: tr.tool_use_id as string,
              content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content || ''),
              isError: (tr.is_error as boolean) || false,
            },
          };
        }
      }
    }
    return null;
  }

  // Assistant message
  if (type === 'assistant') {
    const message = obj.message as Record<string, unknown> | undefined;
    if (!message || message.role !== 'assistant') return null;

    const content = message.content as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(content)) return null;

    const blocks: ContentBlock[] = [];

    for (const block of content) {
      const blockType = block.type as string;
      if (blockType === 'thinking') {
        blocks.push({
          blockType: 'thinking',
          content: block.thinking as string || '',
          signature: block.signature as string,
        });
      } else if (blockType === 'text') {
        const text = (block.text as string) || '';
        if (text.trim()) {
          blocks.push({ blockType: 'text', content: text });
        }
      } else if (blockType === 'tool_use') {
        blocks.push({
          blockType: 'tool_use',
          toolName: block.name as string || 'unknown',
          toolInput: (block.input as Record<string, unknown>) || {},
          toolId: block.id as string || '',
        });
      }
    }

    if (blocks.length === 0) return null;

    return {
      type: 'assistant',
      uuid: obj.uuid as string,
      timestamp,
      model: message.model as string,
      blocks,
      usage: message.usage ? {
        input_tokens: (message.usage as Record<string, number>).input_tokens || 0,
        output_tokens: (message.usage as Record<string, number>).output_tokens || 0,
      } : null,
    };
  }

  // System events
  if (type === 'permission-mode' || type === 'file-history-snapshot' || type === 'last-prompt') {
    return {
      type: 'system',
      timestamp,
      systemType: type,
      systemData: obj,
    };
  }

  if (type === 'ai-title') {
    return {
      type: 'system',
      timestamp,
      systemType: 'ai-title',
      systemData: { title: obj.aiTitle },
    };
  }

  if (type === 'attachment') {
    return null; // Skip attachment listings — too verbose
  }

  if (type === 'system') {
    return {
      type: 'system',
      timestamp,
      systemType: 'system',
      systemData: obj,
    };
  }

  return null;
}

function associateToolResults(
  events: NormalizedEvent[],
  toolResults: Map<string, { content: string; isError: boolean; timestamp?: string }>
): NormalizedEvent[] {
  // For each assistant event with tool_use blocks, look for matching tool results
  return events.map((event) => {
    if (event.type !== 'assistant' || !event.blocks) return event;

    const newBlocks: ContentBlock[] = [];

    for (const block of event.blocks) {
      newBlocks.push(block);

      if (block.blockType === 'tool_use') {
        const result = toolResults.get(block.toolId);
        if (result) {
          newBlocks.push({
            blockType: 'tool_result',
            content: result.content,
            toolUseId: block.toolId,
            isError: result.isError,
          });
        }
      }
    }

    return { ...event, blocks: newBlocks };
  });
}

async function loadSubagents(projectId: string, sessionId: string): Promise<SubagentInfo[]> {
  const subagentsDir = path.join(PROJECTS_DIR, projectId, sessionId, 'subagents');
  const subagents: SubagentInfo[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(subagentsDir, { withFileTypes: true });
  } catch {
    return subagents;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;

    const subagentFile = path.join(subagentsDir, entry.name);
    const subagentId = entry.name.replace('.jsonl', '');

    // Build description from filename
    const descMatch = subagentId.match(/^agent-[a-f0-9]+-(.+)$/);
    const description = descMatch ? descMatch[1] : subagentId;

    try {
      const { events } = await parseTranscriptFile(subagentFile, 500, 0);
      subagents.push({
        agentType: 'subagent',
        description,
        sessionId: subagentId,
        events: associateToolResults(events, new Map()),
      });
    } catch {
      // skip unparseable subagent files
    }
  }

  return subagents;
}
