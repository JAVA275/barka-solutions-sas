import express, { Request, Response } from 'express';
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

// Normalize URL for Vercel Serverless Function rewrites:
// Under Vercel rewrites, req.url may be set to /api/index.js or /api while req.originalUrl retains /api/portfolio
app.use((req: Request, _res: Response, next) => {
  if (req.originalUrl && (req.url === '/api/index.js' || req.url === '/api' || !req.url.startsWith('/api'))) {
    req.url = req.originalUrl;
  }
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// 1. HTTP Security Headers
app.use(securityHeadersMiddleware);

// 2. Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

// 6. 404 handler for unmatched API routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint API introuvable : ${req.method} ${req.originalUrl || req.url}`,
  });
});

// 7. Global Error Handler
app.use(globalErrorHandler);

export default app;
