import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { securityHeadersMiddleware } from './middleware/securityHeaders';
import { csrfProtection } from './middleware/csrfProtection';
import { globalErrorHandler } from './middleware/errorHandler';
import { PORTFOLIO_UPLOADS_DIR, initUploadDirectories } from './services/fileManager';

// Sub-routers
import { authRouter } from './routes/auth';
import { healthRouter, companyRouter } from './routes/company';
import { statsRouter } from './routes/stats';
import { quotesRouter } from './routes/quotes';
import { contactRouter } from './routes/contact';
import { portfolioRouter } from './routes/portfolio';
import { servicesRouter } from './routes/services';
import { pricesRouter } from './routes/prices';
import { auditRouter } from './routes/audit';

// Ensure upload directories exist
initUploadDirectories();

export const app = express();

// Configure Trust Proxy (Essential for Vercel and reverse proxies)
app.set('trust proxy', 1);

// 1. HTTP Security Headers
app.use(securityHeadersMiddleware);

// 2. Body and Cookie Parsers (Up to 50MB for high-res portfolio images / base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// 3. CSRF Protection for Cookie-Authenticated Requests
app.use(csrfProtection);

// 4. Static and Protected Upload Endpoints
// Private quote documents are NEVER served directly
app.use('/uploads/portfolio', express.static(PORTFOLIO_UPLOADS_DIR));
app.use('/uploads/quotes', (_req: Request, res: Response) => {
  res.status(403).json({
    success: false,
    error: 'Accès interdit. Les fichiers de devis sont strictement confidentiels.',
  });
});

// 5. Mount API Sub-routers (Supporting both /api/path and /path for Vercel Serverless Rewrites)
app.use(['/api/auth', '/auth'], authRouter);
app.use(['/api/health', '/health'], healthRouter);
app.use(['/api/company', '/company'], companyRouter);
app.use(['/api/stats', '/stats'], statsRouter);
app.use(['/api/quotes', '/quotes'], quotesRouter);
app.use(['/api/contact', '/contact'], contactRouter);
app.use(['/api/portfolio', '/portfolio'], portfolioRouter);
app.use(['/api/services', '/services'], servicesRouter);
app.use(['/api/prices', '/prices'], pricesRouter);
app.use(['/api/audit', '/audit'], auditRouter);

// 6. 404 handler STRICTLY for unmatched API routes (NEVER intercepts frontend /)
app.use(['/api', '/api/*'], (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint API introuvable : ${req.method} ${req.originalUrl || req.url}`,
  });
});

// 7. Static Frontend & SPA Fallback (for production / Hostinger / standalone mode)
const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const candidateDistPaths = [
  path.join(currentDir, '..', 'dist'),
  path.join(currentDir, 'dist'),
  path.join(process.cwd(), 'dist'),
  path.join(process.cwd(), 'public_html'),
  path.join(process.cwd(), 'public_html', 'dist'),
  process.cwd(),
];

const foundDistPath = candidateDistPaths.find((p) => {
  try {
    return fs.existsSync(path.join(p, 'index.html'));
  } catch {
    return false;
  }
});

if (foundDistPath) {
  // Serve static assets from dist (JS, CSS, logos, favicon, robots.txt, sitemap.xml)
  app.use(express.static(foundDistPath));

  // Serve static uploads
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }

  // SPA fallback: any client-side route serves index.html
  app.get('*', (req: Request, res: Response, next) => {
    if (req.originalUrl?.startsWith('/api') || req.url?.startsWith('/api')) {
      return next();
    }
    const indexPath = path.join(foundDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// 8. Global Error Handler
app.use(globalErrorHandler);

export default app;
