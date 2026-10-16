import type express from 'express';
import { randomUUID } from 'node:crypto';

export interface StandardErrorResponse {
  error: string;
  code: string;
  traceId: string;
  timestamp: string;
}

export const sendError = (
  res: express.Response,
  status: number,
  code: string,
  message: string,
  traceId?: string
) => {
  const payload: StandardErrorResponse = {
    error: message,
    code,
    traceId: traceId || randomUUID(),
    timestamp: new Date().toISOString(),
  };
  return res.status(status).json(payload);
};

export const errorHandler = (err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const traceId = (req as any).traceId || randomUUID();
  const statusCode = typeof err.status === 'number' ? err.status : 500;
  return sendError(res, statusCode, err.code || 'ERR_INTERNAL_ERROR', err.message || 'Internal server error occurred.', traceId);
};