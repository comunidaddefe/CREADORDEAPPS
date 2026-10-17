import type { LanguageStack, DashboardWidget, ComponentType } from '../types/dashboard';

export const STACK_CATEGORIES: { name: string; stacks: { id: LanguageStack; label: string }[] }[] = [
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

export const translations = {
  en: {
    title: "AppCraft",
    badge: "WORKSPACE",
    generate: "Build dashboard",
    generating: "Generating...",
    placeholder: "Describe your dashboard (e.g., E-commerce sales overview with ARR metric and transactions)...",
    exportCode: "Prepare code",
    clear: "Clear dashboard",
    palette: "Widgets",
    properties: "Widget settings",
    selectToEdit: "Choose a widget to edit its settings.",
    viewCanvas: "Dashboard",
    viewCode: "Code",
    propTitle: "Name",
    propDataSource: "Data source",
    propValue: "Sample value",
    delete: "Remove",
    add: "Add widget",
    engine: "LLM Engine",
    ollamaModel: "Local Model",
  },
  es: {
    title: "AppCraft",
    badge: "ESPACIO DE TRABAJO",
    generate: "Crear panel",
    generating: "Generando...",
    placeholder: "¿Qué te gustaría seguir? Por ejemplo: energía diaria y estado de los inversores.",
    exportCode: "Preparar código",
    clear: "Vaciar panel",
    palette: "Widgets",
    properties: "Ajustes del widget",
    selectToEdit: "Elige un widget del panel para editarlo.",
    viewCanvas: "Panel",
    viewCode: "Código",
    propTitle: "Nombre",
    propDataSource: "Origen de datos",
    propValue: "Valor de muestra",
    delete: "Quitar",
    add: "Añadir widget",
    engine: "Motor LLM",
    ollamaModel: "Modelo Local",
  },
};

export const DASHBOARD_PRESETS: Record<string, { label: string; widgets: DashboardWidget[] }> = {
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

export const PALETTE_TEMPLATES: Array<{ type: ComponentType; label: string; defaultColSpan: number; defaultProps: DashboardWidget['props'] }> = [
  { type: 'stat', label: 'Stat Metric', defaultColSpan: 3, defaultProps: { title: 'Annual Recurring Revenue', value: '$840,200', data_source: 'analytics.arr' } },
  { type: 'bar_chart', label: 'Bar Chart', defaultColSpan: 6, defaultProps: { title: 'Monthly Revenue', data_source: 'metrics.monthly_rev' } },
  { type: 'line_chart', label: 'Trend Graph', defaultColSpan: 6, defaultProps: { title: 'Daily Active Users', data_source: 'telemetry.dau' } },
  { type: 'table', label: 'Data Table', defaultColSpan: 12, defaultProps: { title: 'Recent Orders', data_source: 'orders.table' } },
  { type: 'list', label: 'Stream Feed', defaultColSpan: 6, defaultProps: { title: 'System Alerts', data_source: 'logs.stream' } },
  { type: 'stat', label: 'SoluSol Power (Live)', defaultColSpan: 3, defaultProps: { title: 'Active Power (kW)', value: '142.8 kW', data_source: 'solusol.telemetry.power' } },
  { type: 'bar_chart', label: 'SoluSol Generation', defaultColSpan: 6, defaultProps: { title: 'Solar Output (kWh)', data_source: 'solusol.generation.daily' } },
];

export const COL_SPAN_CLASSES: Record<number, string> = {
  1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
  5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 8: 'md:col-span-8',
  9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12',
};

export const DEFAULT_WIDGETS: DashboardWidget[] = DASHBOARD_PRESETS.solar.widgets;

export function getColSpanClass(colSpan: number = 4) {
  const span = Math.min(12, Math.max(1, colSpan));
  return COL_SPAN_CLASSES[span] || 'md:col-span-4';
}

export function generateId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cmp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}