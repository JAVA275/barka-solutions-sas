import { Router } from 'express';
import * as companyController from '../controllers/companyController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

export const companyRouter = Router();

// GET /api/company (Public)
companyRouter.get('/', companyController.getCompanySettings);

// PUT /api/company (Protected - ADMIN Only)
companyRouter.put('/', authenticateJWT, requireRole(['ADMIN']), companyController.updateCompanySettings);

// GET /api/company/mailer-status (Protected - Admin & Editor)
companyRouter.get('/mailer-status', authenticateJWT, companyController.getMailerStatus);

// POST /api/company/test-email (Protected - ADMIN Only)
companyRouter.post('/test-email', authenticateJWT, requireRole(['ADMIN']), companyController.triggerTestEmail);

export const healthRouter = Router();

// GET /api/health
healthRouter.get('/', companyController.getHealthCheck);

