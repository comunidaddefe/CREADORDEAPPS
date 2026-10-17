import { createRoot } from 'react-dom/client';
import React, { useState, StrictMode } from 'react';
import { Activity, LoaderCircle, Sun, WifiOff } from 'lucide-react';
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
} from '@dnd-kit/sortable';
import type {
  LanguageStack,
  LLMProvider,
  ComponentType,
  DashboardWidget,
  InterviewMessage,
} from './types/dashboard';
import {
  translations,
  DASHBOARD_PRESETS,
  generateId,
} from './constants/stacks';
import { SortableWidgetCard } from './components/SortableWidgetCard';
import { JsonSchemaModal } from './components/modals/JsonSchemaModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { InterviewModal } from './components/modals/InterviewModal';
import { PaletteSidebar } from './components/views/PaletteSidebar';
import { PropertiesPanel } from './components/views/PropertiesPanel';
import { ProjectWorkspace } from './components/views/ProjectWorkspace';
import { CodeSynthesisViewer } from './components/views/CodeSynthesisViewer';
import { TopNavBar } from './components/navigation/TopNavBar';
import { ScaffoldingBar } from './components/navigation/ScaffoldingBar';
import { useDashboardHistory } from './hooks/useDashboardHistory';
import { useTelemetryPolling } from './hooks/useTelemetryPolling';
import { useCodeGeneration } from './hooks/useCodeGeneration';
import './index.css';

export type { LanguageStack, LLMProvider, ComponentType };

