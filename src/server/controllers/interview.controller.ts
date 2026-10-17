import type express from 'express';
import { sendError } from '../middleware/error-handler.js';
import { extractBalancedJson } from '../index.js';
import { queryOllama } from '../services/ollama.service.js';
import type { SantiagoService } from '../services/santiago.service.js';
import { SUPPORTED_STACKS } from './generation.controller.js';

export const createInterviewController = (santiagoService: SantiagoService) => {
  return async (req: express.Request, res: express.Response) => {
    const traceId = (req as any).traceId;
    const { message, history = [], stack = 'typescript', provider = 'solusol', model = 'llama3.2' } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return sendError(res, 400, 'ERR_PROMPT_EMPTY', 'Field "message" is required and must be a non-empty string.', traceId);
    }

    if (!SUPPORTED_STACKS.includes(stack as any)) {
      return sendError(res, 400, 'ERR_UNSUPPORTED_STACK', `Invalid stack "${stack}". Allowed stacks: ${SUPPORTED_STACKS.join(', ')}`, traceId);
    }

    const systemInstruction = `You are Santiago, a Principal Software Architect who interviews users step-by-step to scope and build their dream applications.
When a user proposes an app idea:
1. Acknowledge the idea enthusiastically with strong domain competence.
2. Ask 2-3 high-impact clarifying questions.
3. Provide structured multi-choice options for each question so the user can click them easily.
4. If the user provided enough details or says "construyela", set "isReadyToBuild": true and provide a refinedPrompt summarizing all features.
Return ONLY valid JSON matching this schema:
{
  "reply": "string (friendly Spanish conversational explanation)",
  "questions": ["string", "string"],
  "options": [{ "question": "string", "choices": ["Opción 1", "Opción 2"] }],
  "isReadyToBuild": boolean,
  "refinedPrompt": "string"
}`;

    if (provider === 'ollama') {
      try {
        const data = await queryOllama({
          model,
          system: systemInstruction,
          prompt: `User history: ${JSON.stringify(history)}\nUser input: "${message}". Target stack: "${stack}". Return ONLY valid JSON.`,
          format: 'json',
          timeoutMs: 60000,
        });
        const rawText = extractBalancedJson(data.response || '{}', '{', '}');
        return res.json(JSON.parse(rawText));
      } catch {}
    }

    if (provider === 'solusol') {
      try {
        const santiagoRes = await santiagoService.post(
          'api/interview',
          { message, history, stack, systemInstruction },
          traceId,
          20000
        );
        if (santiagoRes.ok) {
          const data = await santiagoRes.json();
          return res.json(data);
        }
      } catch {}

      // Fallback transparente a Ollama local si el upstream remoto no responde o no existe DNS
      try {
        const localData = await queryOllama({
          model,
          system: systemInstruction,
          prompt: `User history: ${JSON.stringify(history)}\nUser input: "${message}". Target stack: "${stack}". Return ONLY valid JSON.`,
          format: 'json',
          timeoutMs: 15000,
        });
        const rawText = extractBalancedJson(localData.response || '{}', '{', '}');
        return res.json(JSON.parse(rawText));
      } catch {}
    }

    // Heurística de fallback contextual
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('radio') || lowerMsg.includes('musica') || lowerMsg.includes('audio') || lowerMsg.includes('stream')) {
      return res.json({
        reply: '¡Me encanta la idea de la radio por internet! Para que la aplicación quede lista para emitir, definamos estos 3 detalles clave:',
        questions: [
          '¿Cómo transmitirás el audio?',
          '¿Qué módulos necesita la interfaz?',
          '¿Qué estilo visual prefieres?'
        ],
        options: [
          { question: 'Fuente de Audio', choices: ['Icecast / Shoutcast (Stream en Vivo)', 'Audio HLS / Stream M3U8', 'Lista de Reproducción MP3'] },
          { question: 'Módulos de la Web', choices: ['Reproductor Sticky + Ahora Sonando', 'Parrilla Semanal de Locutores', 'Chat / Mensajes de Oyentes'] },
          { question: 'Tema Visual', choices: ['Oscuro Neón (Cabina DJ)', 'Minimalista Moderno', 'Retro Vintage Radio'] }
        ],
        isReadyToBuild: false,
        refinedPrompt: `Sitio web de radio por internet en ${stack} con reproductor de audio continuo sin cortes, visualizador de ondas sonoras, metadata del tema actual (Ahora sonando), parrilla de locutores y chat en vivo.`
      });
    }

    return res.json({
      reply: `Entendido: quieres desarrollar "${message}". Para afinar la arquitectura en ${stack}, indícame tus preferencias:`,
      questions: ['¿Cuál será la fuente de datos principal?', '¿Qué componentes interactivos debe tener la pantalla?'],
      options: [{ question: 'Fuente de Datos', choices: ['API REST / JSON', 'WebSockets en Vivo', 'Archivos Locales'] }],
      isReadyToBuild: false,
      refinedPrompt: `Aplicación en ${stack} para: ${message} con arquitectura modular y componentes desacoplados.`
    });
  };
};