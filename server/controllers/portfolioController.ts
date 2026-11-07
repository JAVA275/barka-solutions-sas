import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { deletePortfolioPhysicalImage } from '../services/fileManager';
import { logAdminAction } from '../services/auditLogger';
import { PortfolioItem } from '../types';

export function listPortfolio(req: Request, res: Response, next: NextFunction): void {
  try {
    const { category, includeInactive } = req.query;
    const portfolio = db.getAllPortfolio(
      category ? String(category) : undefined,
      includeInactive === 'true'
    );
    res.json({
      success: true,
      count: portfolio.length,
      data: portfolio,
    });
  } catch (err) {
    next(err);
  }
}

export function getPortfolioItem(req: Request, res: Response, next: NextFunction): void {
  try {
    const item = db.getPortfolioById(req.params.id);
    if (!item) {
      res.status(404).json({ success: false, error: 'Réalisation introuvable' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export function createPortfolioItem(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { title, category, description, client, year, tags, featured, active, isDemo, serviceAssocie, serviceId } = req.body;

    if (!title || !category || !description) {
      res.status(400).json({ success: false, error: 'Titre, catégorie et description requis' });
      return;
    }

    let imageUrl = '';
    const imagesList: string[] = [];

    if (req.file) {
      imageUrl = `/uploads/portfolio/${req.file.filename}`;
      imagesList.push(imageUrl);
    } else if (req.body.image || req.body.imageUrl) {
      imageUrl = String(req.body.image || req.body.imageUrl);
      imagesList.push(imageUrl);
    }

    const newItem = db.createPortfolioItem({
      title: String(title).trim(),
      category: category as any,
      description: String(description).trim(),
      image: imageUrl,
      images: imagesList,
      client: client ? String(client).trim() : undefined,
      year: year ? String(year).trim() : new Date().getFullYear().toString(),
      tags: tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim()).filter(Boolean)) : [],
      featured: Boolean(featured),
      active: active !== undefined ? Boolean(active) : true,
      isDemo: Boolean(isDemo),
      serviceAssocie: serviceAssocie ? String(serviceAssocie).trim() : undefined,
      serviceId: serviceId ? String(serviceId).trim() : undefined,
    });

    // Audit log
    logAdminAction({
      req,
      action: 'CREATE',
      resource: 'PORTFOLIO',
      resourceId: newItem.id,
      resourceTitle: newItem.title,
      description: `${req.user?.role || 'ADMIN'} a créé une réalisation portfolio (${newItem.title}).`,
      oldValue: null,
      newValue: newItem,
    }).catch((e) => console.warn('Audit error:', e));

    res.status(201).json({
      success: true,
      message: 'Réalisation ajoutée avec succès au portfolio',
      data: newItem,
    });
  } catch (err) {
    next(err);
  }
}

export function updatePortfolioItem(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const existing = db.getPortfolioById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Réalisation introuvable' });
      return;
    }

    const oldSnapshot = { ...existing };
    const allowedKeys = [
      'title',
      'category',
      'description',
      'client',
      'year',
      'tags',
      'featured',
      'active',
      'isDemo',
      'serviceAssocie',
      'serviceId',
      'image',
      'images',
    ];

    const updates: Partial<PortfolioItem> = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        (updates as any)[key] = req.body[key];
      }
    }

    // If a new physical image was uploaded
    if (req.file) {
      // Supprimer l'ancienne image si c'était un upload local
      if (existing.image && existing.image.startsWith('/uploads/portfolio/')) {
        deletePortfolioPhysicalImage(existing.image);
      }
      updates.image = `/uploads/portfolio/${req.file.filename}`;
      updates.images = [updates.image];
    } else if (req.body.image || req.body.imageUrl) {
      updates.image = String(req.body.image || req.body.imageUrl);
      if (!updates.images || updates.images.length === 0) {
        updates.images = [updates.image];
      }
    }

    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = (updates.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    if (updates.active !== undefined) {
      updates.active = Boolean(updates.active);
    }

    if (updates.isDemo !== undefined) {
      updates.isDemo = Boolean(updates.isDemo);
    }

    if (updates.featured !== undefined) {
      updates.featured = Boolean(updates.featured);
    }

    const updated = db.updatePortfolioItem(id, updates);

    // Audit log
    logAdminAction({
      req,
      action: 'UPDATE',
      resource: 'PORTFOLIO',
      resourceId: id,
      resourceTitle: updated?.title || existing.title,
      description: `${req.user?.role || 'ADMIN'} a modifié un portfolio (${updated?.title || existing.title}).`,
      oldValue: oldSnapshot,
      newValue: updated,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: 'Réalisation mise à jour avec succès',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export function togglePortfolioItem(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const existing = db.getPortfolioById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Réalisation introuvable' });
      return;
    }

    const { active } = req.body;
    const updated = db.togglePortfolioItem(id, active !== undefined ? Boolean(active) : undefined);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Réalisation introuvable' });
      return;
    }

    // Audit log
    logAdminAction({
      req,
      action: 'TOGGLE_STATUS',
      resource: 'PORTFOLIO',
      resourceId: id,
      resourceTitle: updated.title,
      description: `${req.user?.role || 'ADMIN'} a ${updated.active !== false ? 'activé' : 'désactivé'} la réalisation portfolio (${updated.title}).`,
      oldValue: { active: existing.active },
      newValue: { active: updated.active },
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: `Statut de la réalisation ${updated.active !== false ? 'activé' : 'désactivé'}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export function deletePortfolioItem(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const existing = db.getPortfolioById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Réalisation introuvable' });
      return;
    }

    // Supprimer physiquement l'image locale si applicable
    if (existing.image && existing.image.startsWith('/uploads/portfolio/')) {
      deletePortfolioPhysicalImage(existing.image);
    }
    if (existing.images && Array.isArray(existing.images)) {
      for (const img of existing.images) {
        if (img && img.startsWith('/uploads/portfolio/')) {
          deletePortfolioPhysicalImage(img);
        }
      }
    }

    const success = db.deletePortfolioItem(id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Erreur lors de la suppression de la réalisation' });
      return;
    }

    // Audit log
    logAdminAction({
      req,
      action: 'DELETE',
      resource: 'PORTFOLIO',
      resourceId: id,
      resourceTitle: existing.title,
      description: `${req.user?.role || 'ADMIN'} a supprimé un portfolio (${existing.title}).`,
      oldValue: existing,
      newValue: null,
    }).catch((e) => console.warn('Audit error:', e));

    res.json({
      success: true,
      message: `Réalisation ${id} supprimée avec succès`,
    });
  } catch (err) {
    next(err);
  }
}

export function uploadPortfolioImage(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Aucun fichier image fourni' });
      return;
    }
    res.json({
      success: true,
      imageUrl: `/uploads/portfolio/${req.file.filename}`,
      message: 'Image téléversée avec succès',
    });
  } catch (err) {
    next(err);
  }
}

