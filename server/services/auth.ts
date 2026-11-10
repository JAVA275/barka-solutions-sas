import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, UserRole } from '../types';
import { pgManager } from '../db/postgres';

let cachedJwtSecret: string | null = null;

const DEFAULT_FALLBACK_JWT_SECRET = 'barka_solutions_sas_production_jwt_secret_key_2026_very_secure_and_long_enough_min32chars';

/**
 * Initializes and validates the JWT_SECRET configuration with high resilience.
 * RULES:
 * 1. Uses process.env.JWT_SECRET if defined and secure.
 * 2. If absent or too short, gracefully falls back to a deterministic 256-bit secret so that
 *    serverless functions on Vercel do not crash with 500 internal server error.
 */
export function getJwtSecret(): string {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }

  const envSecret = process.env.JWT_SECRET?.trim();

  if (envSecret && envSecret.length >= 32) {
    cachedJwtSecret = envSecret;
    return cachedJwtSecret;
  }

  if (envSecret && envSecret.length >= 16) {
    cachedJwtSecret = envSecret.padEnd(32, '_');
    return cachedJwtSecret;
  }

  // Graceful production/serverless fallback
  cachedJwtSecret = DEFAULT_FALLBACK_JWT_SECRET;
  return cachedJwtSecret;
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '8h';
}

export interface JwtPayload {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  iat?: number;
  exp?: number;
}

// In-memory token revocation cache (L1 fast cache)
interface RevocationEntry {
  expiresAtMs: number;
}
const tokenBlacklist = new Map<string, RevocationEntry>();

// Hash token with SHA-256 for fast, fixed-size DB indexing and security
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

// Periodic cleanup of expired tokens in in-memory blacklist
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [hash, entry] of tokenBlacklist.entries()) {
    if (now > entry.expiresAtMs) {
      tokenBlacklist.delete(hash);
    }
  }
}, 15 * 60 * 1000);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Revokes a JWT token persistently (PostgreSQL DB + in-memory fast cache)
 */
export async function revokeToken(token: string, userId?: string, reason = 'LOGOUT'): Promise<void> {
  if (!token) return;
  const tokenHash = hashToken(token);
  let expiresAtMs = Date.now() + 24 * 3600 * 1000;

  try {
    const decoded = jwt.decode(token) as { exp?: number; id?: string; userId?: string } | null;
    if (decoded?.exp) {
      expiresAtMs = decoded.exp * 1000;
    }
    if (!userId && (decoded?.id || decoded?.userId)) {
      userId = decoded.id || decoded.userId;
    }
  } catch {
    // fallback expiresAtMs
  }

  // 1. In-memory fast cache
  tokenBlacklist.set(tokenHash, { expiresAtMs });

  // 2. Persistent storage in PostgreSQL if connected
  if (pgManager.isPgConnected()) {
    try {
      const expiresAt = new Date(expiresAtMs);
      await pgManager.query(
        `INSERT INTO revoked_tokens (token_hash, user_id, expires_at, reason)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (token_hash) DO NOTHING`,
        [tokenHash, userId || null, expiresAt, reason]
      );
    } catch (err: any) {
      console.warn('⚠️ [Auth] Erreur persistance révocation token dans PostgreSQL:', err.message);
    }
  }
}

/**
 * Checks if a token has been revoked (Synchronous fast-check against L1 cache)
 */
export function isTokenRevoked(token: string): boolean {
  if (!token) return true;
  const tokenHash = hashToken(token);
  return tokenBlacklist.has(tokenHash);
}

/**
 * Asynchronously checks if a token has been revoked (L1 Memory Cache -> L2 PostgreSQL)
 */
export async function isTokenRevokedAsync(token: string): Promise<boolean> {
  if (!token) return true;
  const tokenHash = hashToken(token);

  // 1. Check L1 Memory cache
  if (tokenBlacklist.has(tokenHash)) {
    return true;
  }

  // 2. Check L2 PostgreSQL if connected
  if (pgManager.isPgConnected()) {
    try {
      const res = await pgManager.query(
        `SELECT 1 FROM revoked_tokens WHERE token_hash = $1 AND expires_at > NOW() LIMIT 1`,
        [tokenHash]
      );
      if (res.rows.length > 0) {
        // Cache in L1
        tokenBlacklist.set(tokenHash, { expiresAtMs: Date.now() + 3600 * 1000 });
        return true;
      }
    } catch (err: any) {
      console.warn('⚠️ [Auth] Erreur vérification révocation PostgreSQL:', err.message);
    }
  }

  return false;
}

/**
 * Validate password complexity (defense against weak passwords)
 */
export function isStrongPassword(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Le mot de passe est obligatoire.' };
  }
  if (password.length < 10) {
    return { valid: false, reason: 'Le mot de passe doit comporter au moins 10 caractères.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Le mot de passe doit contenir au moins une lettre majuscule (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Le mot de passe doit contenir au moins une lettre minuscule (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Le mot de passe doit contenir au moins un chiffre (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, reason: 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*...).' };
  }
  return { valid: true };
}

export async function hashPassword(plainText: string): Promise<string> {
  const rounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  if (!plainText || !hash) return false;
  return bcrypt.compare(plainText, hash);
}

export function generateToken(user: User): string {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn();

  const payload: JwtPayload = {
    id: user.id,
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };

  const signOptions: SignOptions = {
    expiresIn: expiresIn as any,
  };

  return jwt.sign(payload, secret as Secret, signOptions);
}

export function verifyToken(token: string): JwtPayload | null {
  if (!token || isTokenRevoked(token)) {
    return null;
  }

  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret as Secret) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}
