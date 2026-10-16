import type express from 'express';
import { randomUUID } from 'node:crypto';

export const traceContext = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const incomingTraceId = req.header('X-Trace-Id');
  const traceId = typeof incomingTraceId === 'string' && incomingTraceId.trim() ? incomingTraceId.trim() : randomUUID();
  (req as any).traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);
  next();
};