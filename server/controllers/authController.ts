import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { comparePassword, hashPassword, generateToken, revokeToken, isStrongPassword } from '../services/auth';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { recordFailedLogin, resetLoginAttempts } from '../middleware/rateLimiter';
import { logAdminAction } from '../services/auditLogger';

/**
 * Login Handler with Rate Limiting and HttpOnly Cookie Delivery
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Identifiant et mot de passe requis' });
      return;
    }

    const trimmedUsername = String(username).trim();
    const user = await db.findUserByUsername(trimmedUsername) || await db.findUserByEmail(trimmedUsername);
    
    if (!user || !user.isActive) {
      recordFailedLogin(req);
      res.status(401).json({ success: false, error: 'Identifiant ou mot de passe incorrect' });
      return;
    }

    const isMatch = await comparePassword(String(password), user.passwordHash);
    if (!isMatch) {
      recordFailedLogin(req);
      res.status(401).json({ success: false, error: 'Identifiant ou mot de passe incorrect' });
      return;
    }

    // Reset rate limiter on successful authentication
    resetLoginAttempts(req);

    await db.updateUserLastLogin(user.id);
    const token = generateToken(user);

    // Set secure HttpOnly, Secure, SameSite cookie
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    res.cookie('barka_auth_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 8 * 3600 * 1000, // 8 hours
      path: '/',
    });

    // Audit log login action
    logAdminAction({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      action: 'LOGIN',
      resource: 'USER',
      resourceId: user.id,
      resourceTitle: user.fullName || user.username,
      description: `${user.role} (${user.username}) s'est connecté à l'espace d'administration.`,
      ipAddress: req.ip || req.socket?.remoteAddress || '127.0.0.1',
    }).catch((e) => console.warn('Audit error:', e));

    const { passwordHash: _, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user profile and permissions
 */
export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non authentifié' });
      return;
    }
    const user = await db.findUserById(req.user.id);
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Utilisateur introuvable ou désactivé' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout Handler: Revokes Token & Clears Secure Cookies
 */
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // 1. Extract token from header or cookie
    let token = req.rawToken;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7).trim();
    }
    if (!token && (req as any).cookies?.barka_auth_token) {
      token = (req as any).cookies.barka_auth_token;
    }

    // 2. Revoke the token so it cannot be used again
    if (token) {
      await revokeToken(token, req.user?.id, 'LOGOUT');
    }

    if (req.user) {
      logAdminAction({
        req,
        action: 'LOGOUT',
        resource: 'USER',
        resourceId: req.user.id,
        resourceTitle: req.user.fullName || req.user.username,
        description: `${req.user.role} (${req.user.username}) s'est déconnecté.`,
      }).catch((e) => console.warn('Audit error:', e));
    }

    // 3. Clear HttpOnly auth cookie
    const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    res.clearCookie('barka_auth_token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      path: '/',
    });

    res.json({
      success: true,
      message: 'Déconnexion effectuée avec succès. Session invalidée.',
    });
  } catch {
    res.json({
      success: true,
      message: 'Déconnexion effectuée.',
    });
  }
}

/**
 * List all users (Admin only)
 */
export async function listUsers(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await db.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new administrative user (Admin only)
 */
export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, email, password, fullName, role } = req.body;
    if (!username || !email || !password || !fullName) {
      res.status(400).json({ success: false, error: 'Tous les champs sont requis (nom d’utilisateur, email, mot de passe, nom complet)' });
      return;
    }

    const passwordStr = String(password);
    const pwdValidation = isStrongPassword(passwordStr);
    if (!pwdValidation.valid) {
      res.status(400).json({ success: false, error: pwdValidation.reason || 'Le mot de passe ne respecte pas les critères de sécurité' });
      return;
    }

    const existingUser = await db.findUserByUsername(String(username).trim());
    if (existingUser) {
      res.status(409).json({ success: false, error: 'Nom d’utilisateur déjà existant' });
      return;
    }

    const existingEmail = await db.findUserByEmail(String(email).trim());
    if (existingEmail) {
      res.status(409).json({ success: false, error: 'Adresse email déjà utilisée par un autre compte' });
      return;
    }

    const passwordHash = await hashPassword(String(password));
    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'EDITOR';

    const newUser = await db.createUser({
      username: String(username).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      fullName: String(fullName).trim(),
      role: assignedRole,
      isActive: true,
    });

    // Audit log - NEVER LOG PASSWORDS
    logAdminAction({
      req,
      action: 'CREATE',
      resource: 'USER',
      resourceId: newUser.id,
      resourceTitle: newUser.fullName,
      description: `${req.user?.role || 'ADMIN'} a créé le compte utilisateur (${newUser.username} - rôle ${assignedRole}).`,
      oldValue: null,
      newValue: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
      },
    }).catch((e) => console.warn('Audit error:', e));

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ success: true, message: `Utilisateur avec rôle ${assignedRole} créé avec succès`, data: safeUser });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a user account (Admin only)
 */
export async function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (req.user?.id === id) {
      res.status(400).json({ success: false, error: 'Sécurité : Vous ne pouvez pas supprimer votre propre compte administrateur actif.' });
      return;
    }

    const targetUser = await db.findUserById(id);

    const deleted = await db.deleteUser(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
      return;
    }

    // Audit log
    logAdminAction({
      req,
      action: 'DELETE',
      resource: 'USER',
      resourceId: id,
      resourceTitle: targetUser?.fullName || id,
      description: `${req.user?.role || 'ADMIN'} a supprimé le compte utilisateur (${targetUser?.username || id}).`,
      oldValue: targetUser ? { id: targetUser.id, username: targetUser.username, role: targetUser.role } : null,
      newValue: null,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    next(err);
  }
}

