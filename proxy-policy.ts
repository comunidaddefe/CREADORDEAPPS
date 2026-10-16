/**
 * Proxy Security Policy (Zero Trust Whitelist)
 * Restricts upstream forwarding to approved endpoints and HTTP methods.
 */
export const ALLOWED_SOLUSOL_ROUTES: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['telemetry', new Set(['GET'])],
  ['api/generate-project', new Set(['POST'])],
  ['api/generate-dashboard', new Set(['POST'])],
  ['api/export-code', new Set(['POST'])],
]);

export const ALLOWED_AGENT_ROUTES: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['api/interview', new Set(['POST'])],
  ['api/generate-project', new Set(['POST'])],
]);