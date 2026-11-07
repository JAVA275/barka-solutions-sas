import { Router } from 'express';
import * as servicesController from '../controllers/servicesController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

export const servicesRouter = Router();

// GET /api/services (Public)
servicesRouter.get('/', servicesController.listServices);

// GET /api/services/:id (Public)
servicesRouter.get('/:id', servicesController.getService);

// POST /api/services (Protected - Admin & Editor)
servicesRouter.post('/', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), servicesController.createService);

// PATCH /api/services/:id (Protected - Admin & Editor)
servicesRouter.patch('/:id', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), servicesController.updateService);

// DELETE /api/services/:id (Protected - ADMIN ONLY)
servicesRouter.delete('/:id', authenticateJWT, requireRole(['ADMIN']), servicesController.deleteService);
