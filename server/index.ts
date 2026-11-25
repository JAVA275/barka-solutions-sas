import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { app } from './app';
import { getJwtSecret } from './services/auth';

// Validate JWT Secret & security requirements at startup
// In production, this will abort startup if JWT_SECRET is absent or insecure
try {
  getJwtSecret();
} catch (err: any) {
  console.error('❌ [CRITICAL SECURITY STARTUP ERROR]', err.message);
  process.exit(1);
}

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

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

  // Vite middleware for Development / Static serving for Production
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    !fs.existsSync(path.resolve(process.cwd(), 'index.html'));

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
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
    } catch {
      console.warn('⚠️ [Vite] Vite non installé ou indisponible, passage automatique en mode production.');
    }
  } else {
    const candidateDistPaths = [
      __dirname,
      path.join(__dirname, '..', 'dist'),
      path.join(process.cwd(), 'dist'),
      path.join(process.cwd(), 'public_html'),
      process.cwd(),
    ];
    const distPath =
      candidateDistPaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) ||
      path.join(process.cwd(), 'dist');

    console.log(`📦 [Frontend SPA] Distribution statique servie depuis : ${distPath}`);

    // Serve static frontend assets (CSS, JS, images, logos)
    app.use(express.static(distPath));

    // Serve uploads if present
    const uploadsPath = path.resolve(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsPath)) {
      app.use('/uploads', express.static(uploadsPath));
    }

    // SPA Fallback: any client route serves index.html
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application BARKA SOLUTIONS S.A.S en cours d’initialisation (index.html introuvable).');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur Backend BARKA SOLUTIONS S.A.S démarré sur http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erreur critique au lancement du backend Express:', err);
  process.exit(1);
});
