import { Router, Response } from 'express';
import { db } from '../db/database';
import { authenticateJWT, AuthenticatedRequest } from '../middleware/authMiddleware';

export const auditRouter = Router();

// Apply JWT Authentication to all audit endpoints
auditRouter.use(authenticateJWT);

/**
 * GET /api/audit/stats
 * Get statistical overview of administrative audit actions
 */
auditRouter.get('/stats', (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = db.getAuditStats();
    return res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques d’audit',
      details: error.message,
    });
  }
});

/**
 * GET /api/audit
 * Get filtered audit logs with pagination and search
 */
auditRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resource, action, role, username, search, startDate, endDate, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : 200;

    const logs = db.getAllAuditLogs({
      resource: resource as string,
      action: action as string,
      role: role as string,
      username: username as string,
      search: search as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: parsedLimit,
    });

    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du journal d’audit',
      details: error.message,
    });
  }
});

/**
 * GET /api/audit/:id
 * Get details of a single audit log
 */
auditRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const log = db.getAuditLogById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Entrée du journal d’audit introuvable',
      });
    }

    return res.json({
      success: true,
      log,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la lecture de l’entrée d’audit',
      details: error.message,
    });
  }
});
