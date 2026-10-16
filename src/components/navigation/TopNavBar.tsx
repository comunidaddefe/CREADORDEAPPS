import React from 'react';
import type { LanguageStack, LLMProvider } from '../../types/dashboard';
import { STACK_CATEGORIES, DASHBOARD_PRESETS } from '../../constants/stacks';

interface TopNavBarProps {
  title: string;
  badge: string;
  provider: LLMProvider;
  onProviderChange: (provider: LLMProvider) => void;
  ollamaModel: string;
  onOllamaModelChange: (model: string) => void;
  targetStack: LanguageStack;
  onTargetStackChange: (stack: LanguageStack) => void;
  onLoadPreset: (presetKey: string) => void;
  viewMode: 'canvas' | 'project' | 'code';
  onViewModeChange: (mode: 'canvas' | 'project' | 'code') => void;
  onSynthesizeCode: () => void;
  hasGeneratedCode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onOpenSettings: () => void;
  lang: 'en' | 'es';
  onToggleLang: () => void;
  isSynthesizing: boolean;
  hasWidgets: boolean;
  onOpenJsonModal: () => void;
  onClear: () => void;
  labels: {
    viewCanvas: string;
    viewCode: string;
    exportCode: string;
    clear: string;
  };
}

export function TopNavBar({
  title,
  badge,
  provider,
  onProviderChange,
  ollamaModel,
  onOllamaModelChange,
  targetStack,
  onTargetStackChange,
  onLoadPreset,
  viewMode,
  onViewModeChange,
  onSynthesizeCode,
  hasGeneratedCode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isPreviewMode,
  onTogglePreview,
  onOpenSettings,
  lang,
  onToggleLang,
  isSynthesizing,
  hasWidgets,
  onOpenJsonModal,
  onClear,
  labels,
}: TopNavBarProps) {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 select-none gap-4">
      {/* Zona 1: Marca y Título */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs" aria-hidden="true">
          AC
        </div>
        <span className="font-semibold text-slate-900 text-sm tracking-tight">{title}</span>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded" aria-label={`Version ${badge}`}>
          {badge}
        </span>
      </div>

      {/* Zona 2: Navegación, Motor, Stacks y Controles */}
      <div className="flex items-center gap-3 text-xs overflow-x-auto py-1 scrollbar-none">
        {/* Selector de Motor de IA */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          <label htmlFor="engine-select" className="text-slate-500 text-[11px] pl-1">Engine:</label>
          <select
            id="engine-select"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as LLMProvider)}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
          >
            <option value="solusol">SoluSol Cloud (api.solusol.net)</option>
            <option value="ollama">Ollama (Localhost)</option>
          </select>
          {provider === 'ollama' && (
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => onOllamaModelChange(e.target.value)}
              aria-label="Ollama Model Name"
              placeholder="Model (llama3.2)"
              className="w-24 px-1.5 py-0.5 text-[11px] bg-white border border-slate-300 rounded font-mono"
            />
          )}
        </div>

        {/* Selector de 38 Stacks Soportados */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          <label htmlFor="polyglot-stack" className="text-slate-500 text-[11px] pl-1">Stack:</label>
          <select
            id="polyglot-stack"
            value={targetStack}
            onChange={(e) => onTargetStackChange(e.target.value as LanguageStack)}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer pr-1"
          >
            {STACK_CATEGORIES.map((category) => (
              <optgroup key={category.name} label={category.name}>
                {category.stacks.map((stack) => (
                  <option key={stack.id} value={stack.id}>
                    {stack.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Presets Industriales */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          <label htmlFor="preset-select" className="text-slate-500 text-[11px] pl-1">Preset:</label>
          <select
            id="preset-select"
            value=""
            onChange={(e) => {
              if (e.target.value) onLoadPreset(e.target.value);
            }}
            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
          >
            <option value="" disabled>Load Template...</option>
            {Object.entries(DASHBOARD_PRESETS).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>
        </div>

        {/* Conmutador de Modos de Vista */}
        <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('canvas')}
            aria-pressed={viewMode === 'canvas'}
            className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === 'canvas' ? 'bg-white shadow-sm font-semibold text-slate-900' : 'text-slate-600'}`}
          >
            {labels.viewCanvas}
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('project')}
            aria-pressed={viewMode === 'project'}
            className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === 'project' ? 'bg-white shadow-sm font-semibold text-slate-900' : 'text-slate-600'}`}
          >
            Project (App)
          </button>
          <button
            type="button"
            onClick={() => {
              if (isSynthesizing) return;
              if (!hasGeneratedCode) onSynthesizeCode();
              else onViewModeChange('code');
            }}
            aria-pressed={viewMode === 'code'}
            className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === 'code' ? 'bg-white shadow-sm font-semibold text-slate-900' : 'text-slate-600'}`}
          >
            {labels.viewCode}
          </button>
        </div>

        {/* Controles de Deshacer / Rehacer */}
        <div className="flex items-center gap-1 border border-slate-200 rounded-md bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label="Undo action"
            className="px-2 py-1 text-xs rounded hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            aria-label="Redo action"
            className="px-2 py-1 text-xs rounded hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ↻
          </button>
        </div>

        <button
          type="button"
          onClick={onTogglePreview}
          aria-pressed={isPreviewMode}
          className={`px-2.5 py-1 rounded text-xs border transition-colors ${
            isPreviewMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {isPreviewMode ? 'Exit Preview' : 'Preview'}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="px-2 py-1 border border-slate-200 hover:bg-slate-50 rounded text-slate-600 text-xs"
          title="SoluSol Cloud Settings"
          aria-label="SoluSol Cloud Settings"
        >
          ⚙️
        </button>

        <button
          type="button"
          onClick={onToggleLang}
          aria-label={`Switch language. Current: ${lang}`}
          className="px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 uppercase text-xs"
        >
          {lang}
        </button>
      </div>

      {/* Zona 3: Acciones Principales */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSynthesizeCode}
          disabled={isSynthesizing || !hasWidgets}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-medium shadow-sm transition-colors"
        >
          {isSynthesizing ? 'Synthesizing code...' : labels.exportCode}
        </button>
        <button
          type="button"
          onClick={onOpenJsonModal}
          className="px-3 py-1.5 border border-slate-300 hover:border-slate-900 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          JSON
        </button>
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
        >
          {labels.clear}
        </button>
      </div>
    </header>
  );
}