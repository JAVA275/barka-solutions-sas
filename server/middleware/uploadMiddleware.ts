import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  QUOTES_UPLOADS_DIR,
  PORTFOLIO_UPLOADS_DIR,
  generateRandomFileName,
} from '../services/fileManager';

// =========================================================================
// 1. CONFIGURATION POUR LES DEMANDES DE DEVIS (DOCUMENTS CLIENTS PRIVÉS)
// =========================================================================
const QUOTE_ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.svg',
  '.ai',
  '.psd',
  '.eps',
  '.cdr',
  '.indd',
  '.zip',
]);

const QUOTE_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/svg+xml',
  'application/postscript',
  'image/vnd.adobe.photoshop',
  'image/x-photoshop',
  'application/x-photoshop',
  'application/photoshop',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/x-cdr',
  'application/cdr',
  'image/x-cdr',
  'application/x-indesign',
  'application/indesign',
  'application/illustrator',
  'application/octet-stream', // Utilisé pour les formats vectoriels/PAO propriétaires
]);

const quoteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(QUOTES_UPLOADS_DIR)) {
      fs.mkdirSync(QUOTES_UPLOADS_DIR, { recursive: true });
    }
    cb(null, QUOTES_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Protection Path Traversal et injection de nom
    const cleanOriginalName = path.basename(file.originalname).replace(/[\r\n\0]/g, '');
    const safeName = generateRandomFileName(cleanOriginalName, 'quote');
    cb(null, safeName);
  },
});

const quoteFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // 1. Validation de l'extension
  if (!QUOTE_ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new Error(
        `Format de fichier non autorisé (${ext}). Formats acceptés pour les devis : PDF, JPG, JPEG, PNG, SVG, AI, PSD, EPS, CDR, INDD, ZIP.`
      )
    );
  }

  // 2. Validation du type MIME
  if (file.mimetype && !QUOTE_ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error(`Type MIME non autorisé (${file.mimetype}) pour la pièce jointe.`));
  }

  cb(null, true);
};

export const quoteUpload = multer({
  storage: quoteStorage,
  fileFilter: quoteFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Limite stricte : 50 Mo par fichier
    files: 5, // Maximum 5 fichiers par devis
  },
});

// =========================================================================
// 2. CONFIGURATION POUR LES IMAGES DU PORTFOLIO (PUBLIC - IMAGES UNIQUEMENT)
// =========================================================================
const PORTFOLIO_ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const PORTFOLIO_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
]);

const portfolioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(PORTFOLIO_UPLOADS_DIR)) {
      fs.mkdirSync(PORTFOLIO_UPLOADS_DIR, { recursive: true });
    }
    cb(null, PORTFOLIO_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const cleanOriginalName = path.basename(file.originalname).replace(/[\r\n\0]/g, '');
    const safeName = generateRandomFileName(cleanOriginalName, 'portfolio');
    cb(null, safeName);
  },
});

const portfolioFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // RÈGLE CRITIQUE : Seules les images web sont acceptées. ZIP, PSD, AI, PDF sont strictement interdits.
  if (!PORTFOLIO_ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new Error(
        `Format d'image non autorisé (${ext}). Seuls les formats d'image JPG, JPEG, PNG et WEBP sont acceptés pour le portfolio.`
      )
    );
  }

  if (!file.mimetype || !PORTFOLIO_ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new Error(
        `Type MIME invalide (${file.mimetype || 'inconnu'}). Seules les images réelles (JPG, PNG, WEBP) sont autorisées.`
      )
    );
  }

  cb(null, true);
};

export const portfolioUpload = multer({
  storage: portfolioStorage,
  fileFilter: portfolioFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite : 10 Mo par image portfolio
    files: 1, // Une seule image à la fois
  },
});
