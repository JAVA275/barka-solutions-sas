import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware';
import { validateLoginInput } from '../middleware/validationMiddleware';
import { loginRateLimiter } from '../middleware/rateLimiter';

export const authRouter = Router();

// POST /api/auth/login (Protected with Rate Limiting & Input Validation)
authRouter.post('/login', loginRateLimiter, validateLoginInput, authController.login);

// GET /api/auth/me (Protected - Any Authenticated User)
authRouter.get('/me', authenticateJWT, authController.getMe);

// POST /api/auth/logout (Protected/Public Logout - Invalidates Session & Clears Cookies)
authRouter.post('/logout', authController.logout);

// GET /api/auth/users (ADMIN ONLY)
authRouter.get('/users', authenticateJWT, requireRole(['ADMIN']), authController.listUsers);

// POST /api/auth/users (ADMIN ONLY)
authRouter.post('/users', authenticateJWT, requireRole(['ADMIN']), authController.createUser);

// DELETE /api/auth/users/:id (ADMIN ONLY)
authRouter.delete('/users/:id', authenticateJWT, requireRole(['ADMIN']), authController.deleteUser);
