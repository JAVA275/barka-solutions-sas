import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload, isTokenRevoked } from '../services/auth';
import { UserRole } from '../types';
import { db } from '../db/database';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  rawToken?: string;
}

/**
 * Extracts JWT token from Authorization header OR HttpOnly cookie
 */
function extractToken(req: Request): string | null {
  // 1. Check Authorization Bearer Header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Check Cookie (via cookie-parser if installed)
  if ((req as any).cookies && (req as any).cookies.barka_auth_token) {
    return (req as any).cookies.barka_auth_token;
  }

  // 3. Fallback: Parse raw Cookie header
  const rawCookies = req.headers.cookie;
  if (rawCookies) {
    const match = rawCookies.match(/(?:^|;\s*)barka_auth_token=([^;]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  return null;
}

/**
 * Middleware to authenticate requests using Bearer JWT or HttpOnly secure cookie
 * BUG-001 Fix: Systematically verifies against DB that user exists and is active.
 */
export async function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'Authentification requise. Veuillez vous connecter.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (isTokenRevoked(token)) {
    res.status(401).json({
      success: false,
      error: 'Cette session a été révoquée suite à une déconnexion. Veuillez vous reconnecter.',
      code: 'SESSION_REVOKED',
    });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({
      success: false,
      error: 'Session expirée ou jeton d’authentification invalide. Veuillez vous reconnecter.',
      code: 'TOKEN_INVALID_OR_EXPIRED',
    });
    return;
  }

  // Verify that the user actually exists in the database and is currently active
  try {
    const userInDb = await db.findUserById(payload.id);
    if (!userInDb || userInDb.isActive === false) {
      res.status(401).json({
        success: false,
        error: 'Compte utilisateur introuvable ou désactivé. Veuillez vous reconnecter.',
        code: 'USER_NOT_FOUND_OR_INACTIVE',
      });
      return;
    }

    // Refresh role from DB to prevent privilege escalation via forged/stale token claims
    payload.role = userInDb.role;
    req.user = payload;
    req.rawToken = token;
    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la validation du compte utilisateur.',
      code: 'AUTH_DB_ERROR',
    });
  }
}

/**
 * Middleware to enforce specific roles (ADMIN vs EDITOR)
 * Server-side RBAC validation.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Non authentifié. Veuillez vous connecter.',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Accès interdit. Vos privilèges de compte (${req.user.role}) ne vous autorisent pas à effectuer cette action. Rôle(s) requis : ${allowedRoles.join(', ')}`,
        code: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}
