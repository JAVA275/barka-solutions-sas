import { Request, Response, NextFunction } from 'express';
import { deleteMulterFiles } from '../services/fileManager';

interface AttemptRecord {
  count: number;
  firstAttemptTime: number;
  blockedUntil: number;
  timestamps: number[];
}

interface UploadRecord {
  fileCount: number;
  totalBytes: number;
  firstUploadTime: number;
  blockedUntil: number;
}

const loginAttemptsMap = new Map<string, AttemptRecord>();
const contactSubmissionsMap = new Map<string, AttemptRecord>();
const quoteSubmissionsMap = new Map<string, AttemptRecord>();
const uploadTrackingMap = new Map<string, UploadRecord>();

// Cleanup stale records every 10 minutes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  
  for (const [key, record] of loginAttemptsMap.entries()) {
    if (now > record.firstAttemptTime + 30 * 60 * 1000 && now > record.blockedUntil) {
      loginAttemptsMap.delete(key);
    }
  }

  for (const [key, record] of contactSubmissionsMap.entries()) {
    if (now > record.firstAttemptTime + 30 * 60 * 1000 && now > record.blockedUntil) {
      contactSubmissionsMap.delete(key);
    }
  }

  for (const [key, record] of quoteSubmissionsMap.entries()) {
    if (now > record.firstAttemptTime + 60 * 60 * 1000 && now > record.blockedUntil) {
      quoteSubmissionsMap.delete(key);
    }
  }

  for (const [key, record] of uploadTrackingMap.entries()) {
    if (now > record.firstUploadTime + 30 * 60 * 1000 && now > record.blockedUntil) {
      uploadTrackingMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
}

/**
 * 1. RATE LIMITER: POST /api/auth/login
 * - Max 5 failed attempts in 15 minutes
 * - Burst limit: max 10 requests per minute total
 */
const LOGIN_MAX_FAILED = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;

export function loginRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginAttemptsMap.get(ip);

  if (record) {
    if (record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      res.status(429).json({
        success: false,
        error: `Trop de tentatives de connexion infructueuses. Veuillez patienter ${remainingSeconds} seconde(s) avant de réessayer.`,
        retryAfterSeconds: remainingSeconds,
        code: 'RATE_LIMIT_LOGIN_BLOCKED',
      });
      return;
    }

    // Clean up timestamps older than 1 minute for burst rate
    record.timestamps = record.timestamps.filter((t) => now - t < 60 * 1000);
    if (record.timestamps.length >= 10) {
      res.status(429).json({
        success: false,
        error: 'Trop de requêtes rapides. Veuillez patienter quelques instants.',
        code: 'RATE_LIMIT_LOGIN_BURST',
      });
      return;
    }
    record.timestamps.push(now);

    if (now - record.firstAttemptTime > LOGIN_WINDOW_MS) {
      record.count = 0;
      record.firstAttemptTime = now;
      record.blockedUntil = 0;
    }
  } else {
    loginAttemptsMap.set(ip, {
      count: 0,
      firstAttemptTime: now,
      blockedUntil: 0,
      timestamps: [now],
    });
  }

  next();
}

export function recordFailedLogin(req: Request): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = loginAttemptsMap.get(ip);

  if (!record || now - record.firstAttemptTime > LOGIN_WINDOW_MS) {
    loginAttemptsMap.set(ip, {
      count: 1,
      firstAttemptTime: now,
      blockedUntil: 0,
      timestamps: [now],
    });
  } else {
    record.count += 1;
    if (record.count >= LOGIN_MAX_FAILED) {
      record.blockedUntil = now + LOGIN_BLOCK_MS;
      console.warn(`[SECURITY] 🚨 IP ${ip} bloquée pour ${LOGIN_BLOCK_MS / 60000} minutes suite à ${record.count} échecs de connexion.`);
    }
  }
}

export function resetLoginAttempts(req: Request): void {
  const ip = getClientIp(req);
  loginAttemptsMap.delete(ip);
}

/**
 * 2. RATE LIMITER: POST /api/contact
 * - Max 5 messages par 10 minutes par IP
 * - Burst limit: max 2 messages en 20 secondes
 */
const CONTACT_MAX_SUBMISSIONS = 5;
const CONTACT_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_BLOCK_MS = 10 * 60 * 1000;

