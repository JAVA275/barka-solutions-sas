import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logAdminAction } from '../services/auditLogger';

export function listServices(req: Request, res: Response, next: NextFunction): void {
  try {
    const activeOnly = req.query.all !== 'true';
    const services = db.getAllServices(activeOnly);
    res.json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (err) {
    next(err);
  }
}

export function getService(req: Request, res: Response, next: NextFunction): void {
  try {
    const service = db.getServiceById(req.params.id);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service introuvable' });
      return;
    }
    res.json({ success: true, data: service });
  } catch (err) {
    next(err);
  }
}

export function createService(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const {
      title,
      category,
      groupId,
      groupTitle,
      shortDesc,
      fullDesc,
      iconName,
      image,
      popular,
      active,
      priceStartingAt,
      features,
      sampleDeliverables,
      quoteTypePrestation,
    } = req.body;

    if (!title || !category || !shortDesc) {
      res.status(400).json({ success: false, error: 'Titre, catégorie et courte description requis' });
      return;
    }

    const newService = db.createService({
      id: req.body.id ? String(req.body.id).trim() : undefined,
      title: String(title).trim(),
      category: String(category).trim(),
      groupId: groupId || 'imprimerie',
      groupTitle: groupTitle || 'Imprimerie',
      shortDesc: String(shortDesc).trim(),
      fullDesc: fullDesc ? String(fullDesc).trim() : String(shortDesc).trim(),
      iconName: iconName || 'Printer',
      image: image || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
      popular: Boolean(popular),
      active: active !== undefined ? Boolean(active) : true,
      priceStartingAt: priceStartingAt ? Number(priceStartingAt) : undefined,
      features: Array.isArray(features) ? features : [],
      sampleDeliverables: Array.isArray(sampleDeliverables) ? sampleDeliverables : [],
      quoteTypePrestation: quoteTypePrestation || String(title).trim(),
    });

    // Audit log
    logAdminAction({
      req,
      action: 'CREATE',
      resource: 'SERVICE',
      resourceId: newService.id,
      resourceTitle: newService.title,
      description: `${req.user?.role || 'ADMIN'} a créé un service (${newService.title}).`,
      oldValue: null,
      newValue: newService,
    }).catch((e) => console.warn('Audit error:', e));

    res.status(201).json({
      success: true,
      message: 'Service créé avec succès',
      data: newService,
    });
  } catch (err) {
    next(err);
  }
}

export function updateService(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const existing = db.getServiceById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service introuvable' });
      return;
    }

    const oldSnapshot = { ...existing };
    const updated = db.updateService(id, req.body);

    // Audit log
    logAdminAction({
      req,
      action: 'UPDATE',
      resource: 'SERVICE',
      resourceId: id,
      resourceTitle: updated?.title || existing.title,
      description: `${req.user?.role || 'ADMIN'} a modifié un service (${updated?.title || existing.title}).`,
      oldValue: oldSnapshot,
      newValue: updated,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: 'Service mis à jour avec succès',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export function deleteService(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const existing = db.getServiceById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service introuvable' });
      return;
    }

    const success = db.deleteService(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Service introuvable' });
      return;
    }

    // Audit log
    logAdminAction({
      req,
      action: 'DELETE',
      resource: 'SERVICE',
      resourceId: id,
      resourceTitle: existing.title,
      description: `${req.user?.role || 'ADMIN'} a supprimé un service (${existing.title}).`,
      oldValue: existing,
      newValue: null,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: `Service ${id} supprimé avec succès`,
    });
  } catch (err) {
    next(err);
  }
}

