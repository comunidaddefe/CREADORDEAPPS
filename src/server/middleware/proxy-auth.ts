import type express from 'express';
import { sendError } from './error-handler.js';

export const createRequireProxyAuth = (internalSecret: string, trustedBrowserOrigins: ReadonlySet<string> = new Set()) => {
  const trustedHosts = new Set(
    [...trustedBrowserOrigins].map((origin) => {
      try {
        return new URL(origin).host.toLowerCase();
      } catch {
        return '';
      }
    }).filter(Boolean)
  );

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const traceId = (req as any).traceId;
    const providedAuth = req.header('X-App-Internal-Key') || req.header('Authorization')?.replace(/^Bearer\s+/i, '');
    const origin = req.header('Origin');
    const fetchSite = req.header('Sec-Fetch-Site');
    const host = req.header('Host')?.toLowerCase() || '';

    if (internalSecret && providedAuth === internalSecret) {
      return next();
    }

    const trustedOrigin = Boolean(origin && trustedBrowserOrigins.has(origin));
    const trustedSameOrigin = trustedHosts.has(host)
      && (!origin || trustedOrigin)
      && (!fetchSite || fetchSite === 'same-origin');
    if (trustedSameOrigin && (trustedOrigin || fetchSite === 'same-origin')) return next();

    return sendError(res, 403, 'ERR_UNAUTHORIZED_PROXY_ACCESS', 'Acceso no autorizado al servicio proxy. Requiere una sesión de origen confiable.', traceId);
  };
};