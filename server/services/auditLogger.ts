import { Request } from 'express';
import { AuditAction, AuditLog, AuditResource, UserRole } from '../types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../db/database';

// Sensitive keys that must NEVER be stored in audit logs
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'passwordcurrent',
  'newpassword',
  'token',
  'rawtoken',
  'jwt',
  'jwtsecret',
  'jwt_secret',
  'secret',
  'apikey',
  'api_key',
  'smtppass',
  'smtp_pass',
  'authorization',
  'cookie',
  'barka_auth_token',
]);

/**
 * Recursively cleans and sanitizes objects/arrays to guarantee no password,
 * secret or token is ever recorded in audit logs.
 */
export function sanitizeForAudit<T = any>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForAudit(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');

    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret') || lowerKey.includes('token')) {
      sanitized[key] = '[PROTÉGÉ / MASQUÉ]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeForAudit(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

export interface RecordAuditParams {
  req?: AuthenticatedRequest | Request;
  user?: {
    id?: string;
    userId?: string;
    username?: string;
    fullName?: string;
    role?: UserRole | 'SYSTEM';
  };
  userId?: string;
  username?: string;
  userFullName?: string;
  role?: UserRole | 'SYSTEM';
  action: AuditAction | string;
  resource: AuditResource | string;
  resourceId: string;
  resourceTitle?: string;
  description?: string;
  ipAddress?: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
}

/**
 * Builds a natural, standard French description for the audit action
 */
function buildAuditDescription(
  role: string,
  userDisplay: string,
  action: string,
  resource: string,
  resourceTitle?: string,
  resourceId?: string
): string {
  const actor = `${role} (${userDisplay})`;
  const target = resourceTitle ? `"${resourceTitle}"` : `#${resourceId}`;

  switch (action) {
    case 'CREATE':
    case 'CREATION':
      return `${actor} a créé ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case 'UPDATE':
    case 'MODIFICATION':
      return `${actor} a modifié ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case 'DELETE':
    case 'SUPPRESSION':
      return `${actor} a supprimé ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case 'STATUS_CHANGE':
    case 'CHANGEMENT_STATUT':
      return `${actor} a changé le statut de ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case 'TOGGLE_STATUS':
      return `${actor} a modifié l'état d'activation de ${getResourceArticle(resource)} ${getResourceLabel(resource)} ${target}.`;
    case 'LOGIN':
    case 'CONNEXION':
      return `${actor} s'est connecté à l'espace d'administration.`;
    case 'LOGOUT':
    case 'DECONNEXION':
      return `${actor} s'est déconnecté.`;
    default:
      return `${actor} a effectué l'action ${action} sur ${getResourceLabel(resource)} ${target}.`;
  }
}

function getResourceArticle(resource: string): string {
  switch (resource.toUpperCase()) {
    case 'TARIF':
    case 'PORTFOLIO':
    case 'DEVIS':
    case 'SERVICE':
    case 'MESSAGE':
    case 'USER':
      return 'le';
    case 'COMPANY_SETTINGS':
    case 'PARAMETRES':
      return 'les';
    default:
      return 'le';
  }
}

function getResourceLabel(resource: string): string {
  switch (resource.toUpperCase()) {
    case 'TARIF':
      return 'tarif';
    case 'PORTFOLIO':
      return 'portfolio';
    case 'DEVIS':
      return 'devis';
    case 'SERVICE':
      return 'service';
    case 'USER':
      return 'compte utilisateur';
    case 'COMPANY_SETTINGS':
      return 'paramètres d’entreprise';
    case 'MESSAGE':
      return 'message client';
    default:
      return resource.toLowerCase();
  }
}

/**
 * Global Helper to record an administrative audit log safely.
 */
export async function logAdminAction(params: RecordAuditParams): Promise<AuditLog> {
  const req = params.req as AuthenticatedRequest | undefined;
  const user = req?.user;

  const userId = params.userId || user?.id || user?.userId || 'system';
  const username = params.username || user?.username || 'admin';
  const userFullName = params.userFullName || user?.fullName || username;
  const role: UserRole | 'SYSTEM' = params.role || (user?.role as UserRole) || 'ADMIN';

  // Extract client IP safely
  const ipAddress =
    (req?.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req?.socket?.remoteAddress ||
    req?.ip ||
    '127.0.0.1';

  const description =
    params.description ||
    buildAuditDescription(
      role,
      userFullName || username,
      params.action,
      params.resource,
      params.resourceTitle,
      params.resourceId
    );

  const cleanOldValue = params.oldValue !== undefined && params.oldValue !== null
    ? sanitizeForAudit(params.oldValue)
    : null;

  const cleanNewValue = params.newValue !== undefined && params.newValue !== null
    ? sanitizeForAudit(params.newValue)
    : null;

  const newLog = db.createAuditLog({
    userId,
    username,
    userFullName,
    role,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    resourceTitle: params.resourceTitle,
    description,
    oldValue: cleanOldValue,
    newValue: cleanNewValue,
    ipAddress,
  });

  console.log(`📋 [AUDIT LOG] ${newLog.description}`);
  return newLog;
}
