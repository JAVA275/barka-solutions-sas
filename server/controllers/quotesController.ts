import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { db, normalizeQuoteStatus, isValidQuoteStatusTransition } from '../db/database';
import { calculateQuotePrice } from '../services/pricingEngine';
import { sendQuoteNotifications } from '../services/mailer';
import { UploadedFileMeta, SubmittedQuote } from '../types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logAdminAction } from '../services/auditLogger';
import {
  QUOTES_UPLOADS_DIR,
  deleteQuotePhysicalFiles,
} from '../services/fileManager';

export function calculatePrice(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = calculateQuotePrice(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function createQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      nom,
      prenom,
      nomComplet,
      entreprise,
      email,
      telephone,
      ville,
      service,
      typePrestation,
      produit,
      quantite,
      format,
      supportPapier,
      grammage,
      impressionType,
      finition,
      delai,
      livraisonOption,
      graphismeOption,
      description,
    } = req.body;

    const finalNom = nom ? String(nom).trim() : '';
    const finalPrenom = prenom ? String(prenom).trim() : '';
    const computedNomComplet = nomComplet
      ? String(nomComplet).trim()
      : `${finalPrenom} ${finalNom}`.trim() || finalNom;

    const qty = Math.max(1, Math.floor(Number(quantite) || 1));
    const finalPrestation = String(typePrestation || service || '').trim();

    // 1. SERVER-SIDE PRICING ENGINE (The server is the SOLE source of truth)
    // NOTE: Any customEstimatedPrice or client-imposed price is strictly ignored.
    const pricingResult = calculateQuotePrice({
      typePrestation: finalPrestation,
      produit: produit ? String(produit).trim() : undefined,
      quantite: qty,
      format: format ? String(format).trim() : undefined,
      supportPapier: supportPapier ? String(supportPapier).trim() : undefined,
      grammage: grammage ? String(grammage).trim() : undefined,
      impressionType: impressionType === 'Recto/Verso' ? 'Recto/Verso' : 'Recto seul',
      finition: finition ? String(finition).trim() : undefined,
      delai: delai ? String(delai).trim() : undefined,
      livraisonOption: livraisonOption ? String(livraisonOption).trim() : undefined,
      graphismeOption: graphismeOption ? String(graphismeOption).trim() : undefined,
    });

    const officialServerEstimatedPrice = pricingResult.estimatedTotal;
    const officialPriceType = pricingResult.priceType;

    // 2. Process attached files into private metadata
    const attachedFiles: UploadedFileMeta[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        attachedFiles.push({
          id: file.filename,
          originalName: file.originalname,
          storedName: file.filename,
          filePath: '', // Populated with secure route below once quote ID is generated
          fileSize: file.size,
          mimeType: file.mimetype,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 3. Create quote with thread-safe sequential reference (BKS-AAAA-XXXXX)
    const newQuote = await db.createQuote({
      nom: finalNom || computedNomComplet,
      prenom: finalPrenom,
      nomComplet: computedNomComplet,
      entreprise: entreprise ? String(entreprise).trim() : 'Particulier',
      telephone: String(telephone).trim(),
      email: email ? String(email).trim().toLowerCase() : '',
      ville: ville ? String(ville).trim() : 'Ngaoundéré',
      typePrestation: finalPrestation,
      produit: produit ? String(produit).trim() : undefined,
      quantite: qty,
      format: format ? String(format).trim() : 'Standard',
      supportPapier: supportPapier ? String(supportPapier).trim() : 'Papier standard',
      grammage: grammage ? String(grammage).trim() : undefined,
      impressionType: impressionType === 'Recto/Verso' ? 'Recto/Verso' : 'Recto seul',
      finition: finition ? String(finition).trim() : 'Standard',
      delai: delai ? String(delai).trim() : 'Standard (3-5 jours)',
      livraisonOption: livraisonOption ? String(livraisonOption).trim() : 'Retrait en agence',
      graphismeOption: graphismeOption ? String(graphismeOption).trim() : 'Fichier prêt fourni',
      description: description ? String(description).trim() : '',
      estimatedPrice: officialServerEstimatedPrice,
      priceType: officialPriceType,
      status: 'NOUVEAU',
      files: attachedFiles.map((f) => ({
        ...f,
        filePath: `/api/quotes/${'TEMP'}/files/${f.storedName}`,
      })),
    });

    // Populate official private download route in file metadata
    if (newQuote.files && Array.isArray(newQuote.files)) {
      newQuote.files = newQuote.files.map((f) => ({
        ...f,
        filePath: `/api/quotes/${newQuote.id}/files/${f.storedName}`,
      }));
    }

    const company = db.getCompanySettings();

    // 4. Generate formal WhatsApp message matching official specification
    const waLines = [
      'BARKA SOLUTIONS S.A.S',
      'Nouvelle demande de devis',
      '',
      `Réf : ${newQuote.id}`,
      `Nom : ${newQuote.nomComplet}`,
      `Entreprise : ${newQuote.entreprise || 'Particulier'}`,
      `Téléphone : ${newQuote.telephone}`,
      `Email : ${newQuote.email || 'Non renseigné'}`,
      `Ville : ${newQuote.ville}`,
      `Service : ${newQuote.typePrestation}`,
      `Produit : ${newQuote.produit || 'Standard'}`,
      `Quantité : ${newQuote.quantite} ex`,
      `Format : ${newQuote.format}`,
      `Finition : ${newQuote.finition}`,
      `Délai : ${newQuote.delai}`,
      `Estimation : ~${(newQuote.estimatedPrice || 0).toLocaleString('fr-FR')} FCFA (Indicative)`,
      `Description : ${newQuote.description || 'Aucune'}`,
    ];

    const waText = encodeURIComponent(waLines.join('\n'));
    const whatsappUrl = `https://wa.me/${company.whatsapp_raw || '237696311198'}?text=${waText}`;

    // 5. Dispatch real email notifications to Admins & Client
    let emailStatus = {
      sentToAdmin: false,
      sentToClient: false,
      adminRecipients: ['direction@barkasolutions.org', 'kouchoumichel@yahoo.fr'],
      clientRecipient: newQuote.email || undefined,
      error: undefined as string | undefined,
    };

    try {
      const mailResult = await sendQuoteNotifications(newQuote);
      emailStatus = {
        sentToAdmin: mailResult.sentToAdmin,
        sentToClient: mailResult.sentToClient,
        adminRecipients: mailResult.adminRecipients,
        clientRecipient: mailResult.clientRecipient,
        error: mailResult.error,
      };
    } catch (mailErr: unknown) {
      const errMessage = mailErr instanceof Error ? mailErr.message : 'Erreur transmission email';
      console.error('[MAILER] ❌ Erreur lors de l’envoi de notification devis:', errMessage);
      emailStatus.error = errMessage;
    }

    res.status(201).json({
      success: true,
      message: 'Votre demande de devis a été enregistrée avec succès.',
      data: newQuote,
      whatsappUrl,
      sentToAdmin: emailStatus.sentToAdmin,
      sentToClient: emailStatus.sentToClient,
      emailStatus,
      legalNotice: pricingResult.legalNotice,
      confirmationNotice: pricingResult.confirmationNotice,
    });
  } catch (err) {
    next(err);
  }
}

export function listQuotes(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { status } = req.query;
    const quotes = db.getAllQuotes(status ? normalizeQuoteStatus(String(status)) : undefined);

    res.json({
      success: true,
      count: quotes.length,
      data: quotes,
    });
  } catch (err) {
    next(err);
  }
}

export function getQuote(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const quote = db.getQuoteById(req.params.id);
    if (!quote) {
      res.status(404).json({ success: false, error: 'Devis introuvable' });
      return;
    }
    res.json({ success: true, data: quote });
  } catch (err) {
    next(err);
  }
}

