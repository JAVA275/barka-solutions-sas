import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { pgManager } from '../db/postgres';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getMailerConfig, testEmailDelivery } from '../services/mailer';
import { logAdminAction } from '../services/auditLogger';

export function getCompanySettings(_req: Request, res: Response, next: NextFunction): void {
  try {
    const settings = db.getCompanySettings();
    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
}

export function updateCompanySettings(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const oldSettings = db.getCompanySettings();
    const allowedKeys = [
      'company_name',
      'legal_name',
      'slogan',
      'description',
      'niu',
      'rccm',
      'address_line1',
      'address_line2',
      'city',
      'region',
      'country',
      'quarter',
      'landmarks',
      'phone_primary',
      'phone_secondary',
      'phone_workshop',
      'whatsapp_number',
      'email_primary',
      'email_quote',
      'email_support',
      'opening_hours_weekday',
      'opening_hours_saturday',
      'opening_hours_sunday',
      'emergency_service',
      'turnaround_standard',
      'turnaround_express',
      'currency',
      'social_facebook',
      'social_instagram',
      'social_linkedin',
      'social_twitter',
      'gps_latitude',
      'gps_longitude',
      'google_maps_url',
    ];

    const cleanPayload: Record<string, any> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        cleanPayload[key] = req.body[key];
      }
    }

    const updated = db.updateCompanySettings(cleanPayload);

    // Audit log
    logAdminAction({
      req,
      action: 'UPDATE',
      resource: 'COMPANY_SETTINGS',
      resourceId: 'barka-settings',
      resourceTitle: updated.company_name || updated.legal_name || 'BARKA SOLUTIONS S.A.S',
      description: `${req.user?.role || 'ADMIN'} a modifié les coordonnées et paramètres de l'entreprise.`,
      oldValue: oldSettings,
      newValue: updated,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: 'Coordonnées et paramètres mis à jour',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export function getMailerStatus(_req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const config = getMailerConfig();
    res.json({
      success: true,
      data: {
        provider: config.provider,
        isConfigured: config.isConfigured,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        adminEmails: config.adminEmails,
        smtpHost: config.smtpHost || null,
        smtpPort: config.smtpPort || null,
        smtpSecure: config.smtpSecure || false,
        smtpUser: config.smtpUser || null,
        hasSmtpPass: config.hasSmtpPass || false,
        hasApiKey: config.hasApiKey || false,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function triggerTestEmail(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { targetEmail } = req.body;
    const result = await testEmailDelivery(targetEmail ? String(targetEmail).trim() : undefined);
    
    if (result.sent) {
      logAdminAction({
        req,
        action: 'EMAIL_SENT',
        resource: 'COMPANY_SETTINGS',
        resourceId: 'mailer-test',
        resourceTitle: 'Test Service Email',
        description: `${req.user?.role || 'ADMIN'} a déclenché un test d'envoi d'email vers ${result.recipients.join(', ')}.`,
        oldValue: null,
        newValue: { provider: result.provider, recipients: result.recipients },
      }).catch((e) => console.warn('Audit error:', e));

      res.json({
        success: true,
        message: `Email de test envoyé avec succès via ${result.provider.toUpperCase()} à ${result.recipients.join(', ')}`,
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Échec de l’envoi de l’email de test',
        data: result,
      });
    }
  } catch (err) {
    next(err);
  }
}

export function getHealthCheck(_req: Request, res: Response): void {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  const isConnected = pgManager.isPgConnected();
  const dbMode = pgManager.getMode();

  if (isProduction && !isConnected) {
    res.status(503).json({
      status: 'error',
      app: 'BARKA SOLUTIONS API',
      code: 'DATABASE_UNAVAILABLE',
      error: 'Base de données PostgreSQL requise en production mais actuellement indisponible.',
      database: {
        mode: dbMode,
        connected: false,
      },
      serverTime: new Date().toISOString(),
    });
    return;
  }

  res.json({
    status: 'ok',
    app: 'BARKA SOLUTIONS API',
    version: '1.0.0',
    database: {
      mode: dbMode,
      connected: isConnected,
    },
    serverTime: new Date().toISOString(),
  });
}


