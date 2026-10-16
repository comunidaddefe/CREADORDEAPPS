import { useState, useEffect } from 'react';
import type { DashboardWidget, MetricResponse } from '../types/dashboard';

export function useTelemetryPolling(dashboard: DashboardWidget[]) {
  const [liveMetrics, setLiveMetrics] = useState<Record<string, MetricResponse | null>>({});
  const [loadingMetrics, setLoadingMetrics] = useState<Record<string, boolean>>({});

  const sourcesSignature = dashboard
    .map((c) => `${c.id}:${c.type}:${c.props.data_source}`)
    .join('|');

  useEffect(() => {
    let isSubscribed = true;
    let timerId: ReturnType<typeof setTimeout>;
    let consecutiveFailures = 0;
    const BASE_INTERVAL = 3000;
    const MAX_INTERVAL = 30000;

    const pollLiveTelemetry = async () => {
      if (!isSubscribed || dashboard.length === 0) return;

      const activeLoadState: Record<string, boolean> = {};
      dashboard.forEach((comp) => {
        if (!liveMetrics[comp.id]) activeLoadState[comp.id] = true;
      });
      if (Object.keys(activeLoadState).length > 0) {
        setLoadingMetrics((prev) => ({ ...prev, ...activeLoadState }));
      }

      let hadError = false;
      try {
        const updates = await Promise.all(
          dashboard.map(async (comp) => {
            try {
              const res = await fetch(
                `/api/data?source=${encodeURIComponent(comp.props.data_source)}&type=${encodeURIComponent(comp.type)}`
              );
              if (!res.ok) {
                hadError = true;
                return [comp.id, null] as const;
              }
              const data: MetricResponse = await res.json();
              return [comp.id, data] as const;
            } catch {
              hadError = true;
              return [comp.id, null] as const;
            }
          })
        );
        if (isSubscribed) {
          setLiveMetrics(Object.fromEntries(updates));
          setLoadingMetrics({});
        }
      } catch {
        hadError = true;
        if (isSubscribed) setLoadingMetrics({});
      }

      if (isSubscribed) {
        consecutiveFailures = hadError ? consecutiveFailures + 1 : 0;
        const nextDelay = hadError
          ? Math.min(MAX_INTERVAL, Math.round(BASE_INTERVAL * Math.pow(1.5, consecutiveFailures)))
          : BASE_INTERVAL;
        timerId = setTimeout(pollLiveTelemetry, nextDelay);
      }
    };

    pollLiveTelemetry();
    return () => {
      isSubscribed = false;
      clearTimeout(timerId);
    };
  }, [sourcesSignature]);

  return {
    liveMetrics,
    loadingMetrics,
  };
}