export function updateQuote(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const { status, adminNotes, finalPrice, estimatedPrice, description } = req.body;

    const quote = db.getQuoteById(id);
    if (!quote) {
      res.status(404).json({ success: false, error: 'Devis introuvable' });
      return;
    }

    const oldSnapshot = {
      status: quote.status,
      adminNotes: quote.adminNotes,
      finalPrice: quote.finalPrice,
      estimatedPrice: quote.estimatedPrice,
      description: quote.description,
    };

    const updates: Partial<SubmittedQuote> = {};
    if (status) {
      const targetStatus = normalizeQuoteStatus(status);
      if (quote.status !== targetStatus && !isValidQuoteStatusTransition(quote.status, targetStatus)) {
        if (req.user?.role !== 'ADMIN') {
          res.status(409).json({
            success: false,
            error: `Transition de statut invalide : le passage de '${quote.status}' à '${targetStatus}' n'est pas autorisé.`,
            code: 'INVALID_STATUS_TRANSITION',
          });
          return;
        }
      }
      updates.status = targetStatus;
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (finalPrice !== undefined) updates.finalPrice = Number(finalPrice);
    if (estimatedPrice !== undefined) updates.estimatedPrice = Number(estimatedPrice);
    if (description !== undefined) updates.description = description;

    const updatedQuote = db.updateQuote(id, updates, req.user?.fullName || req.user?.username);

    // Audit log
    const statusChanged = status && status !== oldSnapshot.status;
    logAdminAction({
      req,
      action: statusChanged ? 'STATUS_CHANGE' : 'UPDATE',
      resource: 'DEVIS',
      resourceId: id,
      resourceTitle: quote.nomComplet ? `Devis ${quote.nomComplet}` : `Devis #${id}`,
      description: statusChanged
        ? `${req.user?.role || 'EDITOR'} a changé le statut du devis (#${id} : ${oldSnapshot.status} -> ${status}).`
        : `${req.user?.role || 'EDITOR'} a modifié le devis #${id}.`,
      oldValue: oldSnapshot,
      newValue: {
        status: updatedQuote?.status,
        adminNotes: updatedQuote?.adminNotes,
        finalPrice: updatedQuote?.finalPrice,
        estimatedPrice: updatedQuote?.estimatedPrice,
        description: updatedQuote?.description,
      },
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: 'Devis mis à jour avec succès',
      data: updatedQuote,
    });
  } catch (err) {
    next(err);
  }
}

