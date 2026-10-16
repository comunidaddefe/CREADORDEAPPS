import type express from 'express';
import { sendError } from '../middleware/error-handler.js';

export const createTelemetryController = (solusolBaseUrl: string, solusolApiKey?: string) => {
  return async (req: express.Request, res: express.Response) => {
    const traceId = (req as any).traceId;
    const rawSource = req.query.source;
    const rawType = req.query.type;

    if (!rawSource || !rawType || typeof rawSource !== 'string' || typeof rawType !== 'string') {
      return sendError(
        res,
        400,
        'ERR_INVALID_QUERY_PARAMS',
        'Query parameters "source" and "type" must be non-empty strings.',
        traceId
      );
    }

    const source = rawSource.trim();
    const type = rawType.trim();
    const updatedAt = new Date().toISOString();
    const uptime = process.uptime();
    const mem = process.memoryUsage();

    // Integración Upstream con SoluSol Cloud
    if (source.startsWith('solusol.') || source.startsWith('solusol/')) {
      const subPath = source.replace(/^solusol[./]/, '');
      try {
        const solusolRes = await fetch(
          `${solusolBaseUrl}/telemetry?source=${encodeURIComponent(subPath)}&type=${encodeURIComponent(type)}`,
          {
            signal: AbortSignal.timeout(5000),
            headers: {
              Accept: 'application/json',
              'X-Trace-Id': traceId,
              ...(solusolApiKey ? { Authorization: `Bearer ${solusolApiKey}` } : {}),
            },
          }
        );

        if (solusolRes.ok) {
          const payload = await solusolRes.json();
          return res.json({
            origin: 'solusol.cloud',
            status: 'LIVE',
            updatedAt,
            ...payload,
          });
        }
      } catch (err: any) {
        return res.json({
          origin: 'solusol.cloud',
          status: 'ERROR',
          unit: 'none',
          updatedAt,
          description: `Error connecting to upstream api.solusol.net: ${err.message || 'Timeout'}`,
        });
      }
    }

    // Telemetría Node.js
    if (source.startsWith('system.') || source.startsWith('runtime.') || source.startsWith('process.')) {
      if (type === 'stat') {
        const isUptime = source.includes('uptime');
        return res.json({
          origin: 'system.node_runtime',
          status: 'LIVE',
          unit: isUptime ? 'seconds' : 'MB',
          value: isUptime ? `${Math.floor(uptime)}s` : `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          updatedAt,
          description: isUptime ? 'Node.js process uptime' : 'V8 heap memory usage',
        });
      }

      if (type === 'table') {
        return res.json({
          origin: 'system.node_runtime',
          status: 'LIVE',
          unit: 'process_attributes',
          rows: [
            { key: 'Node Version', value: process.version },
            { key: 'Process Architecture', value: process.arch },
            { key: 'Platform OS', value: process.platform },
            { key: 'PID', value: String(process.pid) },
            { key: 'V8 Heap Total', value: `${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB` },
            { key: 'Process Uptime', value: `${Math.floor(uptime)}s` },
          ],
          updatedAt,
          description: 'Authentic Node.js process runtime properties',
        });
      }
    }

    // Fallback declarativo DEMO / NO_DATA
    if (type === 'stat') {
      return res.json({
        origin: 'demo.mock_provider',
        status: 'DEMO',
        unit: 'USD',
        value: '$0.00',
        updatedAt,
        description: `No active collector connected for source: "${source}".`,
      });
    }

    return res.json({
      origin: 'demo.mock_provider',
      status: 'NO_DATA',
      unit: 'datapoints',
      updatedAt,
      description: `Metric connector inactive for source: "${source}".`,
    });
  };
};