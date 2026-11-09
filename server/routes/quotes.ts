import { Router } from 'express';
import * as quotesController from '../controllers/quotesController';
import { quoteUpload, validateQuoteFilesMiddleware } from '../middleware/uploadMiddleware';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';
import { validateQuoteInput, validatePricingInput } from '../middleware/validationMiddleware';
import {
  quotesRateLimiter,
  uploadAbuseLimiter,
  honeypotBotGuard,
} from '../middleware/rateLimiter';

export const quotesRouter = Router();

// POST /api/quotes/calculate-price (Public Pricing Estimation Helper - BUG-007 Fix)
quotesRouter.post('/calculate-price', validatePricingInput, quotesController.calculatePrice);

// POST /api/quotes (Public Quote Creation with Multipart Real Uploads & Server Security Pipeline)
quotesRouter.post(
  '/',
  quotesRateLimiter,
  quoteUpload.array('files', 5),
  validateQuoteFilesMiddleware,
  uploadAbuseLimiter,
  honeypotBotGuard,
  validateQuoteInput,
  quotesController.createQuote
);

// GET /api/quotes (Protected - Admin & Editor)
quotesRouter.get('/', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), quotesController.listQuotes);

// GET /api/quotes/:quoteId/files/:fileId (Protected File Download - Admin & Editor)
quotesRouter.get('/:quoteId/files/:fileId', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), quotesController.downloadQuoteFile);

// GET /api/quotes/:id (Protected - Admin & Editor)
quotesRouter.get('/:id', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), quotesController.getQuote);

// PATCH /api/quotes/:id (Protected - Admin & Editor)
quotesRouter.patch('/:id', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), quotesController.updateQuote);

// DELETE /api/quotes/:id (Protected - ADMIN ONLY)
quotesRouter.delete('/:id', authenticateJWT, requireRole(['ADMIN']), quotesController.deleteQuote);
