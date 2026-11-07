import nodemailer from 'nodemailer';
import { SubmittedQuote, ContactMessage } from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../config/companySettings';

export type EmailProviderType = 'smtp' | 'brevo' | 'resend' | 'sendgrid' | 'mailgun' | 'none';

export interface MailerConfig {
  provider: EmailProviderType;
  isConfigured: boolean;
  fromName: string;
  fromEmail: string;
  adminEmails: string[];
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  hasSmtpPass?: boolean;
  hasApiKey?: boolean;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

export interface EmailSendResult {
  success: boolean;
  sent: boolean;
  provider: EmailProviderType;
  recipients: string[];
  accepted: string[];
  rejected: string[];
  messageId?: string;
  error?: string;
}

export interface QuoteNotificationResult {
  success: boolean;
  sentToAdmin: boolean;
  sentToClient: boolean;
  adminRecipients: string[];
  clientRecipient?: string;
  adminResult?: EmailSendResult;
  clientResult?: EmailSendResult;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Parses and returns the list of administrator notification emails.
 * Always includes the primary official recipients: direction@barkasolutions.org and kouchoumichel@yahoo.fr
 */
export function getAdminEmails(): string[] {
  const mandatoryAdmins = ['direction@barkasolutions.org', 'kouchoumichel@yahoo.fr'];
  const envAdmins = process.env.ADMIN_NOTIFICATION_EMAILS;
  
  if (!envAdmins) {
    return mandatoryAdmins;
  }

  const parsed = envAdmins
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL_REGEX.test(e) && !e.includes('mondomaine.com') && !e.includes('example.com'));

  const combined = Array.from(new Set([...mandatoryAdmins, ...parsed]));
  return combined;
}

/**
 * Resolves current email provider and configuration status without exposing credentials
 */
export function getMailerConfig(): MailerConfig {
  const adminEmails = getAdminEmails();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'direction@barkasolutions.org';
  const fromName = process.env.SMTP_FROM_NAME || 'BARKA SOLUTIONS S.A.S';

  // 1. Resend API
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    return {
      provider: 'resend',
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      hasApiKey: true,
    };
  }

  // 2. Brevo API (formerly Sendinblue)
  if (
    (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== '') ||
    (process.env.SIB_API_KEY && process.env.SIB_API_KEY.trim() !== '')
  ) {
    return {
      provider: 'brevo',
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      hasApiKey: true,
    };
  }

  // 3. SendGrid API
  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim() !== '') {
    return {
      provider: 'sendgrid',
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      hasApiKey: true,
    };
  }

  // 4. Mailgun API
  if (
    process.env.MAILGUN_API_KEY &&
    process.env.MAILGUN_API_KEY.trim() !== '' &&
    process.env.MAILGUN_DOMAIN &&
    process.env.MAILGUN_DOMAIN.trim() !== ''
  ) {
    return {
      provider: 'mailgun',
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      hasApiKey: true,
    };
  }

  // 5. Standard SMTP (Gmail, Brevo SMTP, SendGrid SMTP, Mailgun SMTP, OVH, etc.)
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (smtpHost && (smtpUser || smtpPass)) {
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

    return {
      provider: 'smtp',
      isConfigured: true,
      fromName,
      fromEmail,
      adminEmails,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      hasSmtpPass: Boolean(smtpPass),
    };
  }

  // No provider configured
  return {
    provider: 'none',
    isConfigured: false,
    fromName,
    fromEmail,
    adminEmails,
  };
}

/**
 * Creates a Nodemailer Transporter instance based on SMTP config
 */
function createSmtpTransporter(): nodemailer.Transporter | null {
  const config = getMailerConfig();
  if (config.provider !== 'smtp' || !config.smtpHost) {
    return null;
  }

  const auth = config.smtpUser
    ? {
        user: config.smtpUser,
        pass: process.env.SMTP_PASS || '',
      }
    : undefined;

  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort || 587,
    secure: config.smtpSecure || false,
    auth,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

/**
 * Normalize recipient input to a list of valid email addresses
 */
function normalizeRecipients(to: string | string[]): string[] {
  const rawList = Array.isArray(to) ? to : to.split(',');
  return rawList
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL_REGEX.test(e));
}

/**
 * Format "From" header
 */
function formatFromHeader(config: MailerConfig): string {
  const fromAddr = process.env.SMTP_FROM || `"${config.fromName}" <${config.fromEmail}>`;
  return fromAddr;
}

