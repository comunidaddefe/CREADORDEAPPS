export interface OllamaGenerateOptions {
  model: string;
  system: string;
  prompt: string;
  format?: 'json';
  timeoutMs?: number;
}

export async function queryOllama(options: OllamaGenerateOptions) {
  const { model, system, prompt, format, timeoutMs = 60000 } = options;

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      system,
      prompt,
      stream: false,
      ...(format ? { format } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }

  return response.json();
}