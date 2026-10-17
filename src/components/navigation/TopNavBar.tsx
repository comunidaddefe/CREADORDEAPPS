import React from 'react';
import { Moon, Sun } from 'lucide-react';
import type { LanguageStack, LLMProvider } from '../../types/dashboard';
import { STACK_CATEGORIES, DASHBOARD_PRESETS } from '../../constants/stacks';

const STACK_CATEGORY_NAMES_ES: Record<string, string> = {
  'Formatos Base & Web Directa': 'Web y formatos base',
  'Windows Desktop & Nativo': 'Escritorio y nativo',
  'Web & Frontend': 'Desarrollo web',
  'Backend & Enterprise': 'Servicios y backend',
  'Data Science & AI': 'Datos e inteligencia artificial',
  'Mobile & Multiplatform': 'Móvil y multiplataforma',
  'Low Level & Systems': 'Sistemas',
  'Functional & Scripting': 'Lenguajes funcionales y scripts',
};

const STACK_LABELS_ES: Partial<Record<LanguageStack, string>> = {
  html: 'HTML (sitio web)', php: 'PHP (Laravel)', tsx: 'TSX (componente React)', go: 'Go', json: 'JSON (datos)',
  csharp: 'C# (.NET, WinUI y WPF)', cpp: 'C++ (Windows)', rust: 'Rust (Tauri)',
  typescript: 'TypeScript (React y Next.js)', javascript: 'JavaScript (Vue y Svelte)', html_css: 'HTML5 y CSS',
  vue: 'Vue.js', svelte: 'Svelte y SvelteKit', ruby: 'Ruby (Rails)', java: 'Java (Spring Boot)',
  kotlin: 'Kotlin (Ktor y Spring)', swift: 'Swift (SwiftUI)', dart: 'Dart (Flutter)', python: 'Python (FastAPI)',
  r: 'R (Shiny)', julia: 'Julia', sql: 'SQL', c: 'C', zig: 'Zig', nim: 'Nim',
  elixir: 'Elixir (Phoenix)', erlang: 'Erlang / OTP', scala: 'Scala', clojure: 'Clojure',
  haskell: 'Haskell', fsharp: 'F# (.NET)', ocaml: 'OCaml', perl: 'Perl', lua: 'Lua',
  bash: 'Bash (terminal)', powershell: 'PowerShell (Windows)', yaml: 'YAML (configuración)', solidity: 'Solidity',
};