/**
 * Dispatch an email via Resend API
 */
async function sendViaResend(options: SendEmailOptions, recipients: string[], config: MailerConfig): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      sent: false,
      provider: 'resend',
      recipients,
      accepted: [],
      rejected: recipients,
      error: 'Clé API Resend manquante (RESEND_API_KEY).',
    };
  }

  const from = formatFromHeader(config);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || `Erreur HTTP ${res.status} lors de l’envoi via Resend`;
    console.error(`[MAILER] ❌ Échec Resend (${res.status}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: 'resend',
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg,
    };
  }

  console.log(`[MAILER] ✅ Email envoyé avec succès via Resend (ID: ${data.id}) à ${recipients.join(', ')}`);
  return {
    success: true,
    sent: true,
    provider: 'resend',
    recipients,
    accepted: recipients,
    rejected: [],
    messageId: data.id,
  };
}

/**
 * Dispatch an email via Brevo API (Sendinblue)
 */
async function sendViaBrevo(options: SendEmailOptions, recipients: string[], config: MailerConfig): Promise<EmailSendResult> {
  const apiKey = (process.env.BREVO_API_KEY || process.env.SIB_API_KEY)?.trim();
  if (!apiKey) {
    return {
      success: false,
      sent: false,
      provider: 'brevo',
      recipients,
      accepted: [],
      rejected: recipients,
      error: 'Clé API Brevo manquante (BREVO_API_KEY ou SIB_API_KEY).',
    };
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: config.fromName,
        email: config.fromEmail,
      },
      to: recipients.map((email) => ({ email })),
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
      replyTo: options.replyTo ? { email: options.replyTo } : undefined,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || `Erreur HTTP ${res.status} lors de l’envoi via Brevo`;
    console.error(`[MAILER] ❌ Échec Brevo (${res.status}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: 'brevo',
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg,
    };
  }

  console.log(`[MAILER] ✅ Email envoyé avec succès via Brevo (ID: ${data.messageId}) à ${recipients.join(', ')}`);
  return {
    success: true,
    sent: true,
    provider: 'brevo',
    recipients,
    accepted: recipients,
    rejected: [],
    messageId: data.messageId,
  };
}

/**
 * Dispatch an email via SendGrid API
 */
async function sendViaSendGrid(options: SendEmailOptions, recipients: string[], config: MailerConfig): Promise<EmailSendResult> {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      sent: false,
      provider: 'sendgrid',
      recipients,
      accepted: [],
      rejected: recipients,
      error: 'Clé API SendGrid manquante (SENDGRID_API_KEY).',
    };
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: recipients.map((email) => ({ email })),
        },
      ],
      from: {
        email: config.fromEmail,
        name: config.fromName,
      },
      subject: options.subject,
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
      ],
      reply_to: options.replyTo ? { email: options.replyTo } : undefined,
    }),
  });

  if (!res.ok && res.status !== 202) {
    const data = await res.json().catch(() => ({}));
    const errorMsg = (data.errors && data.errors[0]?.message) || `Erreur HTTP ${res.status} SendGrid`;
    console.error(`[MAILER] ❌ Échec SendGrid (${res.status}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: 'sendgrid',
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg,
    };
  }

  console.log(`[MAILER] ✅ Email envoyé avec succès via SendGrid à ${recipients.join(', ')}`);
  return {
    success: true,
    sent: true,
    provider: 'sendgrid',
    recipients,
    accepted: recipients,
    rejected: [],
    messageId: `sendgrid-${Date.now()}`,
  };
}

/**
 * Dispatch an email via Mailgun API
 */
async function sendViaMailgun(options: SendEmailOptions, recipients: string[], config: MailerConfig): Promise<EmailSendResult> {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN?.trim();

  if (!apiKey || !domain) {
    return {
      success: false,
      sent: false,
      provider: 'mailgun',
      recipients,
      accepted: [],
      rejected: recipients,
      error: 'Configuration Mailgun incomplète (MAILGUN_API_KEY et MAILGUN_DOMAIN requis).',
    };
  }

  const formData = new URLSearchParams();
  formData.append('from', formatFromHeader(config));
  recipients.forEach((r) => formData.append('to', r));
  formData.append('subject', options.subject);
  formData.append('html', options.html);
  if (options.text) formData.append('text', options.text);
  if (options.replyTo) formData.append('h:Reply-To', options.replyTo);

  const authHeader = Buffer.from(`api:${apiKey}`).toString('base64');
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || `Erreur HTTP ${res.status} Mailgun`;
    console.error(`[MAILER] ❌ Échec Mailgun (${res.status}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: 'mailgun',
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg,
    };
  }

  console.log(`[MAILER] ✅ Email envoyé avec succès via Mailgun (ID: ${data.id}) à ${recipients.join(', ')}`);
  return {
    success: true,
    sent: true,
    provider: 'mailgun',
    recipients,
    accepted: recipients,
    rejected: [],
    messageId: data.id,
  };
}

