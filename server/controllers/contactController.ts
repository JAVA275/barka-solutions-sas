import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { sendContactNotification } from '../services/mailer';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logAdminAction } from '../services/auditLogger';

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, emailOrPhone, subject, message } = req.body;

    const newMsg = db.createMessage({
      name: String(name).trim(),
      emailOrPhone: String(emailOrPhone).trim(),
      subject: subject ? String(subject).trim() : 'Demande d’information BARKA SOLUTIONS',
      message: String(message).trim(),
    });

    const company = db.getCompanySettings();
    const waText = encodeURIComponent(
      `Bonjour BARKA SOLUTIONS,\n\nMessage de : ${newMsg.name}\nContact : ${newMsg.emailOrPhone}\nObjet : ${newMsg.subject}\n\n${newMsg.message}`
    );
    const whatsappUrl = `https://wa.me/${company.whatsapp_raw}?text=${waText}`;

    // Send real email notification to Administrators
    let sentToAdmin = false;
    let emailError: string | undefined;

    try {
      const mailResult = await sendContactNotification(newMsg);
      sentToAdmin = mailResult.sentToAdmin;
      emailError = mailResult.error;
    } catch (mailErr: unknown) {
      const msg = mailErr instanceof Error ? mailErr.message : 'Erreur notification email contact';
      console.error('[MAILER] ❌ Erreur contact notification:', msg);
      emailError = msg;
    }

    res.status(201).json({
      success: true,
      message: 'Votre message a été transmis avec succès à l’équipe BARKA SOLUTIONS.',
      data: newMsg,
      whatsappUrl,
      sentToAdmin,
      emailError: emailError || null,
    });
  } catch (err) {
    next(err);
  }
}

export function listMessages(_req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const messages = db.getAllMessages();
    res.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (err) {
    next(err);
  }
}

export function updateMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const { read, adminReply } = req.body;

    const existingMsg = db.getAllMessages().find((m) => m.id === id);
    const updated = db.updateMessage(id, { read: Boolean(read), adminReply });
    if (!updated) {
      res.status(404).json({ success: false, error: 'Message introuvable' });
      return;
    }

    // Audit log if reply added or significant update
    if (adminReply && adminReply !== existingMsg?.adminReply) {
      logAdminAction({
        req,
        action: 'UPDATE',
        resource: 'MESSAGE',
        resourceId: id,
        resourceTitle: updated.subject || `Message de ${updated.name}`,
        description: `${req.user?.role || 'EDITOR'} a répondu au message (#${id} - ${updated.name}).`,
        oldValue: { adminReply: existingMsg?.adminReply },
        newValue: { adminReply: updated.adminReply },
      }).catch((e) => console.warn('Audit error:', e));
    }

    res.json({
      success: true,
      message: 'Message mis à jour',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export function deleteMessage(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const existingMsg = db.getAllMessages().find((m) => m.id === id);
    const success = db.deleteMessage(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Message introuvable' });
      return;
    }

    // Audit log
    logAdminAction({
      req,
      action: 'DELETE',
      resource: 'MESSAGE',
      resourceId: id,
      resourceTitle: existingMsg?.subject || `Message #${id}`,
      description: `${req.user?.role || 'ADMIN'} a supprimé un message (#${id} de ${existingMsg?.name || 'Inconnu'}).`,
      oldValue: existingMsg,
      newValue: null,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: `Message ${id} supprimé`,
    });
  } catch (err) {
    next(err);
  }
}

