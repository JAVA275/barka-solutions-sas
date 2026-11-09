import { Request, Response, NextFunction } from 'express';

/**
 * Enterprise-grade Security Headers Middleware
 * Provides Helmet-equivalent protection tailored for Vercel and Express.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 1. Remove identifying server headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // 2. Clickjacking protection
  res.setHeader('X-Frame-Options', 'DENY');

  // 3. MIME-sniffing protection
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 4. Strict Transport Security (HSTS) - Enabled for HTTPS production
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // 5. Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 6. Modern XSS Protection (Disables buggy browser-specific auditors in favor of CSP)
  res.setHeader('X-XSS-Protection', '0');

  // 7. Permissions Policy (Restrict unneeded browser APIs)
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=(), accelerometer=()'
  );

  // 8. Content Security Policy (CSP) tailored for React, Tailwind, and Google Fonts
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https: ws: wss:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // 9. Cross-Origin policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

  next();
}