/**
 * Dispatch an email via SMTP (Nodemailer)
 */
async function sendViaSmtp(options: SendEmailOptions, recipients: string[], config: MailerConfig): Promise<EmailSendResult> {
  const transporter = createSmtpTransporter();
  if (!transporter) {
    return {
      success: false,
      sent: false,
      provider: 'smtp',
      recipients,
      accepted: [],
      rejected: recipients,
      error: 'Impossible d’initialiser le transporteur SMTP (vérifiez les variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).',
    };
  }

  try {
    const from = formatFromHeader(config);
    const info = await transporter.sendMail({
      from,
      to: recipients.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    const accepted = Array.isArray(info.accepted) ? (info.accepted as string[]) : recipients;
    const rejected = Array.isArray(info.rejected) ? (info.rejected as string[]) : [];

    if (accepted.length === 0 && rejected.length > 0) {
      return {
        success: false,
        sent: false,
        provider: 'smtp',
        recipients,
        accepted: [],
        rejected,
        error: 'Tous les destinataires ont été rejetés par le serveur SMTP.',
      };
    }

    console.log(`[MAILER] ✅ Email envoyé avec succès via SMTP (${config.smtpHost}) (ID: ${info.messageId}) à ${recipients.join(', ')}`);
    return {
      success: true,
      sent: true,
      provider: 'smtp',
      recipients,
      accepted,
      rejected,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue lors de la transmission SMTP';
    console.error(`[MAILER] ❌ Échec envoi SMTP (${config.smtpHost}):`, errorMsg);
    return {
      success: false,
      sent: false,
      provider: 'smtp',
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg,
    };
  }
}

/**
 * Universal safe email sender.
 * Detects the active provider and sends emails with strict error handling and reporting.
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  // Sanitize subject to prevent CRLF email header injection (BUG-016 Fix)
  const sanitizedSubject = (options.subject || '')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
  const safeOptions: SendEmailOptions = {
    ...options,
    subject: sanitizedSubject,
  };

  const recipients = normalizeRecipients(safeOptions.to);

  if (recipients.length === 0) {
    return {
      success: false,
      sent: false,
      provider: 'none',
      recipients: [],
      accepted: [],
      rejected: [],
      error: 'Aucune adresse e-mail destinataire valide fournie.',
    };
  }

  const config = getMailerConfig();

  // If no provider is configured, fail with a clean, controlled error message.
  if (!config.isConfigured || config.provider === 'none') {
    const warnMsg = 'Service d’envoi d’emails non configuré (SMTP, Brevo, Resend, SendGrid ou Mailgun).';
    console.warn(`[MAILER] ⚠️ ${warnMsg} Notification non émise pour : ${recipients.join(', ')}`);
    return {
      success: false,
      sent: false,
      provider: 'none',
      recipients,
      accepted: [],
      rejected: recipients,
      error: warnMsg,
    };
  }

  try {
    switch (config.provider) {
      case 'resend':
        return await sendViaResend(safeOptions, recipients, config);
      case 'brevo':
        return await sendViaBrevo(safeOptions, recipients, config);
      case 'sendgrid':
        return await sendViaSendGrid(safeOptions, recipients, config);
      case 'mailgun':
        return await sendViaMailgun(safeOptions, recipients, config);
      case 'smtp':
      default:
        return await sendViaSmtp(safeOptions, recipients, config);
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erreur inattendue lors de l’envoi de l’email';
    console.error('[MAILER] ❌ Erreur critique service email:', errorMsg);
    return {
      success: false,
      sent: false,
      provider: config.provider,
      recipients,
      accepted: [],
      rejected: recipients,
      error: errorMsg,
    };
  }
}

/**
 * Generates an executive-styled HTML email for administrators
 */
function buildAdminQuoteEmailHtml(quote: SubmittedQuote): string {
  const fileListHtml =
    quote.files && quote.files.length > 0
      ? quote.files
          .map(
            (f) =>
              `<li>📎 <strong>${f.originalName}</strong> (${Math.round(f.fileSize / 1024)} Ko)</li>`
          )
          .join('')
      : '<li><em>Aucun fichier joint</em></li>';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { background: #0010c2; color: #ffffff; padding: 28px 32px; border-bottom: 4px solid #d97706; }
    .header h1 { margin: 0; font-size: 22px; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1; }
    .content { padding: 32px; }
    .badge-ref { display: inline-block; background: #fef3c7; color: #92400e; font-weight: 700; padding: 4px 12px; border-radius: 6px; font-size: 14px; margin-bottom: 20px; border: 1px solid #fde68a; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
    .table td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .table td.label { font-weight: 600; color: #475569; width: 35%; background: #f8fafc; }
    .table td.value { color: #0f172a; font-weight: 500; }
    .price-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 18px 24px; text-align: right; margin-top: 20px; }
    .price-box .amount { font-size: 24px; font-weight: 800; color: #0010c2; }
    .price-box .disclaimer { font-size: 12px; color: #64748b; margin-top: 4px; }
    .footer { background: #0f172a; color: #94a3b8; padding: 20px 32px; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BARKA SOLUTIONS S.A.S — Nouvelle demande de devis</h1>
      <p>Notification de devis générée par la plateforme web</p>
    </div>
    <div class="content">
      <span class="badge-ref">RÉFÉRENCE : ${quote.id}</span>

      <h3 style="color: #0010c2; margin-top: 0;">1. Coordonnées du Client</h3>
      <table class="table">
        <tr><td class="label">Nom complet</td><td class="value">${quote.nomComplet}</td></tr>
        <tr><td class="label">Entreprise</td><td class="value">${quote.entreprise || 'Particulier'}</td></tr>
        <tr><td class="label">Téléphone</td><td class="value"><strong>${quote.telephone}</strong></td></tr>
        <tr><td class="label">E-mail</td><td class="value">${quote.email || 'Non renseigné'}</td></tr>
        <tr><td class="label">Ville</td><td class="value">${quote.ville}</td></tr>
      </table>

      <h3 style="color: #0010c2;">2. Détails techniques du projet</h3>
      <table class="table">
        <tr><td class="label">Prestation / Produit</td><td class="value"><strong>${quote.typePrestation}</strong> ${quote.produit ? `— ${quote.produit}` : ''}</td></tr>
        <tr><td class="label">Quantité</td><td class="value"><strong>${quote.quantite} exemplaires</strong></td></tr>
        <tr><td class="label">Format</td><td class="value">${quote.format}</td></tr>
        <tr><td class="label">Support / Papier</td><td class="value">${quote.supportPapier || 'Standard'} ${quote.grammage ? `(${quote.grammage})` : ''}</td></tr>
        <tr><td class="label">Impression</td><td class="value">${quote.impressionType || 'Recto seul'}</td></tr>
        <tr><td class="label">Finition</td><td class="value">${quote.finition}</td></tr>
        <tr><td class="label">Délai souhaité</td><td class="value">${quote.delai}</td></tr>
        <tr><td class="label">Livraison</td><td class="value">${quote.livraisonOption || 'Retrait en agence'}</td></tr>
        <tr><td class="label">Graphisme</td><td class="value">${quote.graphismeOption || 'Fichier prêt fourni'}</td></tr>
        <tr><td class="label">Description / Note</td><td class="value">${quote.description || 'Aucune'}</td></tr>
      </table>

      <h3 style="color: #0010c2;">3. Fichiers & Pièces jointes</h3>
      <ul style="padding-left: 20px; color: #334155; font-size: 14px;">
        ${fileListHtml}
      </ul>

      <div class="price-box">
        <span style="font-size: 13px; text-transform: uppercase; font-weight: 700; color: #64748b;">Estimation Indicative Web</span>
        <div class="amount">${(quote.estimatedPrice || 0).toLocaleString('fr-FR')} FCFA</div>
        <div class="disclaimer">Le prix définitif sera confirmé après contrôle PAO et validation BAT.</div>
      </div>
    </div>
    <div class="footer">
      BARKA SOLUTIONS S.A.S — ${DEFAULT_COMPANY_SETTINGS.address}<br>
      Tél : ${DEFAULT_COMPANY_SETTINGS.phone_primary} | WhatsApp : ${DEFAULT_COMPANY_SETTINGS.whatsapp}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates an executive-styled HTML email for the client confirmation
 */
function buildClientConfirmationEmailHtml(quote: SubmittedQuote): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: #0010c2; color: #ffffff; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .content { padding: 32px; }
    .ref-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
    .btn-wa { display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; margin-top: 15px; }
    .footer { background: #f1f5f9; padding: 20px; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>BARKA SOLUTIONS S.A.S</h1>
      <p style="margin: 4px 0 0; color: #cbd5e1; font-size: 13px;">${DEFAULT_COMPANY_SETTINGS.slogan}</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>${quote.nomComplet}</strong>,</p>
      <p>Nous avons bien reçu votre demande de devis et nous vous remercions de votre confiance.</p>
      
      <div class="ref-card">
        <div style="font-size: 13px; color: #166534; font-weight: 600;">VOTRE NUMÉRO DE RÉFÉRENCE</div>
        <div style="font-size: 22px; font-weight: 800; color: #15803d; margin-top: 4px;">${quote.id}</div>
      </div>

      <p><strong>Récapitulatif de votre projet :</strong></p>
      <ul style="line-height: 1.8; font-size: 14px; color: #334155;">
        <li><strong>Prestation :</strong> ${quote.typePrestation}</li>
        <li><strong>Quantité :</strong> ${quote.quantite} ex.</li>
        <li><strong>Format :</strong> ${quote.format}</li>
        <li><strong>Finition :</strong> ${quote.finition}</li>
        <li><strong>Délai souhaité :</strong> ${quote.delai}</li>
        <li><strong>Estimation indicative :</strong> ${(quote.estimatedPrice || 0).toLocaleString('fr-FR')} FCFA</li>
      </ul>

      <p style="font-size: 13px; color: #64748b; background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid #0010c2;">
        ℹ️ <em>Le prix définitif sera confirmé par nos techniciens après vérification de vos fichiers et contraintes de fabrication.</em>
      </p>

      <div style="text-align: center; margin-top: 25px;">
        <p style="font-size: 14px; color: #475569; margin-bottom: 8px;">Pour un traitement prioritaire, écrivez-nous sur WhatsApp :</p>
        <a href="https://wa.me/${DEFAULT_COMPANY_SETTINGS.whatsapp_raw}?text=Bonjour%20BARKA%20SOLUTIONS%2C%20je%20suis%20${encodeURIComponent(quote.nomComplet)}%20(R%C3%A9f%20%3A%20${quote.id})" class="btn-wa">
          Contacter notre équipe sur WhatsApp
        </a>
      </div>
    </div>
    <div class="footer">
      ${DEFAULT_COMPANY_SETTINGS.company_name} — ${DEFAULT_COMPANY_SETTINGS.address}<br>
      Tél : ${DEFAULT_COMPANY_SETTINGS.phone_primary} | Email : ${DEFAULT_COMPANY_SETTINGS.email_primary}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates an executive-styled HTML email for contact message notification
 */
function buildAdminContactEmailHtml(message: ContactMessage): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); }
    .header { background: #0010c2; color: #ffffff; padding: 24px 32px; }
    .content { padding: 32px; }
    .msg-box { background: #f8fafc; border-left: 4px solid #0010c2; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 15px; line-height: 1.6; color: #334155; }
    .footer { background: #0f172a; color: #94a3b8; padding: 18px 32px; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0; font-size: 20px;">Nouveau message de contact — BARKA SOLUTIONS</h2>
      <p style="margin: 4px 0 0; color: #cbd5e1; font-size: 13px;">Message envoyé depuis le formulaire web</p>
    </div>
    <div class="content">
      <p><strong>Expéditeur :</strong> ${message.name}</p>
      <p><strong>Contact :</strong> <strong>${message.emailOrPhone}</strong></p>
      <p><strong>Objet :</strong> ${message.subject || 'Demande d’information'}</p>
      <div class="msg-box">
        ${message.message.replace(/\n/g, '<br>')}
      </div>
      <p style="font-size: 12px; color: #64748b;">Reçu le : ${new Date().toLocaleString('fr-FR')}</p>
    </div>
    <div class="footer">
      BARKA SOLUTIONS S.A.S — Plateforme Web
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Main function to dispatch emails for a new quote.
 * Returns sentToAdmin: true ONLY IF sending to administrators succeeded.
 */
export async function sendQuoteNotifications(quote: SubmittedQuote): Promise<QuoteNotificationResult> {
  const adminRecipients = getAdminEmails();
  const adminSubject = `[NOUVEAU DEVIS] ${quote.id} — ${quote.nomComplet} (${quote.typePrestation})`;
  const adminHtml = buildAdminQuoteEmailHtml(quote);

  // 1. Envoi aux administrateurs (direction@barkasolutions.org, kouchoumichel@yahoo.fr)
  const adminResult = await sendEmail({
    to: adminRecipients,
    subject: adminSubject,
    html: adminHtml,
    replyTo: quote.email && EMAIL_REGEX.test(quote.email) ? quote.email : undefined,
  });

  // Strict enforcement: sentToAdmin is true only if the email was actually accepted and sent by the provider
  const sentToAdmin = adminResult.sent === true;

  // 2. Envoi de la confirmation au client (si adresse email valide fournie)
  let sentToClient = false;
  let clientResult: EmailSendResult | undefined;
  const clientEmail = quote.email ? quote.email.trim().toLowerCase() : '';

  if (clientEmail && EMAIL_REGEX.test(clientEmail)) {
    const clientSubject = `Votre demande de devis BARKA SOLUTIONS S.A.S (${quote.id})`;
    const clientHtml = buildClientConfirmationEmailHtml(quote);

    clientResult = await sendEmail({
      to: clientEmail,
      subject: clientSubject,
      html: clientHtml,
    });

    sentToClient = clientResult.sent === true;
  }

  const overallSuccess = sentToAdmin;

  return {
    success: overallSuccess,
    sentToAdmin,
    sentToClient,
    adminRecipients,
    clientRecipient: clientEmail || undefined,
    adminResult,
    clientResult,
    error: adminResult.error || (clientResult && !clientResult.sent ? clientResult.error : undefined),
  };
}

/**
 * Main function to dispatch email notifications for contact messages.
 */
export async function sendContactNotification(message: ContactMessage): Promise<QuoteNotificationResult> {
  const adminRecipients = getAdminEmails();
  const adminSubject = `[CONTACT WEB] ${message.subject || 'Nouveau message'} — ${message.name}`;
  const adminHtml = buildAdminContactEmailHtml(message);

  const replyTo =
    message.emailOrPhone && EMAIL_REGEX.test(message.emailOrPhone.trim())
      ? message.emailOrPhone.trim()
      : undefined;

  const adminResult = await sendEmail({
    to: adminRecipients,
    subject: adminSubject,
    html: adminHtml,
    replyTo,
  });

  const sentToAdmin = adminResult.sent === true;

  return {
    success: sentToAdmin,
    sentToAdmin,
    sentToClient: false,
    adminRecipients,
    adminResult,
    error: adminResult.error,
  };
}

/**
 * Diagnostic & Testing Helper for the administration panel
 */
export async function testEmailDelivery(targetRecipient?: string): Promise<EmailSendResult> {
  const config = getMailerConfig();
  const target = targetRecipient && EMAIL_REGEX.test(targetRecipient.trim())
    ? targetRecipient.trim()
    : config.adminEmails[0] || 'direction@barkasolutions.org';

  const subject = `[TEST SYSTÈME] Vérification de l’envoi d’emails BARKA SOLUTIONS (${config.provider.toUpperCase()})`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; color: #0f172a;">
  <div style="max-width: 550px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0;">
    <h2 style="color: #0010c2; margin-top: 0;">Test d’envoi d’emails réussi !</h2>
    <p>Ce message confirme que la passerelle d’emails de <strong>BARKA SOLUTIONS S.A.S</strong> fonctionne correctement.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
      <tr><td style="padding: 6px 0; color: #64748b;">Fournisseur actif :</td><td><strong>${config.provider.toUpperCase()}</strong></td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Expéditeur :</td><td>${formatFromHeader(config)}</td></tr>
      <tr><td style="padding: 6px 0; color: #64748b;">Date & Heure :</td><td>${new Date().toLocaleString('fr-FR')}</td></tr>
    </table>
  </div>
</body>
</html>
  `;

  return await sendEmail({
    to: target,
    subject,
    html,
  });
}
