import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logAdminAction } from '../services/auditLogger';

export function listPriceCategories(_req: Request, res: Response, next: NextFunction): void {
  try {
    const categories = db.getAllPriceCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

export function savePriceItem(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { categoryId } = req.params;
    const item = { ...req.body };

    const isNew = !item.id;
    if (!item.id) {
      item.id = `price-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }

    if (!item.name || item.unitPrice === undefined) {
      res.status(400).json({ success: false, error: 'Nom et prix unitaire requis' });
      return;
    }

    const currentCategory = db.getPriceCategoryById(categoryId);
    const oldItem = currentCategory?.items?.find((i) => i.id === item.id) || null;

    const saved = db.savePriceCategoryItem(categoryId, item);

    // Audit log
    logAdminAction({
      req,
      action: isNew || !oldItem ? 'CREATE' : 'UPDATE',
      resource: 'TARIF',
      resourceId: item.id,
      resourceTitle: item.name,
      description: isNew || !oldItem
        ? `${req.user?.role || 'ADMIN'} a créé le tarif (${item.name} - ${item.unitPrice} FCFA).`
        : `${req.user?.role || 'ADMIN'} a modifié le tarif (${item.name}).`,
      oldValue: oldItem,
      newValue: saved,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: 'Tarif enregistré avec succès',
      data: saved,
    });
  } catch (err) {
    next(err);
  }
}

export function deletePriceItem(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { categoryId, itemId } = req.params;
    const currentCategory = db.getPriceCategoryById(categoryId);
    const oldItem = currentCategory?.items?.find((i) => i.id === itemId) || null;

    const success = db.deletePriceCategoryItem(categoryId, itemId);
    if (!success) {
      res.status(404).json({ success: false, error: 'Ligne tarifaire introuvable' });
      return;
    }

    // Audit log
    logAdminAction({
      req,
      action: 'DELETE',
      resource: 'TARIF',
      resourceId: itemId,
      resourceTitle: oldItem?.name || itemId,
      description: `${req.user?.role || 'ADMIN'} a supprimé le tarif (${oldItem?.name || itemId}).`,
      oldValue: oldItem,
      newValue: null,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: 'Ligne tarifaire supprimée avec succès',
    });
  } catch (err) {
    next(err);
  }
}

export function togglePriceItem(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { categoryId, itemId } = req.params;
    const currentCategory = db.getPriceCategoryById(categoryId);
    const oldItem = currentCategory?.items?.find((i) => i.id === itemId) || null;

    const updated = db.togglePriceCategoryItem(categoryId, itemId);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Ligne tarifaire introuvable' });
      return;
    }

    // Audit log
    logAdminAction({
      req,
      action: 'TOGGLE_STATUS',
      resource: 'TARIF',
      resourceId: itemId,
      resourceTitle: updated.name,
      description: `${req.user?.role || 'ADMIN'} a ${updated.active ? 'activé' : 'désactivé'} le tarif (${updated.name}).`,
      oldValue: { active: oldItem?.active },
      newValue: { active: updated.active },
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: `Statut du tarif mis à jour (${updated.active ? 'Actif' : 'Inactif'})`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

