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
  | 'html' | 'php' | 'tsx' | 'go' | 'json'
  | 'javascript' | 'typescript' | 'html_css' | 'vue' | 'svelte'
  | 'csharp' | 'rust' | 'cpp' | 'c' | 'zig' | 'nim'
  | 'java' | 'kotlin' | 'swift' | 'dart'
  | 'python' | 'ruby' | 'perl' | 'lua' | 'bash' | 'powershell'
  | 'elixir' | 'erlang' | 'scala' | 'clojure' | 'haskell' | 'fsharp' | 'ocaml'
  | 'r' | 'julia' | 'sql' | 'yaml' | 'solidity';

export type LLMProvider = 'solusol' | 'ollama';
export type ComponentType = 'stat' | 'bar_chart' | 'line_chart' | 'table' | 'list';

interface DashboardWidget {
  id: string;
  type: ComponentType;
  gridPosition?: {
    colSpan: number;
    rowSpan?: number;
  };
  props: {
    title: string;
    data_source: string;
    value?: string;
  };
}

interface GeneratedProjectFile {
  path: string;
  content: string;
}

interface GeneratedProject {
  appName: string;
  description: string;
  stack?: string;
  runCommand: string;
  files: GeneratedProjectFile[];
  readme: string;
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

interface InterviewOption {
  question: string;
  choices: string[];
}

interface InterviewMessage {
  sender: 'user' | 'santiago';
  text: string;
  questions?: string[];
  options?: InterviewOption[];
  isReadyToBuild?: boolean;
  refinedPrompt?: string;
}

const STACK_CATEGORIES: { name: string; stacks: { id: LanguageStack; label: string }[] }[] = [
  {
    name: 'Formatos Base & Web Directa',
    stacks: [
      { id: 'html', label: 'HTML (Página / Standalone Web)' },
      { id: 'php', label: 'PHP (Vanilla / Laravel)' },
      { id: 'tsx', label: 'TSX (React Component / JSX)' },
      { id: 'go', label: 'Go (Gin / Fiber / CLI)' },
      { id: 'json', label: 'JSON (Estructura de Datos / API Schema)' },
    ],
  },
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
      { id: 'vue', label: 'Vue.js (SFC Component)' },
      { id: 'svelte', label: 'Svelte / SvelteKit' },
      { id: 'ruby', label: 'Ruby (Rails)' },
    ],
  },
  {
    name: 'Backend & Enterprise',
    stacks: [
      { id: 'java', label: 'Java (Spring Boot)' },
      { id: 'kotlin', label: 'Kotlin (Ktor / Spring)' },
      { id: 'scala', label: 'Scala (Play / Akka)' },
      { id: 'clojure', label: 'Clojure (Ring / Compojure)' },
      { id: 'elixir', label: 'Elixir (Phoenix)' },
      { id: 'erlang', label: 'Erlang / OTP' },
      { id: 'fsharp', label: 'F# (.NET Functional)' },
    ],
  },
  {
    name: 'Data Science & AI',
    stacks: [
      { id: 'python', label: 'Python (Streamlit / FastAPI)' },
      { id: 'r', label: 'R (Shiny)' },
      { id: 'julia', label: 'Julia (Genie)' },
      { id: 'sql', label: 'SQL (DDL / DML Queries)' },
    ],
  },
  {
    name: 'Mobile & Multiplatform',
    stacks: [
      { id: 'dart', label: 'Dart (Flutter Mobile & Multiplatform)' },
      { id: 'swift', label: 'Swift (SwiftUI)' },
    ],
  },
  {
    name: 'Low Level & Systems',
    stacks: [
      { id: 'c', label: 'C' },
      { id: 'zig', label: 'Zig' },
      { id: 'nim', label: 'Nim' },
    ],
  },
  {
    name: 'Functional & Scripting',
    stacks: [
      { id: 'haskell', label: 'Haskell' },
      { id: 'ocaml', label: 'OCaml' },
      { id: 'lua', label: 'Lua' },
      { id: 'perl', label: 'Perl' },
      { id: 'bash', label: 'Bash (Shell Script)' },
      { id: 'powershell', label: 'PowerShell (Windows Automation)' },
      { id: 'yaml', label: 'YAML (Config / Kubernetes)' },
      { id: 'solidity', label: 'Solidity (Smart Contracts)' },
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

const DASHBOARD_PRESETS: Record<string, { label: string; widgets: DashboardWidget[] }> = {
  solar: {
    label: '☀️ Parque Solar SoluSol',
    widgets: [
      { id: 'sol_power', type: 'stat', gridPosition: { colSpan: 4 }, props: { title: 'Potencia Activa (kW)', value: '142.8 kW', data_source: 'solusol.telemetry.power' } },
      { id: 'sol_gen', type: 'bar_chart', gridPosition: { colSpan: 8 }, props: { title: 'Generación Diaria (kWh)', data_source: 'solusol.generation.daily' } },
      { id: 'sol_inverters', type: 'table', gridPosition: { colSpan: 12 }, props: { title: 'Telemetría de Inversores', data_source: 'solusol.inverters.status' } },
    ],
  },
  runtime: {
    label: '🖥️ Servidor & Runtime Node',
    widgets: [
      { id: 'sys_uptime', type: 'stat', gridPosition: { colSpan: 4 }, props: { title: 'Uptime del Proceso', data_source: 'system.node_uptime' } },
      { id: 'sys_mem', type: 'stat', gridPosition: { colSpan: 4 }, props: { title: 'Memoria V8 Heap', data_source: 'system.node_memory' } },
      { id: 'sys_table', type: 'table', gridPosition: { colSpan: 12 }, props: { title: 'Atributos de Arquitectura', data_source: 'system.node_runtime' } },
    ],
  },
  saas: {
    label: '💼 SaaS & Negocio B2B',
    widgets: [
      { id: 'saas_arr', type: 'stat', gridPosition: { colSpan: 3 }, props: { title: 'ARR Global', value: '$1.42M', data_source: 'finance.arr' } },
      { id: 'saas_rev', type: 'bar_chart', gridPosition: { colSpan: 5 }, props: { title: 'Ingresos Mensuales', data_source: 'sales.revenue' } },
      { id: 'saas_users', type: 'line_chart', gridPosition: { colSpan: 4 }, props: { title: 'Usuarios Activos (DAU)', data_source: 'telemetry.dau' } },
      { id: 'saas_acc', type: 'table', gridPosition: { colSpan: 12 }, props: { title: 'Cuentas Clave', data_source: 'crm.accounts' } },
    ],
  },
};

const PALETTE_TEMPLATES: Array<{ type: ComponentType; label: string; defaultColSpan: number; defaultProps: DashboardWidget['props'] }> = [
  { type: 'stat', label: 'Stat Metric', defaultColSpan: 3, defaultProps: { title: 'Annual Recurring Revenue', value: '$840,200', data_source: 'analytics.arr' } },
  { type: 'bar_chart', label: 'Bar Chart', defaultColSpan: 6, defaultProps: { title: 'Monthly Revenue', data_source: 'metrics.monthly_rev' } },
  { type: 'line_chart', label: 'Trend Graph', defaultColSpan: 6, defaultProps: { title: 'Daily Active Users', data_source: 'telemetry.dau' } },
  { type: 'table', label: 'Data Table', defaultColSpan: 12, defaultProps: { title: 'Recent Orders', data_source: 'orders.table' } },
  { type: 'list', label: 'Stream Feed', defaultColSpan: 6, defaultProps: { title: 'System Alerts', data_source: 'logs.stream' } },
  { type: 'stat', label: 'SoluSol Power (Live)', defaultColSpan: 3, defaultProps: { title: 'Active Power (kW)', value: '142.8 kW', data_source: 'solusol.telemetry.power' } },
  { type: 'bar_chart', label: 'SoluSol Generation', defaultColSpan: 6, defaultProps: { title: 'Solar Output (kWh)', data_source: 'solusol.generation.daily' } },
];

const COL_SPAN_CLASSES: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

function getColSpanClass(colSpan: number = 4) {
  const span = Math.min(12, Math.max(1, colSpan));
  return COL_SPAN_CLASSES[span] || 'md:col-span-4';
}

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
      { id: generateId(), type: 'stat', gridPosition: { colSpan: 4 }, props: { title: 'ARR', value: '$1.24M', data_source: 'finance.arr' } },
      { id: generateId(), type: 'bar_chart', gridPosition: { colSpan: 8 }, props: { title: 'Growth Q1-Q4', data_source: 'sales.quarterly' } },
      { id: generateId(), type: 'table', gridPosition: { colSpan: 12 }, props: { title: 'Top Enterprise Accounts', data_source: 'crm.clients' } },
    ];
  });

  // Historial de estados para Undo / Redo
  const [history, setHistory] = useState<DashboardWidget[][]>([dashboard]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [prompt, setPrompt] = useState('');
  const [targetStack, setTargetStack] = useState<LanguageStack>(() => {
    return (localStorage.getItem('appcraft_stack') as LanguageStack) || 'typescript';
  });
  const [provider, setProvider] = useState<LLMProvider>('solusol');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [viewMode, setViewMode] = useState<'canvas' | 'project' | 'code'>('canvas');
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [activeProjectTab, setActiveProjectTab] = useState<'editor' | 'readme'>('editor');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<InterviewMessage[]>([]);
  const [interviewInput, setInterviewInput] = useState('');
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [solusolUrl, setSolusolUrl] = useState(() => localStorage.getItem('appcraft_solusol_url') || 'https://api.solusol.net');
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

  const pushToHistory = (newDashboard: DashboardWidget[]) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, newDashboard];
    });
    setHistoryIndex((prev) => prev + 1);
    setDashboard(newDashboard);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setDashboard(history[nextIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setDashboard(history[nextIndex]);
    }
  };

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

  // Atajos de teclado para Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = dashboard.findIndex((i) => i.id === active.id);
      const newIndex = dashboard.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const updated = arrayMove(dashboard, oldIndex, newIndex);
        pushToHistory(updated);
      }
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
        body: JSON.stringify({ prompt, stack: targetStack, provider, model: ollamaModel }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate layout.');
      }
      if (Array.isArray(data)) {
        const normalized = data.map((item: any) => ({
          ...item,
          gridPosition: item.gridPosition || { colSpan: item.type === 'table' ? 12 : item.type === 'stat' ? 3 : 6 }
        }));
        pushToHistory(normalized);
        setSelectedId(data[0]?.id || null);
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error contacting generator backend.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFullApp = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, stack: targetStack, provider, model: ollamaModel }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate project.');
      }
      if (data && Array.isArray(data.files) && data.files.length > 0) {
        setGeneratedProject(data);
        setSelectedFileIndex(0);
        setViewMode('project');
      } else {
        throw new Error('Project response did not contain files.');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error generating native app project.');
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

  const sendInterviewMessage = async (textToSend?: string) => {
    const msg = (textToSend || interviewInput).trim();
    if (!msg || isInterviewLoading) return;

    const userMsg: InterviewMessage = { sender: 'user', text: msg };
    const nextHistory = [...interviewHistory, userMsg];
    setInterviewHistory(nextHistory);
    setInterviewInput('');
    setIsInterviewLoading(true);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: nextHistory.map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          stack: targetStack,
          provider,
          model: ollamaModel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const santiagoMsg: InterviewMessage = {
          sender: 'santiago',
          text: data.reply || 'Entendido.',
          questions: data.questions,
          options: data.options,
          isReadyToBuild: data.isReadyToBuild,
          refinedPrompt: data.refinedPrompt,
        };
        setInterviewHistory([...nextHistory, santiagoMsg]);
      } else {
        throw new Error(data.error || 'Error en la entrevista');
      }
    } catch (err: any) {
      setInterviewHistory([
        ...nextHistory,
        { sender: 'santiago', text: `Lo siento, hubo un problema: ${err.message}` },
      ]);
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const addComponent = (type: ComponentType, defaultProps: DashboardWidget['props'], defaultColSpan: number = 4) => {
    const newWidget: DashboardWidget = {
      id: generateId(),
      type,
      gridPosition: { colSpan: defaultColSpan },
      props: { ...defaultProps },
    };
    pushToHistory([...dashboard, newWidget]);
    setSelectedId(newWidget.id);
  };

  const duplicateComponent = (widget: DashboardWidget) => {
    const cloned: DashboardWidget = {
      ...widget,
      id: generateId(),
      props: { ...widget.props, title: `${widget.props.title} (Copy)` },
      gridPosition: { colSpan: widget.gridPosition?.colSpan || 4 },
    };
    pushToHistory([...dashboard, cloned]);
    setSelectedId(cloned.id);
  };

  const loadPreset = (presetKey: string) => {
    const preset = DASHBOARD_PRESETS[presetKey];
    if (preset) {
      pushToHistory(preset.widgets.map((w) => ({ ...w, id: generateId() })));
      setSelectedId(null);
    }
  };

  const updateSelectedProps = (patch: Partial<DashboardWidget['props']>) => {
    if (!selectedId) return;
    const updated = dashboard.map((item) =>
      item.id === selectedId ? { ...item, props: { ...item.props, ...patch } } : item
    );
    pushToHistory(updated);
  };

  const handleClear = () => {
    pushToHistory([]);
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
              <option value="solusol">SoluSol Cloud (api.solusol.net)</option>
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

          {/* 38-Language Target Stack Selector */}
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

          {/* Presets industriales y plantillas rápidas */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
            <label htmlFor="preset-select" className="text-slate-500 text-[11px] pl-1">Preset:</label>
            <select
              id="preset-select"
              defaultValue=""
              onChange={(e) => { if (e.target.value) loadPreset(e.target.value); e.target.value = ''; }}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="" disabled>Load Template...</option>
              {Object.entries(DASHBOARD_PRESETS).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
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
              onClick={() => setViewMode('project')}
              className={`px-3 py-1 rounded text-xs transition-colors ${viewMode === 'project' ? 'bg-white shadow-sm font-semibold text-slate-900' : 'text-slate-600'}`}
            >
              Project (App)
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

          {/* Undo / Redo & Kiosk View */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-md bg-slate-100 p-0.5">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="px-2 py-1 text-xs rounded hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ↺
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="px-2 py-1 text-xs rounded hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ↻
            </button>
          </div>

          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors ${
              isPreviewMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isPreviewMode ? 'Exit Preview' : 'Preview'}
          </button>

          <button
            onClick={() => setSettingsModalOpen(true)}
            className="px-2 py-1 border border-slate-200 hover:bg-slate-50 rounded text-slate-600 text-xs"
            title="SoluSol Cloud Settings"
          >
            ⚙️
          </button>

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
            onClick={() => { setJsonInput(JSON.stringify(dashboard, null, 2)); setJsonModalOpen(true); }}
            className="px-3 py-1.5 border border-slate-300 hover:border-slate-900 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            JSON
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
      {!isPreviewMode && (
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
            onClick={generateFullApp}
            disabled={isGenerating || !prompt.trim()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors"
          >
            {isGenerating ? 'Generando App...' : '⚡ Generar App'}
          </button>
          <button
            onClick={() => {
              setInterviewModalOpen(true);
              if (prompt.trim() && interviewHistory.length === 0) {
                sendInterviewMessage(prompt);
              }
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
            title="Conversa con Santiago para definir las características paso a paso"
          >
            <span>💬</span> Entrevista Santiago
          </button>
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
      )}

      {/* Workspace Tripartite Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Component Palette */}
        {!isPreviewMode && (
        <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col shrink-0 overflow-y-auto">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            {t('palette')}
          </h2>
          <div className="flex flex-col gap-2">
            {PALETTE_TEMPLATES.map((item) => (
              <button
                key={`${item.type}-${item.label}`}
                onClick={() => addComponent(item.type, item.defaultProps, item.defaultColSpan)}
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
        )}

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
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {dashboard.map((comp) => (
                        <SortableWidgetCard
                          key={comp.id}
                          comp={comp}
                          isSelected={comp.id === selectedId}
                          metric={liveMetrics[comp.id]}
                          isLoading={!!loadingMetrics[comp.id]}
                          onSelect={() => setSelectedId(comp.id)}
                          onDuplicate={() => duplicateComponent(comp)}
                          onDelete={() => {
                            pushToHistory(dashboard.filter((c) => c.id !== comp.id));
                            if (selectedId === comp.id) setSelectedId(null);
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          ) : viewMode === 'project' ? (
            generatedProject ? (
              <div className="max-w-6xl mx-auto flex flex-col gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-xs">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{generatedProject.appName}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{generatedProject.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-mono">
                      <span>▶</span>
                      <span>{generatedProject.runCommand || 'dotnet run'}</span>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedProject.runCommand)}
                      className="text-xs border border-slate-300 hover:bg-slate-50 px-2.5 py-1.5 rounded text-slate-700 font-medium"
                      title="Copiar comando de ejecución"
                    >
                      Copiar comando
                    </button>
                    <button
                      onClick={() => {
                        const fullDump = JSON.stringify(generatedProject, null, 2);
                        const blob = new Blob([fullDump], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${generatedProject.appName || 'project'}.manifest.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1.5 rounded font-medium"
                    >
                      Exportar Manifest
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 h-[580px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-lg">
                  {/* Árbol de Archivos del Proyecto */}
                  <div className="col-span-3 bg-slate-950/90 border-r border-slate-800 p-3 overflow-y-auto flex flex-col justify-between">
                    <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Archivos</span>
                    <div className="space-y-1">
                      {generatedProject.files.map((file, idx) => (
                        <button
                          key={file.path}
                          onClick={() => {
                            setSelectedFileIndex(idx);
                            setActiveProjectTab('editor');
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors truncate ${
                            selectedFileIndex === idx && activeProjectTab === 'editor'
                              ? 'bg-slate-800 text-emerald-400 font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                          }`}
                        >
                          📄 {file.path}
                        </button>
                      ))}
                    </div>
                  </div>
                    {generatedProject.readme && (
                      <button
                        onClick={() => setActiveProjectTab('readme')}
                        className={`w-full text-left px-2.5 py-2 mt-4 rounded text-xs font-sans border transition-colors ${
                          activeProjectTab === 'readme'
                            ? 'bg-emerald-950/50 border-emerald-600 text-emerald-300 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        📖 Guía de Compilación (README)
                      </button>
                    )}
                  </div>

                  {/* Visor de Código / Visor de README */}
                  <div className="col-span-9 flex flex-col overflow-hidden bg-slate-900">
                    <div className="h-10 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span>{activeProjectTab === 'editor' ? generatedProject.files[selectedFileIndex]?.path : 'README.md'}</span>
                      <button
                        onClick={() => {
                          const toCopy = activeProjectTab === 'editor'
                            ? generatedProject.files[selectedFileIndex]?.content || ''
                            : generatedProject.readme || '';
                          navigator.clipboard.writeText(toCopy);
                          setStatusMessage('Contenido copiado al portapapeles');
                          setTimeout(() => setStatusMessage(null), 2000);
                        }}
                        className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-0.5 rounded text-[11px] font-sans"
                      >
                        Copiar contenido
                      </button>
                    </div>
                    <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-100 whitespace-pre leading-relaxed">
                      {activeProjectTab === 'editor'
                        ? generatedProject.files[selectedFileIndex]?.content
                        : generatedProject.readme}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto text-center py-24 text-slate-400">
                <h3 className="text-base font-semibold text-slate-800 mb-1">Sin proyecto generado</h3>
                <p className="text-xs text-slate-500">Usa "⚡ Generar App" para crear un proyecto multiarchivo.</p>
              </div>
            )
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
        {!isPreviewMode && (
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
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-medium">Grid Width (1-12)</label>
                  <span className="font-mono text-slate-900 font-semibold">{selectedWidget.gridPosition?.colSpan || 4} cols</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[11px] font-mono">
                  {[
                    { label: '1/4 (3)', span: 3 },
                    { label: '1/3 (4)', span: 4 },
                    { label: '1/2 (6)', span: 6 },
                    { label: '2/3 (8)', span: 8 },
                    { label: 'Full (12)', span: 12 },
                  ].map((preset) => (
                    <button
                      key={preset.span}
                      type="button"
                      onClick={() => {
                        setDashboard((prev) =>
                          prev.map((item) =>
                            item.id === selectedWidget.id
                              ? { ...item, gridPosition: { ...item.gridPosition, colSpan: preset.span } }
                              : item
                          )
                        );
                      }}
                      className={`py-1 px-1 rounded border text-center transition-colors ${
                        (selectedWidget.gridPosition?.colSpan || 4) === preset.span
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
        )}
      </div>

      {/* Modal de Importación / Exportación JSON */}
      {jsonModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Dashboard JSON Schema</h3>
              <button onClick={() => setJsonModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
            </div>
            <textarea
              rows={14}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 mb-4 leading-relaxed"
            />
            <div className="flex justify-between items-center text-xs">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(jsonInput);
                    setStatusMessage('JSON copied to clipboard');
                    setTimeout(() => setStatusMessage(null), 2500);
                  }}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-700"
                >
                  Copy JSON
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setJsonModalOpen(false)} className="px-3 py-1.5 text-slate-500 hover:text-slate-800">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(jsonInput);
                      if (Array.isArray(parsed)) {
                        pushToHistory(parsed);
                        setJsonModalOpen(false);
                      } else {
                        alert('El JSON debe ser un array de widgets válido.');
                      }
                    } catch (e: any) {
                      alert(`JSON Inválido: ${e.message}`);
                    }
                  }}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium"
                >
                  Apply JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración SoluSol Cloud (Nivel 2) */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-semibold text-slate-900">SoluSol Cloud Settings</h3>
              <button onClick={() => setSettingsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Upstream API URL</label>
                <input
                  type="text"
                  value={solusolUrl}
                  onChange={(e) => setSolusolUrl(e.target.value)}
                  placeholder="https://api.solusol.net"
                  className="w-full px-3 py-2 border border-slate-200 rounded font-mono"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 text-xs">
              <button onClick={() => setSettingsModalOpen(false)} className="px-3 py-1.5 text-slate-500 hover:text-slate-800">
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('appcraft_solusol_url', solusolUrl);
                  setSettingsModalOpen(false);
                  setStatusMessage('SoluSol settings updated');
                  setTimeout(() => setStatusMessage(null), 2500);
                }}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Entrevista Guiada con Santiago */}
      {interviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col h-[600px] border border-slate-200 overflow-hidden">
            {/* Header del Chat */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  ST
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Santiago • Arquitecto de Apps</h3>
                  <p className="text-[11px] text-slate-500">Definiendo características para stack: <span className="font-mono text-indigo-600 font-semibold">{targetStack}</span></p>
                </div>
              </div>
              <button onClick={() => setInterviewModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm p-1">✕</button>
            </div>

            {/* Historial de conversación */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              {interviewHistory.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p className="text-2xl mb-2">🎙️</p>
                  <p className="font-semibold text-slate-700">Dime qué aplicación tienes en mente.</p>
                  <p className="mt-1">Por ejemplo: <em>"Quiero una página web de una radio por internet"</em>.</p>
                </div>
              )}

              {interviewHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                    msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                  }`}>
                    <p>{msg.text}</p>

                    {/* Opciones interactivas con un clic */}
                    {msg.options && msg.options.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                        {msg.options.map((optGroup, gIdx) => (
                          <div key={gIdx} className="space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{optGroup.question}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {optGroup.choices.map((choice, cIdx) => (
                                <button
                                  key={cIdx}
                                  onClick={() => sendInterviewMessage(`Elegí: ${choice}`)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-medium border border-indigo-200/60 transition-colors"
                                >
                                  + {choice}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botón de construir cuando la entrevista confirma que el alcance está definido */}
                    {msg.isReadyToBuild && msg.refinedPrompt && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => {
                            setPrompt(msg.refinedPrompt!);
                            setInterviewModalOpen(false);
                            generateFullApp();
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <span>🚀</span> ¡Construir Aplicación Ahora!
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isInterviewLoading && (
                <div className="text-xs text-slate-400 font-mono italic">Santiago está pensando las preguntas técnicas...</div>
              )}
            </div>

            {/* Input de respuesta */}
            <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={interviewInput}
                onChange={(e) => setInterviewInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendInterviewMessage()}
                placeholder="Escribe tu idea o responde a las preguntas..."
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              <button
                onClick={() => sendInterviewMessage()}
                disabled={isInterviewLoading || !interviewInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableWidgetCard({
  comp,
  isSelected,
  metric,
  isLoading,
  onDuplicate,
  onSelect,
  onDelete,
}: {
  comp: DashboardWidget;
  isSelected: boolean;
  metric: MetricResponse | null | undefined;
  isLoading: boolean;
  onDuplicate: () => void;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: comp.id,
  });

  const colSpan = comp.gridPosition?.colSpan || 4;
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
      className={`col-span-12 ${getColSpanClass(colSpan)} relative rounded-lg border bg-white p-5 cursor-pointer transition-all shadow-sm ${
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
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title="Duplicate widget"
            className="text-slate-400 hover:text-slate-700 text-xs p-1"
          >
            ⧉
          </button>
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
                  const x = Math.round((idx / Math.max(1, (metric.points?.length || 2) - 1)) * 200);
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
