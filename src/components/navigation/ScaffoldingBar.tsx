import React from 'react';

interface ScaffoldingBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerateDashboard: () => void;
  onGenerateFullApp: () => void;
  onOpenInterview: () => void;
  isGenerating: boolean;
  placeholder: string;
  generatingLabel: string;
  generateLabel: string;
  statusMessage?: string | null;
}

export function ScaffoldingBar({
  prompt,
  onPromptChange,
  onGenerateDashboard,
  onGenerateFullApp,
  onOpenInterview,
  isGenerating,
  placeholder,
  generatingLabel,
  generateLabel,
  statusMessage,
}: ScaffoldingBarProps) {
  return (
    <div className="border-b border-slate-200 bg-white px-6 py-3 shrink-0">
      <div className="max-w-6xl mx-auto flex gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isGenerating && prompt.trim()) {
              onGenerateDashboard();
            }
          }}
          aria-label={placeholder}
          placeholder={placeholder}
          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={onGenerateFullApp}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors"
        >
          {isGenerating ? 'Generando App...' : '⚡ Generar App'}
        </button>
        <button
          type="button"
          onClick={onOpenInterview}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
          title="Conversa con Santiago para definir las características paso a paso"
        >
          <span>💬</span> Entrevista Santiago
        </button>
        <button
          type="button"
          onClick={onGenerateDashboard}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
        >
          {isGenerating ? generatingLabel : generateLabel}
        </button>
      </div>
      {statusMessage && (
        <div className="max-w-6xl mx-auto mt-2 text-xs text-red-600">
          {statusMessage}
        </div>
      )}
    </div>
  );
}