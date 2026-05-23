import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error & { statusCode?: number }, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode || 500;
  if (status >= 500) {
    console.error('Server error:', err.message);
  }
  res.status(status).json({
    error: {
      code: status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  });
}
