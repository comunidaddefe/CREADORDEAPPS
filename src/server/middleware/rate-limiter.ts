import type express from 'express';
import { sendError } from './error-handler.js';

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 60;

const rateLimitSweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);
if (rateLimitSweeper.unref) rateLimitSweeper.unref();

export const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const traceId = (req as any).traceId;
  const clientKey = req.ip || '127.0.0.1';
  const now = Date.now();
  const record = requestCounts.get(clientKey);

  if (!record || now > record.resetTime) {
    requestCounts.set(clientKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  } else {
    record.count++;
    if (record.count > MAX_REQUESTS_PER_WINDOW) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      return sendError(res, 429, 'ERR_RATE_LIMIT_EXCEEDED', 'Demasiadas solicitudes. Espere antes de reintentar.', traceId);
    }
  }
  next();
};