import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export function getStats(_req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const stats = db.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
}
