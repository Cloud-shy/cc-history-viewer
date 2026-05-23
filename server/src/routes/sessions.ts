import { Router } from 'express';

export const sessionsRouter = Router({ mergeParams: true });

sessionsRouter.get('/:projectId/sessions', async (req, res, next) => {
  try {
    const { getProjectSessions } = await import('../services/projectScanner');
    const sessions = await getProjectSessions(req.params.projectId);
    res.json({ projectId: req.params.projectId, sessions });
  } catch (err) {
    next(err);
  }
});