export function contactRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = contactSubmissionsMap.get(ip);

  if (record) {
    if (record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      res.status(429).json({
        success: false,
        error: `Vous avez envoyé plusieurs messages récemment. Veuillez patienter ${remainingSeconds} seconde(s) avant d'envoyer un nouveau message.`,
        retryAfterSeconds: remainingSeconds,
        code: 'RATE_LIMIT_CONTACT_BLOCKED',
      });
      return;
    }

    // Burst check: max 2 messages in 20 seconds
    const recent20s = record.timestamps.filter((t) => now - t < 20 * 1000);
    if (recent20s.length >= 2) {
      res.status(429).json({
        success: false,
        error: 'Veuillez patienter quelques secondes avant d’envoyer un autre message.',
        code: 'RATE_LIMIT_CONTACT_BURST',
      });
      return;
    }

    if (now - record.firstAttemptTime > CONTACT_WINDOW_MS) {
      record.count = 1;
      record.firstAttemptTime = now;
      record.blockedUntil = 0;
      record.timestamps = [now];
    } else {
      record.count += 1;
      record.timestamps.push(now);
      if (record.count > CONTACT_MAX_SUBMISSIONS) {
        record.blockedUntil = now + CONTACT_BLOCK_MS;
        res.status(429).json({
          success: false,
          error: `Limite de formulaires de contact atteinte. Veuillez patienter ${CONTACT_BLOCK_MS / 60000} minutes.`,
          code: 'RATE_LIMIT_CONTACT_EXCEEDED',
        });
        return;
      }
    }
  } else {
    contactSubmissionsMap.set(ip, {
      count: 1,
      firstAttemptTime: now,
      blockedUntil: 0,
      timestamps: [now],
    });
  }

  next();
}

/**
 * 3. RATE LIMITER: POST /api/quotes
 * - Max 20 devis par heure par IP (généreux pour un client réel ou entreprise)
 * - Burst limit: max 8 devis en 2 minutes
 */
const QUOTES_MAX_SUBMISSIONS = 20;
const QUOTES_WINDOW_MS = 60 * 60 * 1000;
const QUOTES_BLOCK_MS = 30 * 60 * 1000;

export function quotesRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = quoteSubmissionsMap.get(ip);

  if (record) {
    if (record.blockedUntil > now) {
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      if (req.files) deleteMulterFiles(req.files as Express.Multer.File[]);
      res.status(429).json({
        success: false,
        error: `Vous avez envoyé plusieurs demandes de devis consécutives. Veuillez patienter ${remainingSeconds} seconde(s) avant de soumettre une nouvelle demande.`,
        retryAfterSeconds: remainingSeconds,
        code: 'RATE_LIMIT_QUOTES_BLOCKED',
      });
      return;
    }

    // Burst check: max 8 in 2 minutes
    const recent2m = record.timestamps.filter((t) => now - t < 2 * 60 * 1000);
    if (recent2m.length >= 8) {
      if (req.files) deleteMulterFiles(req.files as Express.Multer.File[]);
      res.status(429).json({
        success: false,
        error: 'Trop de demandes de devis simultanées. Veuillez patienter 1 minute avant de recommencer.',
        code: 'RATE_LIMIT_QUOTES_BURST',
      });
      return;
    }

    if (now - record.firstAttemptTime > QUOTES_WINDOW_MS) {
      record.count = 1;
      record.firstAttemptTime = now;
      record.blockedUntil = 0;
      record.timestamps = [now];
    } else {
      record.count += 1;
      record.timestamps.push(now);
      if (record.count > QUOTES_MAX_SUBMISSIONS) {
        record.blockedUntil = now + QUOTES_BLOCK_MS;
        if (req.files) deleteMulterFiles(req.files as Express.Multer.File[]);
        res.status(429).json({
          success: false,
          error: `Limite de demandes de devis atteinte (${QUOTES_MAX_SUBMISSIONS}/heure). Veuillez nous contacter directement par téléphone ou WhatsApp.`,
          code: 'RATE_LIMIT_QUOTES_EXCEEDED',
        });
        return;
      }
    }
  } else {
    quoteSubmissionsMap.set(ip, {
      count: 1,
      firstAttemptTime: now,
      blockedUntil: 0,
      timestamps: [now],
    });
  }

  next();
}

/**
 * 4. UPLOAD ABUSE LIMITER
 * Protège le stockage contre le téléversement abusif ou massif par une même IP.
 * - Max 15 fichiers par 15 minutes
 * - Max 150 Mo cumulés par 15 minutes
 */
