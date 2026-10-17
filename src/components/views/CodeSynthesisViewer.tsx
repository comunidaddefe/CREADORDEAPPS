import React, { useState, useEffect, useRef } from 'react';
import { Clipboard, Download } from 'lucide-react';

interface CodeSynthesisViewerProps {
  targetStack: string;
  provider: string;
  ollamaModel?: string;
  code: string;
  onNotify?: (message: string) => void;
  lang: 'en' | 'es';
}

export function CodeSynthesisViewer({
  targetStack,
  provider,
  ollamaModel,
  code,
  onNotify,
  lang,
}: CodeSynthesisViewerProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
      onNotify?.('Código copiado al portapapeles');
    } catch {
      onNotify?.('Error al copiar al portapapeles: permiso denegado');
    }
  };

  const handleDownload = () => {
    if (!code) return;
    const extensionByStack: Record<string, string> = {
      typescript: 'ts', tsx: 'tsx', javascript: 'js', html: 'html', html_css: 'html',
      python: 'py', csharp: 'cs', cpp: 'cpp', c: 'c', go: 'go', rust: 'rs',
      java: 'java', kotlin: 'kt', swift: 'swift', dart: 'dart', php: 'php',
      ruby: 'rb', sql: 'sql', json: 'json', yaml: 'yaml', powershell: 'ps1', bash: 'sh',
    };
    const extension = extensionByStack[targetStack.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `appcraft.${extension}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    onNotify?.(lang === 'es' ? 'Código descargado' : 'Code downloaded');
  };

  return (
    <div className="max-w-5xl mx-auto bg-slate-900 text-slate-100 p-6 rounded-lg font-mono text-xs overflow-x-auto shadow-lg">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-slate-400">
        <span>
          Stack: {targetStack.toUpperCase()} | Engine: {provider.toUpperCase()}{' '}
          {provider === 'ollama' && ollamaModel ? `(${ollamaModel})` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!code}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors font-sans text-xs px-2 py-1 rounded border border-slate-700 hover:border-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Clipboard size={13} />
            {copied ? (lang === 'es' ? 'Copiado' : 'Copied') : (lang === 'es' ? 'Copiar' : 'Copy')}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!code}
            className="inline-flex items-center gap-1.5 bg-[var(--app-green)] text-white hover:bg-[#1d573b] transition-colors font-sans text-xs px-2.5 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} />
            {lang === 'es' ? 'Descargar' : 'Download'}
          </button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap leading-relaxed">
        {code || (lang === 'es' ? '// Usa "Preparar código" para generar una versión descargable.' : '// Use "Prepare code" to generate a downloadable version.')}
      </pre>
    </div>
  );
}