interface TopNavBarProps {
  title: string;
  badge: string;
  provider: LLMProvider;
  hasReferenceFiles: boolean;
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
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
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
  hasReferenceFiles,
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
  theme,
  onThemeChange,
  isSynthesizing,
  hasWidgets,
  onOpenJsonModal,
  onClear,
  labels,
}: TopNavBarProps) {
  return (
    <header className="app-topbar min-h-14 border-b border-[var(--app-line)] bg-white px-4 xl:px-6 py-2 flex flex-wrap items-center justify-between shrink-0 select-none gap-3 shadow-[0_2px_12px_rgba(24,53,43,0.04)]">
      {/* Zona 1: Marca y Título */}
      <div className="w-full sm:w-auto flex max-w-full flex-wrap items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-md bg-[var(--app-ink)] flex items-center justify-center text-[var(--app-lime)] font-bold text-xs" aria-hidden="true">
          AC
        </div>
        <span className="font-semibold text-slate-900 text-sm tracking-tight">{title}</span>
        <span className="text-[10px] font-bold tracking-wide text-[var(--app-green)] bg-emerald-50 border border-emerald-100 px-2 py-1 rounded" aria-label={badge}>
          {badge}
        </span>
      </div>

      {/* Zona 2: Navegación, Motor, Stacks y Controles */}
      <div className="w-full sm:flex-1 min-w-0 max-w-full flex flex-wrap items-center gap-2 text-xs overflow-x-auto py-1 scrollbar-none">
        {/* Selector de Motor de IA */}
        <div className="min-w-0 max-w-full basis-full sm:basis-auto flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          <label htmlFor="engine-select" className="text-slate-500 text-[11px] pl-1">{lang === 'es' ? 'Motor:' : 'Engine:'}</label>
          <select
            id="engine-select"
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as LLMProvider)}
            className="min-w-0 max-w-full flex-1 bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
          >
            <option value="solusol" disabled={hasReferenceFiles}>SoluSol Cloud (api.solusol.net)</option>
            <option value="ollama" disabled={hasReferenceFiles}>Ollama (Localhost)</option>
          </select>
          {provider === 'ollama' && (
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => onOllamaModelChange(e.target.value)}
              aria-label="Ollama Model Name"
              placeholder={lang === 'es' ? 'Modelo (llama3.2)' : 'Model (llama3.2)'}
              className="w-24 px-1.5 py-0.5 text-[11px] bg-white border border-slate-300 rounded font-mono"
            />
          )}
        </div>

        {/* Selector de 38 Stacks Soportados */}
        <div className="min-w-0 max-w-full basis-full sm:basis-auto flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          <label htmlFor="polyglot-stack" className="text-slate-500 text-[11px] pl-1">{lang === 'es' ? 'Tecnología:' : 'Stack:'}</label>
          <select
            id="polyglot-stack"
            value={targetStack}
            onChange={(e) => onTargetStackChange(e.target.value as LanguageStack)}
            className="min-w-0 max-w-full flex-1 bg-transparent font-semibold text-slate-800 outline-none cursor-pointer pr-1"
          >
            {STACK_CATEGORIES.map((category) => (
              <optgroup key={category.name} label={lang === 'es' ? STACK_CATEGORY_NAMES_ES[category.name] || category.name : category.name}>
                {category.stacks.map((stack) => (
                  <option key={stack.id} value={stack.id}>
                    {lang === 'es' ? STACK_LABELS_ES[stack.id] || stack.label : stack.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Presets Industriales */}
        <div className="min-w-0 max-w-full basis-full sm:basis-auto flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          <label htmlFor="preset-select" className="text-slate-500 text-[11px] pl-1">{lang === 'es' ? 'Plantilla:' : 'Template:'}</label>
          <select
            id="preset-select"
            value=""
            onChange={(e) => {
              if (e.target.value) onLoadPreset(e.target.value);
            }}
            className="min-w-0 max-w-full flex-1 bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
          >
              <option value="" disabled>{lang === 'es' ? 'Elegir...' : 'Choose...'}</option>
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
            {lang === 'es' ? 'Proyecto' : 'Project'}
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
            title={lang === 'es' ? 'Deshacer (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            aria-label={lang === 'es' ? 'Deshacer' : 'Undo action'}
            className="px-2 py-1 text-xs rounded hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            title={lang === 'es' ? 'Rehacer (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            aria-label={lang === 'es' ? 'Rehacer' : 'Redo action'}
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
          {isPreviewMode ? (lang === 'es' ? 'Salir de vista previa' : 'Exit preview') : (lang === 'es' ? 'Vista previa' : 'Preview')}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="px-2 py-1 border border-slate-200 hover:bg-slate-50 rounded text-slate-600 text-xs"
          title={lang === 'es' ? 'Ajustes de conexión' : 'Connection settings'}
          aria-label={lang === 'es' ? 'Ajustes de conexión' : 'Connection settings'}
        >
          ⚙️
        </button>

        <div className="flex items-center gap-0.5 border border-slate-200 rounded-md bg-slate-100 p-0.5" role="group" aria-label={lang === 'es' ? 'Tema de color' : 'Color theme'}>
          <button
            type="button"
            onClick={() => onThemeChange('light')}
            aria-label={lang === 'es' ? 'Usar tema claro' : 'Use light theme'}
            aria-pressed={theme === 'light'}
            title={lang === 'es' ? 'Claro' : 'Light'}
            className={`w-7 h-7 inline-flex items-center justify-center rounded ${theme === 'light' ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-white/60'}`}
          >
            <Sun size={14} />
          </button>
          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            aria-label={lang === 'es' ? 'Usar tema oscuro' : 'Use dark theme'}
            aria-pressed={theme === 'dark'}
            title={lang === 'es' ? 'Oscuro' : 'Dark'}
            className={`w-7 h-7 inline-flex items-center justify-center rounded ${theme === 'dark' ? 'bg-slate-800 text-lime-300 shadow-sm' : 'text-slate-500 hover:bg-white/60'}`}
          >
            <Moon size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleLang}
          aria-label={lang === 'es' ? 'Cambiar idioma' : 'Switch language'}
          className="px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 uppercase text-xs"
        >
          {lang}
        </button>
      </div>

      {/* Zona 3: Acciones Principales */}
      <div className="w-full sm:w-auto flex max-w-full flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSynthesizeCode}
          disabled={isSynthesizing || !hasWidgets}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-medium shadow-sm transition-colors"
        >
          {isSynthesizing ? (lang === 'es' ? 'Preparando código...' : 'Preparing code...') : labels.exportCode}
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