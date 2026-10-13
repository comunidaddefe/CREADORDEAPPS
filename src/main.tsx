import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';
import './index.css';

export type LanguageStack =
  | 'javascript' | 'typescript' | 'html_css' | 'php' | 'ruby'
  | 'java' | 'csharp' | 'go' | 'rust' | 'elixir' | 'scala'
  | 'python' | 'r' | 'julia'
  | 'dart' | 'swift' | 'kotlin'
  | 'cpp' | 'c' | 'zig'
  | 'haskell' | 'erlang' | 'lua' | 'perl' | 'bash';

export type LLMProvider = 'gemini' | 'ollama';
export type ComponentType = 'stat' | 'bar_chart' | 'line_chart' | 'table' | 'list';

interface DashboardWidget {
  id: string;
  type: ComponentType;
  props: {
    title: string;
    data_source: string;
    value?: string;
  };
}

const STACK_CATEGORIES: { name: string; stacks: { id: LanguageStack; label: string }[] }[] = [
  {
    name: 'Windows Desktop & Nativo',
    stacks: [
      { id: 'csharp', label: 'C# (.NET / WinUI 3 & WPF)' },
      { id: 'cpp', label: 'C++ (Windows SDK / WinUI)' },
      { id: 'dart', label: 'Dart (Flutter Windows Desktop)' },
      { id: 'rust', label: 'Rust (Tauri / Slint Windows)' },
    ],
  },
  {
    name: 'Web & Frontend',
    stacks: [
      { id: 'typescript', label: 'TypeScript (React / Next.js)' },
      { id: 'javascript', label: 'JavaScript (Vue / Svelte)' },
      { id: 'html_css', label: 'HTML5 & Modern CSS' },
      { id: 'php', label: 'PHP (Laravel)' },
      { id: 'ruby', label: 'Ruby (Rails)' },
    ],
  },
  {
    name: 'Backend & Enterprise',
    stacks: [
      { id: 'go', label: 'Go (Gin / Fiber)' },
      { id: 'java', label: 'Java (Spring Boot)' },
      { id: 'elixir', label: 'Elixir (Phoenix)' },
      { id: 'scala', label: 'Scala (Play / Akka)' },
    ],
  },
  {
    name: 'Data Science & AI',
    stacks: [
      { id: 'python', label: 'Python (Streamlit / FastAPI)' },
      { id: 'r', label: 'R (Shiny)' },
      { id: 'julia', label: 'Julia (Genie)' },
    ],
  },
  {
    name: 'Mobile & Multiplatform',
    stacks: [
      { id: 'dart', label: 'Dart (Flutter Mobile & Multiplatform)' },
      { id: 'swift', label: 'Swift (SwiftUI)' },
      { id: 'kotlin', label: 'Kotlin (Jetpack Compose)' },
    ],
  },
  {
    name: 'Low Level & Systems',
    stacks: [
      { id: 'c', label: 'C' },
      { id: 'zig', label: 'Zig' },
    ],
  },
  {
    name: 'Functional & Scripting',
    stacks: [
      { id: 'haskell', label: 'Haskell' },
      { id: 'erlang', label: 'Erlang / OTP' },
      { id: 'lua', label: 'Lua' },
      { id: 'perl', label: 'Perl' },
      { id: 'bash', label: 'Bash (Shell Script)' },
    ],
  },
];

const translations = {
  en: {
    title: "AppCraft",
    badge: "Web & Windows Native (25 Stacks)",
    generate: "Generate Layout",
    generating: "Generating...",
    placeholder: "Describe your dashboard (e.g., E-commerce sales overview with ARR metric and transactions)...",
    exportCode: "Export Native Code",
    clear: "Clear Canvas",
    palette: "Component Palette",
    properties: "Properties Panel",
    selectToEdit: "Select a component from the canvas to configure properties.",
    viewCanvas: "Canvas View",
    viewCode: "Target Code",
    propTitle: "Title",
    propDataSource: "Data Source",
    propValue: "Metric Value",
    delete: "Delete",
    add: "Add to Canvas",
    engine: "LLM Engine",
    ollamaModel: "Local Model",
  },
  es: {
    title: "AppCraft",
    badge: "Web y Windows Nativo (25 Stacks)",
    generate: "Generar Estructura",
    generating: "Generando...",
    placeholder: "Describe tu panel (ej., Panel de e-commerce con métrica de ingresos y transacciones)...",
    exportCode: "Exportar Código Nativo",
    clear: "Limpiar Lienzo",
    palette: "Paleta de Componentes",
    properties: "Panel de Propiedades",
    selectToEdit: "Selecciona un componente del lienzo para editar sus propiedades.",
    viewCanvas: "Vista Lienzo",
    viewCode: "Código Nativo",
    propTitle: "Título",
    propDataSource: "Fuente de Datos",
    propValue: "Valor de Métrica",
    delete: "Eliminar",
    add: "Agregar al Lienzo",
    engine: "Motor LLM",
    ollamaModel: "Modelo Local",
  },
};

