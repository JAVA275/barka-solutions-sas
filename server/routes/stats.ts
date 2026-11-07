import { Router } from 'express';
import * as statsController from '../controllers/statsController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

export const statsRouter = Router();

// GET /api/stats (Protected - Admin & Editor)
statsRouter.get('/', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), statsController.getStats);
