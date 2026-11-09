import fs from 'fs';
import path from 'path';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
}

/**
 * Reads the first bytes of a file safely without loading the whole file into memory.
 */
function readHeaderBytes(filePath: string, length = 512): Buffer {
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(length);
  try {
    fs.readSync(fd, buffer, 0, length, 0);
  } finally {
    fs.closeSync(fd);
  }
  return buffer;
}

/**
 * Sanitize and validate SVG content against XSS and XXE attacks.
 */
function validateSvgContent(filePath: string): FileValidationResult {
  try {
    const stats = fs.statSync(filePath);
    if (stats.size > 5 * 1024 * 1024) {
      return { valid: false, error: 'Fichier SVG trop volumineux (max 5 Mo).' };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lower = content.toLowerCase();

    // 1. Must contain an svg opening tag
    if (!lower.includes('<svg')) {
      return { valid: false, error: 'Fichier SVG invalide : balise <svg> manquante.' };
    }

    // 2. Reject XXE entity injections
    if (lower.includes('<!doctype') && (lower.includes('<!entity') || lower.includes('system') || lower.includes('public'))) {
      return { valid: false, error: 'Fichier SVG rejeté : déclarations d’entités externes (XXE) interdites.' };
    }

    // 3. Reject active script elements and embedded HTML
    const forbiddenPatterns = [
      /<script[\s>]/i,
      /<\/script>/i,
      /<foreignobject[\s>]/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /on\w+\s*=/i, // onload=, onerror=, onclick=, etc.
      /<iframe[\s>]/i,
      /<embed[\s>]/i,
      /<object[\s>]/i,
      /xlink:href=["']javascript:/i,
      /href=["']javascript:/i,
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        return {
          valid: false,
          error: 'Fichier SVG rejeté : contient du code exécutable ou des scripts non sécurisés.',
        };
      }
    }

    return { valid: true, detectedType: 'image/svg+xml' };
  } catch (err: any) {
    return { valid: false, error: `Erreur lors de l’analyse du fichier SVG: ${err.message}` };
  }
}

/**
 * Validates magic binary numbers of an uploaded file against its extension.
 */
export function validateUploadedFile(
  filePath: string,
  originalName: string,
  category: 'quote' | 'portfolio' = 'quote'
): FileValidationResult {
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: 'Fichier introuvable sur le disque.' };
  }

  const ext = path.extname(originalName).toLowerCase();
  const header = readHeaderBytes(filePath, 64);

  // 1. Portfolio strictly requires web images
  if (category === 'portfolio') {
    if (ext === '.png') {
      const isPng =
        header[0] === 0x89 &&
        header[1] === 0x50 &&
        header[2] === 0x4e &&
        header[3] === 0x47 &&
        header[4] === 0x0d &&
        header[5] === 0x0a &&
        header[6] === 0x1a &&
        header[7] === 0x0a;
      if (!isPng) {
        return { valid: false, error: 'Signature binaire PNG invalide.' };
      }
      return { valid: true, detectedType: 'image/png' };
    }

    if (ext === '.jpg' || ext === '.jpeg') {
      const isJpg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
      if (!isJpg) {
        return { valid: false, error: 'Signature binaire JPEG invalide.' };
      }
      return { valid: true, detectedType: 'image/jpeg' };
    }

    if (ext === '.webp') {
      const isRiff = header.toString('ascii', 0, 4) === 'RIFF';
      const isWebp = header.toString('ascii', 8, 12) === 'WEBP';
      if (!isRiff || !isWebp) {
        return { valid: false, error: 'Signature binaire WEBP invalide.' };
      }
      return { valid: true, detectedType: 'image/webp' };
    }

    return {
      valid: false,
      error: `Format de portfolio non autorisé (${ext}). Seuls PNG, JPG et WEBP sont acceptés.`,
    };
  }

  // 2. Quote files (Client files: PDF, images, design files, ZIP)
  if (ext === '.png') {
    const isPng =
      header[0] === 0x89 &&
      header[1] === 0x50 &&
      header[2] === 0x4e &&
      header[3] === 0x47 &&
      header[4] === 0x0d &&
      header[5] === 0x0a &&
      header[6] === 0x1a &&
      header[7] === 0x0a;
    if (!isPng) return { valid: false, error: 'Signature binaire PNG invalide.' };
    return { valid: true, detectedType: 'image/png' };
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    const isJpg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    if (!isJpg) return { valid: false, error: 'Signature binaire JPEG invalide.' };
    return { valid: true, detectedType: 'image/jpeg' };
  }

  if (ext === '.pdf') {
    // PDF starts with %PDF- (0x25 0x50 0x44 0x46 0x2D)
    const isPdf = header.toString('ascii', 0, 5) === '%PDF-';
    if (!isPdf) return { valid: false, error: 'Signature binaire PDF invalide (%PDF- manquant).' };
    return { valid: true, detectedType: 'application/pdf' };
  }

  if (ext === '.svg') {
    return validateSvgContent(filePath);
  }

  if (ext === '.psd') {
    // Photoshop starts with 8BPS (0x38 0x42 0x50 0x53)
    const isPsd = header.toString('ascii', 0, 4) === '8BPS';
    if (!isPsd) return { valid: false, error: 'Signature binaire Photoshop PSD invalide (8BPS manquant).' };
    return { valid: true, detectedType: 'image/vnd.adobe.photoshop' };
  }

  if (ext === '.eps') {
    const isPostscript = header.toString('ascii', 0, 4) === '%!PS';
    const isDosEps =
      header[0] === 0xc5 && header[1] === 0xd0 && header[2] === 0xd3 && header[3] === 0xc6;
    if (!isPostscript && !isDosEps) {
      return { valid: false, error: 'Signature binaire EPS invalide.' };
    }
    return { valid: true, detectedType: 'application/postscript' };
  }

  if (ext === '.zip') {
    // ZIP header starts with PK\x03\x04 or PK\x05\x06 or PK\x07\x08
    const isZip =
      header[0] === 0x50 &&
      header[1] === 0x4b &&
      (header[2] === 0x03 || header[2] === 0x05 || header[2] === 0x07);
    if (!isZip) return { valid: false, error: 'Signature binaire ZIP invalide.' };
    return { valid: true, detectedType: 'application/zip' };
  }

  if (ext === '.ai') {
    // Modern Adobe Illustrator files are either PDF-compatible (%PDF-) or EPS (%!PS)
    const isPdf = header.toString('ascii', 0, 5) === '%PDF-';
    const isPs = header.toString('ascii', 0, 4) === '%!PS';
    if (!isPdf && !isPs) {
      return { valid: false, error: 'Signature de fichier Adobe Illustrator (.ai) invalide.' };
    }
    return { valid: true, detectedType: 'application/illustrator' };
  }

  if (ext === '.cdr') {
    // CorelDRAW is either a ZIP container or RIFF container
    const isZip = header[0] === 0x50 && header[1] === 0x4b;
    const isRiff = header.toString('ascii', 0, 4) === 'RIFF';
    if (!isZip && !isRiff) {
      return { valid: false, error: 'Signature de fichier CorelDRAW (.cdr) invalide.' };
    }
    return { valid: true, detectedType: 'application/cdr' };
  }

  if (ext === '.indd') {
    // Adobe InDesign starts with GUID or signature \x06\x06\xED\xF5...
    const isIndd =
      (header[0] === 0x06 && header[1] === 0x06 && header[2] === 0xed && header[3] === 0xf5) ||
      header[0] === 0x50 && header[1] === 0x4b;
    if (!isIndd) {
      return { valid: false, error: 'Signature de fichier Adobe InDesign (.indd) invalide.' };
    }
    return { valid: true, detectedType: 'application/x-indesign' };
  }

  return { valid: false, error: `Type de fichier non autorisé : ${ext}` };
}
