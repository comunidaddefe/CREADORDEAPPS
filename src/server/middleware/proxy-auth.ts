import type express from 'express';
import { sendError } from './error-handler.js';

export const createRequireProxyAuth = (internalSecret: string) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const traceId = (req as any).traceId;
    const providedAuth = req.header('X-App-Internal-Key') || req.header('Authorization')?.replace(/^Bearer\s+/i, '');

    if (!internalSecret || !providedAuth || providedAuth !== internalSecret) {
      return sendError(res, 403, 'ERR_UNAUTHORIZED_PROXY_ACCESS', 'Acceso no autorizado al servicio proxy. Requiere clave de sesion valida.', traceId);
    }
    next();
  };
};