import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { CLAUDE_HOME } from '../config';
import { updateMeta } from '../services/sessionMetadata';

export const transcriptRouter = Router({ mergeParams: true });

transcriptRouter.get('/:projectId/:sessionId', async (req, res, next) => {
  try {
    const { readTranscript } = await import('../services/transcriptReader');
    const limit = parseInt(req.query.limit as string) || 200;
    const offset = parseInt(req.query.offset as string) || 0;
    const includeSubagents = req.query.includeSubagents === 'true';
    const result = await readTranscript(
      req.params.projectId,
      req.params.sessionId,
      { limit, offset, includeSubagents }
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

transcriptRouter.patch('/:projectId/:sessionId', async (req, res, next) => {
  try {
    const { title, starred } = req.body;
    const patch: Record<string, unknown> = {};
    if (typeof title === 'string') patch.customTitle = title;
    if (typeof starred === 'boolean') patch.starred = starred;
    const meta = updateMeta(req.params.projectId, req.params.sessionId, patch);
    res.json({ ok: true, meta });
  } catch (err) {
    next(err);
  }
});

transcriptRouter.delete('/:projectId/:sessionId', async (req, res, next) => {
  try {
    const { deleteSession } = await import('../services/sessionDelete');
    await deleteSession(req.params.projectId, req.params.sessionId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
