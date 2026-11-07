import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import { getJwtSecret } from './services/auth';
import { authRouter } from './routes/auth';
import { quotesRouter } from './routes/quotes';
import { contactRouter } from './routes/contact';
import { companyRouter, healthRouter } from './routes/company';
import { statsRouter } from './routes/stats';
import { portfolioRouter } from './routes/portfolio';
import { servicesRouter } from './routes/services';
import { pricesRouter } from './routes/prices';
import { auditRouter } from './routes/audit';
import { globalErrorHandler } from './middleware/errorHandler';
import { PORTFOLIO_UPLOADS_DIR, initUploadDirectories } from './services/fileManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize secure upload directories
initUploadDirectories();

// Validate JWT Secret & security requirements at startup
// In production, this will abort startup if JWT_SECRET is absent or insecure
try {
  getJwtSecret();
} catch (err: any) {
  console.error('❌ [CRITICAL SECURITY STARTUP ERROR]', err.message);
  process.exit(1);
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Global Middlewares
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // SÉCURITÉ : Les fichiers clients (devis) sont PRIVÉS et accessibles uniquement via /api/quotes/:quoteId/files/:fileId
  // Seules les images publiques du portfolio sont exposées de manière statique sous /uploads/portfolio
  app.use('/uploads/portfolio', express.static(PORTFOLIO_UPLOADS_DIR));

  // Blocage explicite de tout accès public direct au dossier racine /uploads ou /uploads/quotes
  app.use('/uploads/quotes', (_req: Request, res: Response) => {
    res.status(403).json({
      success: false,
      error: 'Accès interdit. Les fichiers de devis sont strictement confidentiels.',
    });
  });

  // API Request Logger
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`[API ${req.method}] ${req.path}`);
    }
    next();
  });

  // Mount API Sub-routers
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

  // SEO Endpoints: robots.txt and sitemap.xml
  app.get('/robots.txt', (_req: Request, res: Response) => {
    const robotsPath = path.resolve(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.type('text/plain').sendFile(robotsPath);
    } else {
      res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: https://barkasolutions.org/sitemap.xml');
    }
  });

  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    const sitemapPath = path.resolve(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.type('application/xml').sendFile(sitemapPath);
    } else {
      res.status(404).send('Sitemap not found');
    }
  });

  // API 404 handler (for unmatched /api calls only)
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint API introuvable : ${req.method} ${req.originalUrl}`,
    });
  });

  // Vite middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Development SPA Fallback with Vite transformIndexHtml for all client routes
    app.use('*', async (req: Request, res: Response, next) => {
      // Skip if URL is an API or upload route
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler for unhandled errors (placed at the very end of middleware stack)
  app.use(globalErrorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur Backend BARKA SOLUTIONS S.A.S démarré sur http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erreur critique au lancement du backend Express:', err);
  process.exit(1);
});
