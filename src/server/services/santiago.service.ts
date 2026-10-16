export interface SantiagoClientOptions {
  baseUrl: string;
  apiKey?: string;
}

export class SantiagoService {
  constructor(private options: SantiagoClientOptions) {}

  get baseUrl() {
    return this.options.baseUrl.replace(/\/+$/, '');
  }

  get isConfigured() {
    return Boolean(this.options.baseUrl);
  }

  async post(path: string, body: any, traceId: string, timeoutMs: number = 20000) {
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