import { Router } from 'express';
import * as portfolioController from '../controllers/portfolioController';
import { portfolioUpload, validatePortfolioFileMiddleware } from '../middleware/uploadMiddleware';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

export const portfolioRouter = Router();

// GET /api/portfolio (Public - List all with optional category filter)
portfolioRouter.get('/', portfolioController.listPortfolio);

// GET /api/portfolio/:id (Public - Get single item)
portfolioRouter.get('/:id', portfolioController.getPortfolioItem);

// POST /api/portfolio/upload-image (Protected - Upload single portfolio image - Admin & Editor)
portfolioRouter.post(
  '/upload-image',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  portfolioUpload.single('image'),
  validatePortfolioFileMiddleware,
  portfolioController.uploadPortfolioImage
);

// POST /api/portfolio (Protected - Create realization - Admin & Editor)
portfolioRouter.post(
  '/',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  portfolioUpload.single('image'),
  validatePortfolioFileMiddleware,
  portfolioController.createPortfolioItem
);

// PATCH /api/portfolio/:id/toggle (Protected - Toggle active status - Admin & Editor)
portfolioRouter.patch('/:id/toggle', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), portfolioController.togglePortfolioItem);

// PATCH /api/portfolio/:id (Protected - Update realization - Admin & Editor)
portfolioRouter.patch(
  '/:id',
  authenticateJWT,
  requireRole(['ADMIN', 'EDITOR']),
  portfolioUpload.single('image'),
  validatePortfolioFileMiddleware,
  portfolioController.updatePortfolioItem
);

// DELETE /api/portfolio/:id (Protected - ADMIN ONLY)
portfolioRouter.delete(
  '/:id',
  authenticateJWT,
  requireRole(['ADMIN']),
  portfolioController.deletePortfolioItem
);
