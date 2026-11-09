import { Request, Response, NextFunction } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF Protection Middleware
 * Defends cookie-authenticated mutating requests against Cross-Site Request Forgery.
 * Applies defense-in-depth:
 * 1. Checks Same-Site / Sec-Fetch-Site headers where available.
 * 2. Requires custom header (e.g. X-Requested-With: XMLHttpRequest or X-CSRF-Token) for cookie sessions.
 * 3. Does not block API clients using Authorization Bearer tokens.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe methods (GET, HEAD, OPTIONS) do not alter server state
  if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  // Check if request is authenticated via cookie
  const cookieToken =
    (req as any).cookies?.barka_auth_token ||
    (req.headers.cookie && req.headers.cookie.includes('barka_auth_token='));

  // If request does NOT use cookie auth (e.g. public quote, or Bearer auth), standard CSRF risks do not apply
  if (!cookieToken) {
    return next();
  }

  // If authenticated via Bearer token in Authorization header, allow (API clients)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  // For cookie-authenticated requests, verify CSRF indicators:
  // 1. Sec-Fetch-Site: 'same-origin' or 'same-site'
  const secFetchSite = req.headers['sec-fetch-site'];
  if (secFetchSite === 'cross-site') {
    res.status(403).json({
      success: false,
      error: 'Requête cross-origin rejetée par la protection CSRF.',
      code: 'CSRF_BLOCKED_CROSS_SITE',
    });
    return;
  }

  // 2. Custom header check (Browsers forbid cross-origin requests from setting custom headers without CORS preflight)
  const xRequestedWith = req.headers['x-requested-with'];
  const csrfHeader = req.headers['x-csrf-token'];

  if (xRequestedWith === 'XMLHttpRequest' || csrfHeader) {
    return next();
  }

  // 3. Fallback: Check Origin or Referer matches Host
  const origin = req.headers.origin || req.headers.referer;
  const host = req.headers.host;

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return next();
      }
    } catch {
      // invalid URL in header
    }
  }

  // In development mode, allow if no origin header was sent (e.g. postman/curl)
  if (process.env.NODE_ENV !== 'production' && !origin) {
    return next();
  }

  res.status(403).json({
    success: false,
    error: 'Échec de la validation CSRF. En-tête de protection manquant.',
    code: 'CSRF_VALIDATION_FAILED',
  });
}
