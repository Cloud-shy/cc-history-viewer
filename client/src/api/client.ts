const BASE_URL = 'http://localhost:3001/api';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getProjects: () => fetchJson<{ projects: import('../types').Project[] }>('/projects'),

  getSessions: (projectId: string) =>
    fetchJson<{ projectId: string; sessions: import('../types').Session[] }>(
      `/projects/${encodeURIComponent(projectId)}/sessions`
    ),

  getTranscript: (projectId: string, sessionId: string, limit = 200, offset = 0) =>
    fetchJson<import('../types').TranscriptResponse>(
      `/sessions/${encodeURIComponent(projectId)}/${encodeURIComponent(sessionId)}?limit=${limit}&offset=${offset}`
    ),

  search: (query: string) =>
    fetchJson<{ query: string; results: import('../types').SearchResult[] }>(
      `/search?q=${encodeURIComponent(query)}`
    ),

  deleteSession: (projectId: string, sessionId: string) =>
    fetchJson<{ ok: boolean }>(
      `/sessions/${encodeURIComponent(projectId)}/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' }
    ),

  updateSession: (projectId: string, sessionId: string, body: { title?: string; starred?: boolean }) =>
    fetchJson<{ ok: boolean }>(
      `/sessions/${encodeURIComponent(projectId)}/${encodeURIComponent(sessionId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    ),
};