const PALETTE_TEMPLATES: Array<{ type: ComponentType; label: string; defaultProps: DashboardWidget['props'] }> = [
  { type: 'stat', label: 'Stat Metric', defaultProps: { title: 'Annual Recurring Revenue', value: '$840,200', data_source: 'analytics.arr' } },
  { type: 'bar_chart', label: 'Bar Chart', defaultProps: { title: 'Monthly Revenue', data_source: 'metrics.monthly_rev' } },
  { type: 'line_chart', label: 'Trend Graph', defaultProps: { title: 'Daily Active Users', data_source: 'telemetry.dau' } },
  { type: 'table', label: 'Data Table', defaultProps: { title: 'Recent Orders', data_source: 'orders.table' } },
  { type: 'list', label: 'Stream Feed', defaultProps: { title: 'System Alerts', data_source: 'logs.stream' } },
];

function generateId() {
  return 'cmp_' + Math.random().toString(36).substring(2, 9);
}

function App() {
  const [dashboard, setDashboard] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('appcraft_dashboard');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [
      { id: generateId(), type: 'stat', props: { title: 'ARR', value: '$1.24M', data_source: 'finance.arr' } },
      { id: generateId(), type: 'bar_chart', props: { title: 'Growth Q1-Q4', data_source: 'sales.quarterly' } },
      { id: generateId(), type: 'table', props: { title: 'Top Enterprise Accounts', data_source: 'crm.clients' } },
    ];
  });

  const [prompt, setPrompt] = useState('');
  const [targetStack, setTargetStack] = useState<LanguageStack>(() => {
    return (localStorage.getItem('appcraft_stack') as LanguageStack) || 'typescript';
  });
  const [provider, setProvider] = useState<LLMProvider>('gemini');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [viewMode, setViewMode] = useState<'canvas' | 'code'>('canvas');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const t = (key: keyof typeof translations.en) => translations[lang][key];

  React.useEffect(() => {
    localStorage.setItem('appcraft_dashboard', JSON.stringify(dashboard));
  }, [dashboard]);

  React.useEffect(() => {
    localStorage.setItem('appcraft_stack', targetStack);
  }, [targetStack]);

  const selectedWidget = dashboard.find((c) => c.id === selectedId);

  const generateDashboard = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/generate-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, stack: targetStack }),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setDashboard(data);
        setSelectedId(data[0]?.id || null);
      }
    } catch (err) {
      setStatusMessage('Error contacting generator backend.');
    } finally {
      setIsGenerating(false);
    }
  };

  const synthesizeTargetCode = async () => {
    setIsSynthesizing(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/export-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layout: dashboard,
          stack: targetStack,
          provider,
          model: ollamaModel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to export code');
      }
      setGeneratedCode(data.code || '// Empty code returned');
      setViewMode('code');
    } catch (err: any) {
      setStatusMessage(err.message || 'Generation error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const addComponent = (type: ComponentType, defaultProps: DashboardWidget['props']) => {
    const newWidget: DashboardWidget = {
      id: generateId(),
      type,
      props: { ...defaultProps },
    };
    setDashboard((prev) => [...prev, newWidget]);
    setSelectedId(newWidget.id);
  };

  const updateSelectedProps = (patch: Partial<DashboardWidget['props']>) => {
    if (!selectedId) return;
    setDashboard((prev) =>
      prev.map((item) =>
        item.id === selectedId ? { ...item, props: { ...item.props, ...patch } } : item
      )
    );
  };

  const handleClear = () => {
    setDashboard([]);
    setSelectedId(null);
    localStorage.removeItem('appcraft_dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Bar Contract (3-Zone Header) */}
      <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 select-none">
        {/* Zone 1: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
            AC
          </div>
          <span className="font-semibold text-slate-900 text-sm tracking-tight">{t('title')}</span>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {t('badge')}
          </span>
        </div>

        {/* Zone 2: Navigation & Multi-Language / Engine Controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Engine Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
            <label htmlFor="engine-select" className="text-slate-500 text-[11px] pl-1">Engine:</label>
            <select
              id="engine-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value as LLMProvider)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="gemini">Gemini Flash (Cloud)</option>
              <option value="ollama">Ollama (Localhost)</option>
            </select>
            {provider === 'ollama' && (
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                placeholder="Model (llama3.2)"
                className="w-24 px-1.5 py-0.5 text-[11px] bg-white border border-slate-300 rounded font-mono"
              />
            )}
          </div>

          {/* 25-Language Target Stack Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
            <label htmlFor="polyglot-stack" className="text-slate-500 text-[11px] pl-1">Stack:</label>
            <select
              id="polyglot-stack"
              value={targetStack}
              onChange={(e) => setTargetStack(e.target.value as LanguageStack)}
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

          {/* Mode Switcher */}
          <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-100 p-0.5">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === 'canvas' ? 'bg-white shadow-sm font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              {t('viewCanvas')}
            </button>
            <button
              onClick={() => {
                if (!generatedCode) synthesizeTargetCode();
                else setViewMode('code');
              }}
              className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === 'code' ? 'bg-white shadow-sm font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              {t('viewCode')}
            </button>
          </div>

          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="px-2 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 uppercase text-xs"
          >
            {lang}
          </button>
        </div>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={synthesizeTargetCode}
            disabled={isSynthesizing || dashboard.length === 0}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded text-xs font-medium shadow-sm transition-colors"
          >
            {isSynthesizing ? 'Compiling...' : t('exportCode')}
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-600 transition-colors"
          >
            {t('clear')}
          </button>
        </div>
      </header>

      {/* Scaffolding Bar */}
      <div className="border-b border-slate-200 bg-white px-6 py-3 shrink-0">
        <div className="max-w-6xl mx-auto flex gap-3">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateDashboard()}
            placeholder={t('placeholder')}
            className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
          />
          <button
            onClick={generateDashboard}
            disabled={isGenerating || !prompt.trim()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors"
          >
            {isGenerating ? t('generating') : t('generate')}
          </button>
        </div>
        {statusMessage && (
          <div className="max-w-6xl mx-auto mt-2 text-xs text-red-600">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Workspace Tripartite Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Palette */}
        <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col shrink-0 overflow-y-auto">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {t('palette')}
          </h2>
          <div className="flex flex-col gap-2">
            {PALETTE_TEMPLATES.map((item) => (
              <button
                key={item.type}
                onClick={() => addComponent(item.type, item.defaultProps)}
                className="group flex flex-col items-start p-3 border border-slate-200 rounded-md hover:border-slate-900 hover:bg-slate-50 transition-all text-left"
              >
                <span className="text-xs font-semibold text-slate-900">{item.label}</span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">{item.type}</span>
                <span className="text-[10px] text-slate-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  + {t('add')}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Canvas or Polyglot Target Code */}
        <main className="flex-1 overflow-y-auto p-8">
          {viewMode === 'canvas' ? (
            <div className="max-w-6xl mx-auto">
              {dashboard.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg text-slate-400 p-8 text-center">
                  <p className="text-sm font-medium">Workspace is empty</p>
                  <p className="text-xs mt-1">Use the generator above or add components from the palette.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboard.map((comp) => {
                    const isSelected = comp.id === selectedId;
                    return (
                      <div
                        key={comp.id}
                        onClick={() => setSelectedId(comp.id)}
                        className={`relative rounded-lg border bg-white p-5 cursor-pointer transition-all shadow-sm ${
                          isSelected ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">{comp.props.title}</h3>
                            <span className="text-[11px] text-slate-400 font-mono">{comp.props.data_source}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDashboard(dashboard.filter((c) => c.id !== comp.id));
                              if (selectedId === comp.id) setSelectedId(null);
                            }}
                            className="text-slate-400 hover:text-red-600 text-xs p-1"
                          >
                            ✕
                          </button>
                        </div>

                        {comp.type === 'stat' ? (
                          <div className="mt-4 pt-2 border-t border-slate-100">
                            <div className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                              {comp.props.value || '$0.00'}
                            </div>
                            <div className="text-[11px] text-emerald-600 font-medium mt-1 tabular-nums">
                              ↑ Stable telemetry binding
                            </div>
                          </div>
                        ) : (
                          <div className="min-h-[140px] mt-4 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded bg-slate-50/50 p-4">
                            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 font-mono">
                              [{comp.type}]
                            </span>
                            <span className="text-[11px] text-slate-400 mt-1">Bound to {comp.props.data_source}</span>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                          <span>{comp.type}</span>
                          <span className="tabular-nums">{comp.id}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-5xl mx-auto bg-slate-900 text-slate-100 p-6 rounded-lg font-mono text-xs overflow-x-auto shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-slate-400">
                <span>Stack: {targetStack.toUpperCase()} | Engine: {provider.toUpperCase()} {provider === 'ollama' ? `(${ollamaModel})` : ''}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedCode)}
                  className="hover:text-white transition-colors"
                >
                  Copy to clipboard
                </button>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">{generatedCode || '// Select "Export Native Code" to synthesize code.'}</pre>
            </div>
          )}
        </main>

        {/* Right: Properties Panel */}
        <aside className="w-72 border-l border-slate-200 bg-white p-5 flex flex-col shrink-0 overflow-y-auto">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            {t('properties')}
          </h2>
          {selectedWidget ? (
            <div className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('propTitle')}</label>
                <input
                  type="text"
                  value={selectedWidget.props.title}
                  onChange={(e) => updateSelectedProps({ title: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('propDataSource')}</label>
                <input
                  type="text"
                  value={selectedWidget.props.data_source}
                  onChange={(e) => updateSelectedProps({ data_source: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {selectedWidget.type === 'stat' && (
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">{t('propValue')}</label>
                  <input
                    type="text"
                    value={selectedWidget.props.value || ''}
                    onChange={(e) => updateSelectedProps({ value: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-mono">ID: {selectedWidget.id}</span>
                <button
                  onClick={() => {
                    setDashboard(dashboard.filter((c) => c.id !== selectedWidget.id));
                    setSelectedId(null);
                  }}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('selectToEdit')}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
