/**
 * Mathematical / Balance-based delimiter parser for LLM responses.
 * Extracts balanced JSON structures ({...} or [...]) while respecting quotes and escapes.
 */
export function extractBalancedJson(text: string, openChar: string = '{', closeChar: string = '}'): string {
  const startIndex = text.indexOf(openChar);
  if (startIndex === -1) {
    throw new SyntaxError(`No opening delimiter '${openChar}' found in input.`);
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let endIndex = -1;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }
  }

  if (depth > 0 || endIndex === -1) {
    throw new SyntaxError(`'${openChar}' was never closed`);
  }

  return text.slice(startIndex, endIndex + 1);
}

/**
 * Extracts clean source code from markdown fences.
 */
export function extractCode(content: string): string {
  if (!content || typeof content !== 'string') return '';
  const match = content.match(/```(?:[a-zA-Z0-9_\-+]+)?\r?\n([\s\S]*?)```/);
  if (match && typeof match[1] === 'string') {
    return match[1].trim();
  }
  return content.trim();
}