const UPLOAD_MAX_FILES_WINDOW = 15;
const UPLOAD_MAX_BYTES_WINDOW = 150 * 1024 * 1024; // 150 MB
const UPLOAD_WINDOW_MS = 15 * 60 * 1000;

export function uploadAbuseLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const now = Date.now();
  
  // Calculate incoming upload size & count
  let incomingCount = 0;
  let incomingBytes = 0;

  if (req.files && Array.isArray(req.files)) {
    incomingCount = req.files.length;
    incomingBytes = (req.files as Express.Multer.File[]).reduce((sum, f) => sum + (f.size || 0), 0);
  } else if (req.file) {
    incomingCount = 1;
    incomingBytes = req.file.size || 0;
  }

  if (incomingCount === 0) {
    return next();
  }

  const record = uploadTrackingMap.get(ip);

  if (record) {
    if (record.blockedUntil > now) {
      if (req.files) deleteMulterFiles(req.files as Express.Multer.File[]);
      if (req.file) deleteMulterFiles([req.file]);
      const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
      res.status(429).json({
        success: false,
        error: `Volume de téléversement temporairement limité. Veuillez patienter ${remainingSeconds} seconde(s).`,
        code: 'RATE_LIMIT_UPLOAD_BLOCKED',
      });
      return;
    }

    if (now - record.firstUploadTime > UPLOAD_WINDOW_MS) {
      record.fileCount = incomingCount;
      record.totalBytes = incomingBytes;
      record.firstUploadTime = now;
      record.blockedUntil = 0;
    } else {
      record.fileCount += incomingCount;
      record.totalBytes += incomingBytes;

      if (record.fileCount > UPLOAD_MAX_FILES_WINDOW || record.totalBytes > UPLOAD_MAX_BYTES_WINDOW) {
        record.blockedUntil = now + 15 * 60 * 1000;
        if (req.files) deleteMulterFiles(req.files as Express.Multer.File[]);
        if (req.file) deleteMulterFiles([req.file]);
        res.status(429).json({
          success: false,
          error: 'Limite de volume de téléversement atteinte (trop de fichiers ou volume excessif). Veuillez réessayer dans 15 minutes.',
          code: 'RATE_LIMIT_UPLOAD_EXCEEDED',
        });
        return;
      }
    }
  } else {
    uploadTrackingMap.set(ip, {
      fileCount: incomingCount,
      totalBytes: incomingBytes,
      firstUploadTime: now,
      blockedUntil: 0,
    });
  }

  next();
}

/**
 * 5. HONEYPOT & BOT DETECTOR MIDDLEWARE
 * Traps automated bots and crawlers invisibly without hindering human users.
 */
export function honeypotBotGuard(req: Request, res: Response, next: NextFunction): void {
  const {
    website_url,
    barka_hp_check,
    hp_company_field,
    _form_rendered_at,
  } = req.body;

  // 1. Honeypot check: If any hidden honeypot trap field contains a value, it's an automated bot
  if (website_url || barka_hp_check || hp_company_field) {
    console.warn(`[BOT DETECTED] 🤖 Honeypot piégé depuis IP ${getClientIp(req)}`);
    if (req.files) deleteMulterFiles(req.files as Express.Multer.File[]);
    if (req.file) deleteMulterFiles([req.file]);
    
    // Reject with bad request
    res.status(400).json({
      success: false,
      error: 'Requête non autorisée (protection anti-bot active).',
      code: 'BOT_HONEYPOT_TRIGGERED',
    });
    return;
  }

  // 2. Submission speed check: A human takes at least 500ms between opening the form and submitting
  if (_form_rendered_at) {
    const renderTime = Number(_form_rendered_at);
    if (!isNaN(renderTime)) {
      const durationMs = Date.now() - renderTime;
      // If submitted in less than 400ms from form rendering, it's an automated submission script
      if (durationMs > 0 && durationMs < 400) {
        console.warn(`[BOT DETECTED] ⚡ Soumission ultra-rapide (${durationMs}ms) depuis IP ${getClientIp(req)}`);
        if (req.files) deleteMulterFiles(req.files as Express.Multer.File[]);
        if (req.file) deleteMulterFiles([req.file]);
        
        res.status(400).json({
          success: false,
          error: 'Soumission trop rapide. Veuillez réessayer.',
          code: 'BOT_SPEED_TRIGGERED',
        });
        return;
      }
    }
  }

  next();
}
