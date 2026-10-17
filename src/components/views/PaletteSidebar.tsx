import React from 'react';
import { Activity, BarChart3, LineChart, List, Plus, Sun, Table2 } from 'lucide-react';
import type { ComponentType, DashboardWidget } from '../../types/dashboard';
import { PALETTE_TEMPLATES } from '../../constants/stacks';

interface PaletteSidebarProps {
  onAddComponent: (type: ComponentType, defaultProps: DashboardWidget['props'], defaultColSpan?: number) => void;
  title: string;
  addLabel: string;
  lang: 'en' | 'es';
}

export function PaletteSidebar({
  onAddComponent,
  title,
  addLabel,
  lang,
}: PaletteSidebarProps) {
  const icons = { stat: Activity, bar_chart: BarChart3, line_chart: LineChart, table: Table2, list: List };
  const spanishLabels: Record<string, string> = {
    'Stat Metric': 'Indicador',
    'Bar Chart': 'Gráfico de barras',
    'Trend Graph': 'Tendencia',
    'Data Table': 'Tabla de datos',
    'Stream Feed': 'Avisos recientes',
    'SoluSol Power (Live)': 'Potencia solar',
    'SoluSol Generation': 'Generación solar',
  };
  const spanishTitles: Record<string, string> = {
    'Annual Recurring Revenue': 'Ingresos recurrentes anuales',
    'Monthly Revenue': 'Ingresos mensuales',
    'Daily Active Users': 'Usuarios activos diarios',
    'Recent Orders': 'Últimos pedidos',
    'System Alerts': 'Alertas del sistema',
    'Active Power (kW)': 'Potencia activa (kW)',
    'Solar Output (kWh)': 'Generación solar (kWh)',
  };
  const kindLabels = lang === 'es'
    ? { stat: 'Valor destacado', bar_chart: 'Comparación por periodos', line_chart: 'Evolución en el tiempo', table: 'Datos en tabla', list: 'Alertas y eventos' }
    : { stat: 'Key figure', bar_chart: 'Period comparison', line_chart: 'Trend over time', table: 'Tabular data', list: 'Alerts and events' };

  return (
    <aside className="palette-sidebar w-full md:w-56 xl:w-64 border-r border-[var(--app-line)] bg-white p-3 xl:p-4 flex flex-col shrink-0 overflow-y-auto max-h-56 md:max-h-none">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-bold text-[var(--app-green)] uppercase tracking-wide">
          {title}
        </h2>
        <span className="text-[10px] font-mono text-slate-400">{PALETTE_TEMPLATES.length} {lang === 'es' ? 'disponibles' : 'available'}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
        {PALETTE_TEMPLATES.map((item) => (
          <button
            type="button"
            key={`${item.type}-${item.label}`}
            onClick={() => onAddComponent(
              item.type,
              lang === 'es'
                ? { ...item.defaultProps, title: spanishTitles[item.defaultProps.title] || item.defaultProps.title }
                : item.defaultProps,
              item.defaultColSpan
            )}
            aria-label={`${lang === 'es' ? 'Añadir widget' : 'Add widget'} ${lang === 'es' ? spanishLabels[item.label] || item.label : item.label}`}
            title={addLabel}
            className="group flex items-center gap-2.5 min-h-[62px] p-2.5 border border-slate-200 rounded-md bg-white hover:border-emerald-600 hover:bg-emerald-50/40 hover:shadow-sm transition-all text-left"
          >
            <span className={`w-9 h-9 shrink-0 rounded-md flex items-center justify-center ${item.label.includes('SoluSol') ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {item.label.includes('SoluSol') ? <Sun size={17} /> : React.createElement(icons[item.type], { size: 17 })}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold leading-snug text-slate-800">{lang === 'es' ? spanishLabels[item.label] || item.label : item.label}</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">{kindLabels[item.type]}</span>
            </span>
            <span className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-[var(--app-lime)] group-hover:text-[var(--app-ink)] transition-colors" aria-hidden="true">
              <Plus size={14} />
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}