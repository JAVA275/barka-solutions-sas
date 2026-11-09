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

// 5. Mount API Sub-routers
app.use('/api/auth', authRouter);
app.use('/api/health', healthRouter);
app.use('/api/company', companyRouter);
app.use('/api/stats', statsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/contact', contactRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/services', servicesRouter);
app.use('/api/prices', pricesRouter);
app.use('/api/audit', auditRouter);

// 6. 404 handler for unmatched /api routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Endpoint API introuvable : ${req.method} ${req.originalUrl}`,
  });
});

// 7. Global Error Handler
app.use(globalErrorHandler);

export default app;
