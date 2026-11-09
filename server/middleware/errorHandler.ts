import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'crypto';

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    success: false,
    error: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
}

export function globalErrorHandler(
  err: ApiError | multer.MulterError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const traceId = (req as any).traceId || crypto.randomUUID();

  // Handle Multer errors specifically with 400 Bad Request
  if (err instanceof multer.MulterError) {
    let message = 'Erreur lors du téléversement du fichier.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Le fichier dépasse la taille maximale autorisée (50 Mo pour devis, 10 Mo pour portfolio).';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Nombre maximum de fichiers autorisés dépassé (maximum 5 fichiers).';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Champ de fichier inattendu : "${err.field}".`;
    }
    res.status(400).json({
      success: false,
      error: message,
      code: err.code,
    });
    return;
  }

  // Handle custom filter errors (e.g. invalid extension or MIME type)
  if (err.message && (err.message.includes('Format de fichier non autorisé') || err.message.includes('Type MIME non autorisé') || err.message.includes('Seules les images'))) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
    return;
  }

  const statusCode = (err as ApiError).statusCode && (err as ApiError).statusCode! >= 400 && (err as ApiError).statusCode! < 600
    ? (err as ApiError).statusCode!
    : 500;

  // Log full error details securely on the server with traceId
  console.error(`[API ERROR] [traceId=${traceId}] ${req.method} ${req.originalUrl} - Status: ${statusCode}`);
  console.error(err.stack || err);

  // Return simple, safe error message to the client without leaking internals
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
  const clientMessage =
    statusCode === 500
      ? 'Une erreur interne est survenue. Veuillez réessayer ultérieurement.'
      : err.message || 'Requête invalide.';

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    traceId: statusCode === 500 ? traceId : undefined,
  });
}
