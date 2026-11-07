import { Router } from 'express';
import * as contactController from '../controllers/contactController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';
import { validateContactInput } from '../middleware/validationMiddleware';
import {
  contactRateLimiter,
  honeypotBotGuard,
} from '../middleware/rateLimiter';

export const contactRouter = Router();

// POST /api/contact (Public Message Submission with Rate Limiting, Honeypot & Strict Validation)
contactRouter.post(
  '/',
  contactRateLimiter,
  honeypotBotGuard,
  validateContactInput,
  contactController.sendMessage
);

// GET /api/contact (Protected - Admin & Editor)
contactRouter.get('/', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), contactController.listMessages);

// PATCH /api/contact/:id (Protected - Admin & Editor)
contactRouter.patch('/:id', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), contactController.updateMessage);

// DELETE /api/contact/:id (Protected - ADMIN ONLY)
contactRouter.delete('/:id', authenticateJWT, requireRole(['ADMIN']), contactController.deleteMessage);
