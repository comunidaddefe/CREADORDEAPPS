import type express from 'express';
import { sendError } from './error-handler.js';

const MAX_CONCURRENT_HEAVY_TASKS = 3;
let activeHeavyTasks = 0;

export const concurrencyGuard = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const traceId = (req as any).traceId;
  if (activeHeavyTasks >= MAX_CONCURRENT_HEAVY_TASKS) {
    return sendError(res, 503, 'ERR_CONCURRENCY_LIMIT', 'Motor ocupado procesando solicitudes simultaneas de alta demanda. Reintente en un momento.', traceId);
  }
  activeHeavyTasks++;
  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      activeHeavyTasks = Math.max(0, activeHeavyTasks - 1);
    }
  };
  res.once('finish', release);
  res.once('close', release);
  next();
};