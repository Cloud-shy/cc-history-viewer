import { Router } from 'express';

export const searchRouter = Router({ mergeParams: true });

searchRouter.get('/', async (req, res, next) => {
  try {
    const { search } = await import('../services/historyReader');
    const q = (req.query.q as string) || '';
    const results = await search(q);
    res.json({ query: q, results });
  } catch (err) {
    next(err);
  }
});
