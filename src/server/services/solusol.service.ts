export interface SoluSolClientOptions {
  baseUrl: string;
  apiKey?: string;
}

export class SoluSolService {
  constructor(private options: SoluSolClientOptions) {}

  get baseUrl() {
    return this.options.baseUrl.replace(/\/+$/, '');
  }

  async post(path: string, body: any, traceId: string, timeoutMs: number = 30000) {
    const targetUrl = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    return fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Trace-Id': traceId,
        ...(this.options.apiKey ? { Authorization: `Bearer ${this.options.apiKey}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  }
}