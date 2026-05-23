import { Router } from 'express';

export const projectsRouter = Router({ mergeParams: true });

projectsRouter.get('/', async (_req, res, next) => {
  try {
    const { scanProjects } = await import('../services/projectScanner');
    const projects = await scanProjects();
    res.json({ projects });
  } catch (err) {
    next(err);
  }
});
