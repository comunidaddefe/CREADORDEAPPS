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

    // SoluSol protege el endpoint administrativo y requiere un token configurado en el servidor.
    if (source.startsWith('solusol.') || source.startsWith('solusol/')) {
      const subPath = source.replace(/^solusol[./]/, '');
      const errorMetric = (description: string) => res.json({
        origin: 'api.solusol.net',
        status: 'ERROR',
        unit: 'none',
        updatedAt,
        description,
      });

      if (!solusolApiKey) {
        return errorMetric('Falta configurar SOLUSOL_API_KEY para consultar la telemetría protegida.');
      }

      try {
        const telemetryUrl = new URL('/api/v1/admin/telemetry', `${solusolBaseUrl.replace(/\/+$/, '')}/`);
        telemetryUrl.searchParams.set('source', subPath);
        telemetryUrl.searchParams.set('type', type);
        const solusolRes = await fetch(telemetryUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
          headers: {
            Accept: 'application/json',
            'X-Trace-Id': traceId,
            Authorization: `Bearer ${solusolApiKey}`,
          },
        });

        if (!solusolRes.ok) {
          return errorMetric(`SoluSol respondió HTTP ${solusolRes.status}. Comprueba la clave y el acceso a telemetría.`);
        }

        const responsePayload: unknown = await solusolRes.json();
        const envelope = responsePayload && typeof responsePayload === 'object'
          ? responsePayload as Record<string, unknown>
          : null;
        const metricPayload = envelope?.data && typeof envelope.data === 'object'
          ? envelope.data as Record<string, unknown>
          : envelope;
        const hasMetricData = metricPayload && ['value', 'series', 'points', 'rows', 'items']
          .some((field) => field in metricPayload);

        if (!metricPayload || !hasMetricData) {
          return errorMetric('La API respondió, pero el formato no contiene una métrica compatible con este widget.');
        }

        return res.json({
          ...metricPayload,
          origin: 'api.solusol.net',
          status: 'LIVE',
          updatedAt: typeof metricPayload.updatedAt === 'string' ? metricPayload.updatedAt : updatedAt,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Timeout';
        return errorMetric(`No se pudo consultar api.solusol.net: ${message}`);
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