export function deleteQuote(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const quote = db.getQuoteById(id);
    if (!quote) {
      res.status(404).json({ success: false, error: 'Devis introuvable' });
      return;
    }

    // Nettoyer les fichiers physiques attachés à ce devis
    if (quote.files && Array.isArray(quote.files)) {
      deleteQuotePhysicalFiles(quote.files);
    }

    const success = db.deleteQuote(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Erreur lors de la suppression du devis' });
      return;
    }

    // Audit log
    logAdminAction({
      req,
      action: 'DELETE',
      resource: 'DEVIS',
      resourceId: id,
      resourceTitle: `Devis ${quote.nomComplet || id}`,
      description: `${req.user?.role || 'ADMIN'} a supprimé le devis #${id} (${quote.nomComplet || 'Client'}).`,
      oldValue: {
        id: quote.id,
        nomComplet: quote.nomComplet,
        entreprise: quote.entreprise,
        status: quote.status,
        estimatedPrice: quote.estimatedPrice,
      },
      newValue: null,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: `Devis ${id} supprimé avec succès`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Route protégée : Télécharger en toute sécurité un fichier joint à un devis
 * GET /api/quotes/:quoteId/files/:fileId
 */
export function downloadQuoteFile(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { quoteId, fileId } = req.params;

    if (!quoteId || !fileId) {
      res.status(400).json({ success: false, error: 'Paramètres quoteId et fileId obligatoires.' });
      return;
    }

    // 1. Protection Anti Path-Traversal stricte
    if (
      fileId.includes('..') ||
      fileId.includes('/') ||
      fileId.includes('\\') ||
      fileId.includes('\0') ||
      quoteId.includes('..') ||
      quoteId.includes('/') ||
      quoteId.includes('\\')
    ) {
      res.status(400).json({ success: false, error: 'Requête ou identifiant de fichier invalide.' });
      return;
    }

    // 2. Vérification de l'existence du devis
    const quote = db.getQuoteById(quoteId);
    if (!quote) {
      res.status(404).json({ success: false, error: 'Devis introuvable.' });
      return;
    }

    // 3. Recherche du fichier dans les métadonnées du devis
    const fileMeta = quote.files?.find(
      (f) =>
        f.id === fileId ||
        f.storedName === fileId ||
        path.basename(f.filePath || '') === fileId
    );

    if (!fileMeta) {
      res.status(404).json({ success: false, error: 'Fichier non trouvé pour ce devis.' });
      return;
    }

    const safeStoredName = path.basename(fileMeta.storedName || fileId);
    const absolutePath = path.resolve(QUOTES_UPLOADS_DIR, safeStoredName);

    // 4. Vérification du périmètre de sécurité
    if (!absolutePath.startsWith(QUOTES_UPLOADS_DIR)) {
      res.status(403).json({ success: false, error: 'Accès non autorisé.' });
      return;
    }

    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ success: false, error: 'Le fichier physique est introuvable sur le serveur.' });
      return;
    }

    // 5. En-têtes HTTP de sécurité pour le téléchargement
    const sanitizedOriginalName = (fileMeta.originalName || 'document')
      .replace(/[\r\n\0"]/g, '_')
      .trim();

    res.setHeader('Content-Type', fileMeta.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(sanitizedOriginalName)}"; filename*=UTF-8''${encodeURIComponent(sanitizedOriginalName)}`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
}