function App() {
  const {
    dashboard,
    setDashboard,
    pushToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearDashboard,
    updateWidgetColSpan,
  } = useDashboardHistory();

  const [targetStack, setTargetStack] = useState<LanguageStack>(() => {
    return (localStorage.getItem('appcraft_stack') as LanguageStack) || 'typescript';
  });
  const [provider, setProvider] = useState<LLMProvider>('solusol');
  const [ollamaModel, setOllamaModel] = useState('llama3.2');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'es'>('es');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return localStorage.getItem('appcraft_theme') === 'dark' ? 'dark' : 'light';
  });
  const [viewMode, setViewMode] = useState<'canvas' | 'project' | 'code'>('canvas');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewHistory, setInterviewHistory] = useState<InterviewMessage[]>([]);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [solusolUrl, setSolusolUrl] = useState(() => {
    const stored = localStorage.getItem('appcraft_solusol_url');
    if (stored) {
      try {
        const parsed = new URL(stored);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
          return stored;
        }
      } catch {}
    }
    return 'https://api.solusol.net';
  });

  const { liveMetrics, loadingMetrics } = useTelemetryPolling(dashboard);

  const {
    prompt,
    setPrompt,
    isGenerating,
    isSynthesizing,
    statusMessage,
    setStatusMessage,
    setTransientStatus,
    generatedCode,
    setGeneratedCode,
    generatedProject,
    selectedFileIndex,
    setSelectedFileIndex,
    activeProjectTab,
    setActiveProjectTab,
    generateDashboard,
    generateFullApp,
    synthesizeTargetCode,
  } = useCodeGeneration({
    targetStack,
    provider,
    ollamaModel,
    mediaFiles,
    dashboard,
    onApplyLayout: pushToHistory,
    onSelectWidget: setSelectedId,
    onViewModeChange: setViewMode,
  });

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
    localStorage.setItem('appcraft_stack', targetStack);
  }, [targetStack]);

  React.useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('appcraft_theme', theme);
  }, [theme]);

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
  const liveCount = dashboard.filter((widget) => liveMetrics[widget.id]?.status === 'LIVE').length;
  const demoCount = dashboard.filter((widget) => liveMetrics[widget.id]?.status === 'DEMO').length;
  const errorCount = dashboard.filter((widget) => liveMetrics[widget.id]?.status === 'ERROR').length;
  const loadingCount = dashboard.filter((widget) => loadingMetrics[widget.id]).length;
  const isConnecting = loadingCount > 0 && liveCount + demoCount === 0;
  const isFullyLive = dashboard.length > 0 && liveCount === dashboard.length;
  const hasSomeData = liveCount + demoCount > 0;
  const connectionLabel = dashboard.length === 0
    ? (lang === 'es' ? 'LISTO PARA EMPEZAR' : 'READY TO START')
    : isConnecting
      ? (lang === 'es' ? 'COMPROBANDO CONEXIÓN' : 'CHECKING CONNECTION')
      : isFullyLive
        ? (lang === 'es' ? 'TODO CONECTADO' : 'ALL CONNECTED')
        : hasSomeData
          ? (lang === 'es' ? 'DATOS PARCIALES' : 'PARTIAL DATA')
          : errorCount > 0
            ? (lang === 'es' ? 'REVISAR ACCESO A DATOS' : 'CHECK DATA ACCESS')
            : (lang === 'es' ? 'SIN CONEXIÓN' : 'OFFLINE');
  const latestMetricTime = dashboard
    .map((widget) => liveMetrics[widget.id]?.updatedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const latestMetricLabel = latestMetricTime
    ? new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(latestMetricTime)
    : null;

  const sendInterviewMessage = async (textToSend?: string) => {
    const msg = textToSend?.trim();
    if (!msg || isInterviewLoading) return;

    const userMsg: InterviewMessage = { sender: 'user', text: msg };
    const nextHistory = [...interviewHistory, userMsg];
    setInterviewHistory(nextHistory);
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

      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        throw new Error(`HTTP ${res.status}: Respuesta no procesable del servidor`);
      }

      if (res.ok) {
        const santiagoMsg: InterviewMessage = {
          sender: 'santiago',
          text: (typeof data.reply === 'string' && data.reply) || 'Entendido.',
          questions: data.questions as string[] | undefined,
          options: data.options as Array<{ question: string; choices: string[] }> | undefined,
          isReadyToBuild: Boolean(data.isReadyToBuild),
          refinedPrompt: data.refinedPrompt as string | undefined,
        };
        setInterviewHistory([...nextHistory, santiagoMsg]);
      } else {
        throw new Error((data.error as string) || `Error HTTP ${res.status} en la entrevista`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido en la entrevista';
      setInterviewHistory([
        ...nextHistory,
        { sender: 'santiago', text: `Lo siento, hubo un problema: ${errorMsg}` },
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
    clearDashboard();
    setSelectedId(null);
    setGeneratedCode('');
    setStatusMessage(null);
  };

  return (
    <div className="min-h-screen bg-[var(--app-canvas)] text-slate-800 flex flex-col font-sans">
      {/* Top Bar Contract (3-Zone Header) */}
      <TopNavBar
        title={t('title')}
        badge={t('badge')}
        provider={provider}
        hasReferenceFiles={mediaFiles.length > 0}
        onProviderChange={setProvider}
        ollamaModel={ollamaModel}
        onOllamaModelChange={setOllamaModel}
        targetStack={targetStack}
        onTargetStackChange={setTargetStack}
        onLoadPreset={loadPreset}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSynthesizeCode={synthesizeTargetCode}
        hasGeneratedCode={Boolean(generatedCode)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        lang={lang}
        onToggleLang={() => setLang(lang === 'en' ? 'es' : 'en')}
        theme={theme}
        onThemeChange={setTheme}
        isSynthesizing={isSynthesizing}
        hasWidgets={dashboard.length > 0}
        onOpenJsonModal={() => setJsonModalOpen(true)}
        onClear={handleClear}
        labels={{
          viewCanvas: t('viewCanvas'),
          viewCode: t('viewCode'),
          exportCode: t('exportCode'),
          clear: t('clear'),
        }}
      />

      {/* Scaffolding Bar */}
      {!isPreviewMode && (
        <ScaffoldingBar
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerateDashboard={generateDashboard}
          onGenerateFullApp={generateFullApp}
          onOpenInterview={() => {
            setInterviewModalOpen(true);
            if (prompt.trim() && interviewHistory.length === 0) {
              sendInterviewMessage(prompt);
            }
          }}
          mediaFiles={mediaFiles}
          onMediaFilesChange={(files) => {
            setMediaFiles(files);
            if (files.length > 0 && provider === 'ollama') setProvider('solusol');
          }}
          isGenerating={isGenerating}
          lang={lang}
          placeholder={t('placeholder')}
          generatingLabel={t('generating')}
          generateLabel={t('generate')}
          statusMessage={statusMessage}
        />
      )}

      {/* Workspace Tripartite Layout */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-auto md:overflow-hidden">
        {/* Left: Component Palette */}
        {!isPreviewMode && (
          <PaletteSidebar
            onAddComponent={addComponent}
            title={t('palette')}
            addLabel={t('add')}
            lang={lang}
          />
        )}

        {/* Center: Canvas or Polyglot Target Code */}
        <main className="canvas-stage flex-1 min-w-0 min-h-[420px] overflow-y-auto p-3 sm:p-4 md:p-5 xl:p-7">
          {viewMode === 'canvas' ? (
            <div className="max-w-6xl mx-auto">
              <section className="workspace-enter flex flex-wrap items-center justify-between gap-4 mb-6 px-1">
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 rounded-lg bg-[var(--app-ink)] text-[var(--app-lime)] flex items-center justify-center shadow-sm">
                    <Sun size={21} />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.12em] text-emerald-800 uppercase">{lang === 'es' ? 'ENERGÍA SOLAR' : 'SOLAR ENERGY'}</p>
                    <h1 className="text-lg font-bold text-[var(--app-text-strong)]">{lang === 'es' ? 'Parque solar SoluSol' : 'SoluSol solar park'}</h1>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-[var(--app-line)] bg-white/90 px-3 py-2 shadow-sm" role="status" aria-live="polite">
                  <span className={`w-8 h-8 rounded-md flex items-center justify-center ${isFullyLive ? 'bg-emerald-100 text-emerald-800' : isConnecting ? 'bg-amber-100 text-amber-800' : 'bg-rose-50 text-rose-700'}`}>
                    {isConnecting ? <LoaderCircle size={16} className="animate-spin" /> : isFullyLive ? <Activity size={16} /> : <WifiOff size={16} />}
                  </span>
                  <span>
                    <span className="block text-[10px] font-bold tracking-wide text-slate-500">{connectionLabel}</span>
                    <span className="block text-xs font-semibold text-[var(--app-text-strong)]">
                      {liveCount}/{dashboard.length} {lang === 'es' ? 'fuentes activas' : 'active sources'}
                      {demoCount > 0 && <span className="ml-2 text-amber-700">· {demoCount} demo</span>}
                    </span>
                  </span>
                  {latestMetricLabel && <span className="hidden sm:block border-l border-slate-200 pl-3 text-[10px] font-mono text-slate-500">{lang === 'es' ? 'ACTUALIZADO' : 'UPDATED'} {latestMetricLabel}</span>}
                </div>
              </section>
              {dashboard.length === 0 ? (
                <div className="h-96 flex flex-col items-center justify-center border border-dashed border-emerald-300 rounded-lg bg-white/70 text-slate-500 p-8 text-center">
                  <span className="w-14 h-14 flex items-center justify-center rounded-xl bg-amber-100 text-amber-800 mb-4"><Sun size={24} /></span>
                  <p className="text-base font-semibold text-[var(--app-text-strong)]">{lang === 'es' ? 'Empecemos por lo importante' : 'Start with what matters'}</p>
                  <p className="text-sm mt-1">{lang === 'es' ? 'Describe lo que quieres seguir o añade un widget desde la izquierda.' : 'Describe what you want to track or add a widget from the left.'}</p>
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
                          lang={lang}
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
            <ProjectWorkspace
              project={generatedProject}
              selectedFileIndex={selectedFileIndex}
              onSelectFileIndex={setSelectedFileIndex}
              activeTab={activeProjectTab}
              onSelectTab={setActiveProjectTab}
              lang={lang}
              onNotify={(msg) => setTransientStatus(msg, 2000)}
            />
          ) : (
            <CodeSynthesisViewer
              targetStack={targetStack}
              provider={provider}
              ollamaModel={ollamaModel}
              code={generatedCode}
              lang={lang}
              onNotify={(msg) => setTransientStatus(msg, 2000)}
            />
          )}
        </main>

        {/* Right: Properties Panel */}
        {!isPreviewMode && (
          <PropertiesPanel
            selectedWidget={selectedWidget}
            onUpdateProps={updateSelectedProps}
            onUpdateColSpan={(span) => {
              if (selectedWidget) updateWidgetColSpan(selectedWidget.id, span);
            }}
            onDelete={(id) => {
              setDashboard(dashboard.filter((c) => c.id !== id));
              setSelectedId(null);
            }}
            labels={{
              properties: t('properties'),
              propTitle: t('propTitle'),
              propDataSource: t('propDataSource'),
              propValue: t('propValue'),
              delete: t('delete'),
              selectToEdit: t('selectToEdit'),
            }}
            lang={lang}
          />
        )}
      </div>

      <JsonSchemaModal
        isOpen={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
        dashboard={dashboard}
        onApply={pushToHistory}
        onNotify={(msg) => {
          setTransientStatus(msg, 2500);
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        initialUrl={solusolUrl}
        onSave={(newUrl) => {
          setSolusolUrl(newUrl);
          localStorage.setItem('appcraft_solusol_url', newUrl);
          setTransientStatus('SoluSol settings updated', 2500);
        }}
      />

      <InterviewModal
        isOpen={interviewModalOpen}
        onClose={() => setInterviewModalOpen(false)}
        targetStack={targetStack}
        history={interviewHistory}
        isLoading={isInterviewLoading}
        onSendMessage={sendInterviewMessage}
        onBuild={(refinedPrompt) => {
          setPrompt(refinedPrompt);
          setInterviewModalOpen(false);
          generateFullApp(refinedPrompt);
        }}
      />
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
