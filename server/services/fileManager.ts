import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { UploadedFileMeta } from '../types';
import { db } from '../db/database';

export const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
export const QUOTES_UPLOADS_DIR = path.join(UPLOADS_ROOT, 'quotes');
export const PORTFOLIO_UPLOADS_DIR = path.join(UPLOADS_ROOT, 'portfolio');

// Ensure required directories exist at startup
export function initUploadDirectories(): void {
  if (!fs.existsSync(UPLOADS_ROOT)) {
    fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
  }
  if (!fs.existsSync(QUOTES_UPLOADS_DIR)) {
    fs.mkdirSync(QUOTES_UPLOADS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PORTFOLIO_UPLOADS_DIR)) {
    fs.mkdirSync(PORTFOLIO_UPLOADS_DIR, { recursive: true });
  }
}

initUploadDirectories();

/**
 * Generate a cryptographically random, safe filename preserving the original lowercase extension.
 */
export function generateRandomFileName(originalName: string, prefix = 'file'): string {
  const rawExt = path.extname(originalName).toLowerCase();
  const safeExt = rawExt.replace(/[^a-z0-9.]/g, '');
  const timestamp = Date.now();
  const randomHex = crypto.randomBytes(12).toString('hex');
  return `${prefix}-${timestamp}-${randomHex}${safeExt}`;
}

/**
 * Delete a list of Express Multer files from disk (e.g. on validation failure)
 */
export function deleteMulterFiles(files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }): void {
  if (!files) return;
  const list: Express.Multer.File[] = Array.isArray(files)
    ? files
    : Object.values(files).flat();

  for (const file of list) {
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn(`⚠️ [FileManager] Impossible de supprimer le fichier temporaire: ${file.path}`, err);
      }
    }
  }
}

/**
 * Delete physical files of a quote from the secure quotes directory
 */
export function deleteQuotePhysicalFiles(files?: UploadedFileMeta[]): void {
  if (!files || !Array.isArray(files)) return;

  for (const f of files) {
    const filename = path.basename(f.storedName || f.id || path.basename(f.filePath || ''));
    if (!filename || filename === '.' || filename === '..') continue;

    const fullPath = path.resolve(QUOTES_UPLOADS_DIR, filename);
    // Security check: ensure path is strictly inside QUOTES_UPLOADS_DIR
    if (fullPath.startsWith(QUOTES_UPLOADS_DIR) && fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.warn(`⚠️ [FileManager] Erreur suppression fichier devis: ${fullPath}`, err);
      }
    }
  }
}

/**
 * Delete a portfolio physical image from the portfolio uploads directory
 */
export function deletePortfolioPhysicalImage(imageUrlOrName?: string): void {
  if (!imageUrlOrName) return;
  const filename = path.basename(imageUrlOrName);
  if (!filename || filename === '.' || filename === '..') return;

  const fullPath = path.resolve(PORTFOLIO_UPLOADS_DIR, filename);
  if (fullPath.startsWith(PORTFOLIO_UPLOADS_DIR) && fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.warn(`⚠️ [FileManager] Erreur suppression image portfolio: ${fullPath}`, err);
    }
  }
}

/**
 * Clean up orphan files in quotes and portfolio directories that are not referenced in the database
 */
export function cleanOrphanFiles(): { quotesRemoved: number; portfolioRemoved: number } {
  let quotesRemoved = 0;
  let portfolioRemoved = 0;

  try {
    // 1. Clean Quotes directory
    if (fs.existsSync(QUOTES_UPLOADS_DIR)) {
      const allQuotes = db.getAllQuotes();
      const activeQuoteFileNames = new Set<string>();

      for (const q of allQuotes) {
        if (q.files && Array.isArray(q.files)) {
          for (const f of q.files) {
            const name = path.basename(f.storedName || f.id || path.basename(f.filePath || ''));
            if (name) activeQuoteFileNames.add(name);
          }
        }
      }

      const quoteDiskFiles = fs.readdirSync(QUOTES_UPLOADS_DIR);
      for (const file of quoteDiskFiles) {
        if (!activeQuoteFileNames.has(file)) {
          const filePath = path.join(QUOTES_UPLOADS_DIR, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              fs.unlinkSync(filePath);
              quotesRemoved++;
            }
          } catch (err) {
            console.warn(`⚠️ [FileManager] Erreur nettoyage fichier orphelin devis ${file}:`, err);
          }
        }
      }
    }

    // 2. Clean Portfolio directory
    if (fs.existsSync(PORTFOLIO_UPLOADS_DIR)) {
      const allPortfolio = db.getAllPortfolio(undefined, true);
      const activePortfolioImageNames = new Set<string>();

      for (const p of allPortfolio) {
        if (p.image) {
          activePortfolioImageNames.add(path.basename(p.image));
        }
        if (p.images && Array.isArray(p.images)) {
          for (const img of p.images) {
            activePortfolioImageNames.add(path.basename(img));
          }
        }
      }

      const portfolioDiskFiles = fs.readdirSync(PORTFOLIO_UPLOADS_DIR);
      for (const file of portfolioDiskFiles) {
        if (!activePortfolioImageNames.has(file)) {
          const filePath = path.join(PORTFOLIO_UPLOADS_DIR, file);
          try {
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
              fs.unlinkSync(filePath);
              portfolioRemoved++;
            }
          } catch (err) {
            console.warn(`⚠️ [FileManager] Erreur nettoyage image orpheline portfolio ${file}:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('⚠️ [FileManager] Erreur globale cleanOrphanFiles:', err);
  }

  return { quotesRemoved, portfolioRemoved };
}
