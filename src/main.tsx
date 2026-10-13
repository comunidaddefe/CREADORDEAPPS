import { createRoot } from 'react-dom/client';
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface MetricResponse {
  origin: string;
  status: 'LIVE' | 'DEMO' | 'NO_DATA' | 'ERROR';
  unit: string;
  value?: string;
  series?: Array<{ label: string; value: number }>;
  points?: number[];
  rows?: Array<{ key: string; value: string }>;
  items?: Array<{ id: string; text: string; status: string }>;
  updatedAt: string;
  description?: string;
}

const STACK_CATEGORIES: { name: string; stacks: { id: LanguageStack; label: string }[] }[] = [
  {
    name: 'Windows Desktop & Nativo',
    stacks: [
      { id: 'csharp', label: 'C# (.NET / WinUI 3 & WPF)' },
      { id: 'cpp', label: 'C++ (Windows SDK / WinUI)' },
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
    badge: "LIVE PRODUCTION",
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
    badge: "PRODUCCIÓN EN VIVO",
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
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cmp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
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
  const [copied, setCopied] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, MetricResponse | null>>({});
  const [loadingMetrics, setLoadingMetrics] = useState<Record<string, boolean>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const t = (key: keyof typeof translations.en) => translations[lang][key];

  React.useEffect(() => {
    localStorage.setItem('appcraft_dashboard', JSON.stringify(dashboard));
  }, [dashboard]);

  React.useEffect(() => {
    localStorage.setItem('appcraft_stack', targetStack);
  }, [targetStack]);

  const sourcesSignature = dashboard
    .map((c) => `${c.id}:${c.type}:${c.props.data_source}`)
    .join('|');

  useEffect(() => {
    let isSubscribed = true;
    let timerId: ReturnType<typeof setTimeout>;
    let consecutiveFailures = 0;
    const BASE_INTERVAL = 3000;
    const MAX_INTERVAL = 30000;

    const pollLiveTelemetry = async () => {
      if (!isSubscribed || dashboard.length === 0) return;

      const activeLoadState: Record<string, boolean> = {};
      dashboard.forEach((comp) => {
        if (!liveMetrics[comp.id]) activeLoadState[comp.id] = true;
      });
      if (Object.keys(activeLoadState).length > 0) {
        setLoadingMetrics((prev) => ({ ...prev, ...activeLoadState }));
      }

      let hadError = false;
      try {
        const updates = await Promise.all(
          dashboard.map(async (comp) => {
            try {
              const res = await fetch(
                `/api/data?source=${encodeURIComponent(comp.props.data_source)}&type=${encodeURIComponent(comp.type)}`
              );
              if (!res.ok) {
                hadError = true;
                return [comp.id, null] as const;
              }
              const data: MetricResponse = await res.json();
              return [comp.id, data] as const;
            } catch {
              hadError = true;
              return [comp.id, null] as const;
            }
          })
        );
        if (isSubscribed) {
          setLiveMetrics(Object.fromEntries(updates));
          setLoadingMetrics({});
        }
      } catch (e) {
        hadError = true;
        if (isSubscribed) setLoadingMetrics({});
      }

      if (isSubscribed) {
        consecutiveFailures = hadError ? consecutiveFailures + 1 : 0;
        const nextDelay = hadError
          ? Math.min(MAX_INTERVAL, Math.round(BASE_INTERVAL * Math.pow(1.5, consecutiveFailures)))
          : BASE_INTERVAL;
        timerId = setTimeout(pollLiveTelemetry, nextDelay);
      }
    };

    pollLiveTelemetry();
    return () => {
      isSubscribed = false;
      clearTimeout(timerId);
    };
  }, [sourcesSignature]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDashboard((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate layout.');
      }
      if (Array.isArray(data)) {
        setDashboard(data);
        setSelectedId(data[0]?.id || null);
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error contacting generator backend.');
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
    setGeneratedCode('');
    setStatusMessage(null);
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
            {isSynthesizing ? 'Synthesizing code...' : t('exportCode')}
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={dashboard.map((c) => c.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dashboard.map((comp) => (
                        <SortableWidgetCard
                        key={comp.id}
                          comp={comp}
                          isSelected={comp.id === selectedId}
                          metric={liveMetrics[comp.id]}
                          isLoading={!!loadingMetrics[comp.id]}
                          onSelect={() => setSelectedId(comp.id)}
                          onDelete={() => {
                            setDashboard((prev) => prev.filter((c) => c.id !== comp.id));
                            if (selectedId === comp.id) setSelectedId(null);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          ) : (
            <div className="max-w-5xl mx-auto bg-slate-900 text-slate-100 p-6 rounded-lg font-mono text-xs overflow-x-auto shadow-lg">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-slate-400">
                <span>Stack: {targetStack.toUpperCase()} | Engine: {provider.toUpperCase()} {provider === 'ollama' ? `(${ollamaModel})` : ''}</span>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(generatedCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch (err: any) {
                      setStatusMessage('Could not copy code to clipboard: permission denied');
                    }
                  }}
                  className="hover:text-white transition-colors font-sans text-xs px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500"
                >
                  {copied ? 'Copied to clipboard ✓' : 'Copy to clipboard'}
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

function SortableWidgetCard({
  comp,
  isSelected,
  metric,
  isLoading,
  onSelect,
  onDelete,
}: {
  comp: DashboardWidget;
  isSelected: boolean;
  metric: MetricResponse | null | undefined;
  isLoading: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: comp.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const statusBadge = () => {
    if (isLoading) return <span className="text-[9px] text-amber-500 font-mono">FETCHING</span>;
    if (!metric) return <span className="text-[9px] text-red-500 font-mono">UNREACHABLE</span>;
    if (metric.status === 'LIVE') return <span className="text-[9px] text-emerald-600 font-mono font-medium">LIVE ({metric.origin})</span>;
    if (metric.status === 'DEMO') return <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded font-mono font-semibold">DEMO MODE</span>;
    if (metric.status === 'ERROR') return <span className="text-[9px] bg-red-50 text-red-700 border border-red-200 px-1 py-0.2 rounded font-mono font-semibold">ERROR</span>;
    return <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono">NO DATA</span>;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`relative rounded-lg border bg-white p-5 cursor-pointer transition-all shadow-sm ${
        isSelected ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Drag Handle"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 p-0.5 rounded text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </button>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{comp.props.title}</h3>
            <span className="text-[11px] text-slate-400 font-mono">{comp.props.data_source}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-slate-400 hover:text-red-600 text-xs p-1"
        >
          ✕
        </button>
      </div>

      {comp.type === 'stat' ? (
        <div className="mt-4 pt-2 border-t border-slate-100">
          <div className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {metric?.value || comp.props.value || 'N/A'}
          </div>
          <div className="text-[11px] mt-1 flex items-center justify-between">
            {statusBadge()}
            {metric?.unit && <span className="text-[10px] text-slate-400 font-mono">{metric.unit}</span>}
          </div>
        </div>
      ) : comp.type === 'bar_chart' ? (
        <div className="mt-4 pt-2 border-t border-slate-100">
          {metric?.series && metric.series.length > 0 ? (
            <div className="h-24 flex items-end gap-2 px-1">
              {metric.series.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-slate-800 rounded-t" style={{ height: `${item.value}%` }} />
                  <span className="text-[9px] text-slate-400 font-mono">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-24 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
              <span>No series available</span>
              {statusBadge()}
            </div>
          )}
        </div>
      ) : comp.type === 'line_chart' ? (
        <div className="mt-4 pt-2 border-t border-slate-100">
          {metric?.points && metric.points.length > 0 ? (
            <svg viewBox="0 0 200 60" className="w-full h-24 stroke-slate-800 fill-none">
              <path
                d={metric.points.reduce((acc, p, idx) => {
                  const x = Math.round((idx / ((metric.points?.length || 2) - 1)) * 200);
                  const y = Math.round(55 - (p / 100) * 45);
                  return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <div className="h-24 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
              <span>Empty stream</span>
              {statusBadge()}
            </div>
          )}
        </div>
      ) : comp.type === 'table' ? (
        <div className="mt-4 pt-2 border-t border-slate-100">
          {metric?.rows && metric.rows.length > 0 ? (
            <div className="max-h-28 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400">
                    <th className="pb-1 font-medium">Key</th>
                    <th className="pb-1 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {metric.rows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-1 truncate pr-2 font-mono text-[10px]">{row.key}</td>
                      <td className="py-1 text-right font-mono text-slate-900 text-[10px]">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-20 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
              <span>No connected table source</span>
              {statusBadge()}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 pt-2 border-t border-slate-100">
          {metric?.items && metric.items.length > 0 ? (
            <div className="max-h-28 overflow-y-auto space-y-1.5">
              {metric.items.map((item) => (
                <div key={item.id} className="text-[11px] flex items-center justify-between text-slate-700 bg-slate-50 px-2 py-1 rounded">
                  <span className="truncate pr-2">{item.text}</span>
                  <span className="text-[9px] text-emerald-600 font-mono font-medium">{item.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-20 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
              <span>Empty event stream</span>
              {statusBadge()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
