import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, UserRole } from '../types';

let cachedJwtSecret: string | null = null;

/**
 * Initializes and validates the JWT_SECRET configuration.
 * RULES:
 * 1. In production mode (NODE_ENV === 'production'), JWT_SECRET is MANDATORY.
 *    If absent or insecure (< 32 chars), it throws a fatal error and prevents the server from starting.
 * 2. In development mode, if absent, it generates a secure random 256-bit runtime secret and logs a warning.
 */
export function getJwtSecret(): string {
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }

  const envSecret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!envSecret) {
      throw new Error(
        '🚨 [SECURITY FATAL ERROR] JWT_SECRET environment variable is MANDATORY in production mode. Server startup aborted.'
      );
    }
    if (envSecret.length < 32) {
      throw new Error(
        '🚨 [SECURITY FATAL ERROR] JWT_SECRET must be at least 32 characters long in production mode. Server startup aborted.'
      );
    }
    cachedJwtSecret = envSecret;
    return cachedJwtSecret;
  }

  // Development / Test mode fallback
  if (envSecret && envSecret.length >= 16) {
    cachedJwtSecret = envSecret;
  } else {
    // Generate a secure ephemeral key for the dev runtime session
    const generated = crypto.randomBytes(32).toString('hex');
    cachedJwtSecret = generated;
    console.warn(
      '⚠️ [SECURITY WARNING] JWT_SECRET non défini ou trop court en mode développement. Une clé cryptographique sécurisée de session a été générée automatiquement.'
    );
  }

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

// In-memory token revocation / blacklist store
interface RevocationEntry {
  expiresAtMs: number;
}
const tokenBlacklist = new Map<string, RevocationEntry>();

// Periodic cleanup of expired tokens in blacklist
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of tokenBlacklist.entries()) {
    if (now > entry.expiresAtMs) {
      tokenBlacklist.delete(token);
    }
  }
}, 15 * 60 * 1000);
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Revokes a JWT token (used upon logout or security events)
 */
export function revokeToken(token: string): void {
  if (!token) return;
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAtMs = decoded?.exp ? decoded.exp * 1000 : Date.now() + 24 * 3600 * 1000;
    tokenBlacklist.set(token, { expiresAtMs });
  } catch {
    tokenBlacklist.set(token, { expiresAtMs: Date.now() + 8 * 3600 * 1000 });
  }
}

/**
 * Checks if a token has been revoked
 */
export function isTokenRevoked(token: string): boolean {
  if (!token) return true;
  return tokenBlacklist.has(token);
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
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
