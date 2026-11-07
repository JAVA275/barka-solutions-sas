import { Router } from 'express';
import * as pricesController from '../controllers/pricesController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';

export const pricesRouter = Router();

// GET /api/prices (Public: List all pricing categories and products)
pricesRouter.get('/', pricesController.listPriceCategories);

// POST /api/prices/:categoryId/items (Protected - Admin & Editor: Add or update line item)
pricesRouter.post('/:categoryId/items', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), pricesController.savePriceItem);

// DELETE /api/prices/:categoryId/items/:itemId (Protected - Admin Only)
pricesRouter.delete('/:categoryId/items/:itemId', authenticateJWT, requireRole(['ADMIN']), pricesController.deletePriceItem);

// PATCH /api/prices/:categoryId/items/:itemId/toggle (Protected - Admin & Editor)
pricesRouter.patch('/:categoryId/items/:itemId/toggle', authenticateJWT, requireRole(['ADMIN', 'EDITOR']), pricesController.togglePriceItem);
