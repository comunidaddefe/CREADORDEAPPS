export interface ProjectFileEntry {
  path: string;
  content: string;
}

export interface ProjectValidationResult {
  valid: boolean;
  error?: string;
}

const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i;
const FORBIDDEN_CHARS = /[<>:"|?*\x00-\x1F]/;
const MAX_FILE_SIZE_BYTES = 1024 * 1024;

export function validateProjectFiles(files: unknown): ProjectValidationResult {
  if (!Array.isArray(files) || files.length === 0) {
    return { valid: false, error: 'Project must contain a non-empty array of files.' };
  }

  for (let i = 0; i < files.length; i++) {
    const file: unknown = files[i];
    if (!file || typeof file !== 'object' || !('path' in file) || !('content' in file)
      || typeof file.path !== 'string' || typeof file.content !== 'string') {
      return { valid: false, error: `File at index ${i} must have string properties 'path' and 'content'.` };
    }

    const trimmedPath = file.path.trim();
    if (!trimmedPath) {
      return { valid: false, error: `File at index ${i} has an empty path.` };
    }

    if (/^[a-zA-Z]:/.test(trimmedPath) || trimmedPath.startsWith('/') || trimmedPath.startsWith('\\')) {
      return { valid: false, error: `Absolute path is prohibited: "${trimmedPath}"` };
    }

    const segments = trimmedPath.split(/[\/\\]/);
    for (const segment of segments) {
      if (!segment || segment === '.') {
        continue;
      }
      if (segment === '..') {
        return { valid: false, error: `Path traversal ("..") is prohibited in path: "${trimmedPath}"` };
      }
      if (FORBIDDEN_CHARS.test(segment)) {
        return { valid: false, error: `Forbidden characters in path: "${trimmedPath}"` };
      }
      if (WINDOWS_RESERVED_NAMES.test(segment)) {
        return { valid: false, error: `Windows reserved filename detected: "${segment}" in path: "${trimmedPath}"` };
      }
    }

    if (Buffer.byteLength(file.content, 'utf8') > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `File "${trimmedPath}" exceeds the maximum size limit of 1MB.` };
    }
  }

  return { valid: true };
}