import React from 'react';
import { Activity, AlertCircle, Copy, GripVertical, LoaderCircle, Trash2, WifiOff } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DashboardWidget, MetricResponse } from '../types/dashboard';
import { getColSpanClass } from '../constants/stacks';

interface SortableWidgetCardProps {
  comp: DashboardWidget;
  isSelected: boolean;
  metric: MetricResponse | null | undefined;
  isLoading: boolean;
  lang: 'en' | 'es';
  onDuplicate: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableWidgetCard({
  comp,
  isSelected,
  metric,
  isLoading,
  lang,
  onDuplicate,
  onSelect,
  onDelete,
}: SortableWidgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: comp.id,
  });

  const colSpan = comp.gridPosition?.colSpan || 4;
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const t = (english: string, spanish: string) => lang === 'es' ? spanish : english;
  const metricValue = metric?.value ?? (metric?.status === 'DEMO' ? comp.props.value : undefined);

  const renderStatusBadge = () => {
    if (isLoading) return <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-mono"><LoaderCircle size={12} className="animate-spin" />{t('CONNECTING', 'CONECTANDO')}</span>;
    if (!metric) return <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-mono"><WifiOff size={12} />{t('OFFLINE', 'SIN CONEXIÓN')}</span>;
    if (metric.status === 'LIVE') return <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-mono font-semibold"><Activity size={12} />{t('LIVE', 'EN VIVO')} · {metric.origin}</span>;
    if (metric.status === 'DEMO') return <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-mono font-semibold"><AlertCircle size={12} />{t('DEMO DATA', 'DATOS DEMO')}</span>;
    if (metric.status === 'ERROR') return <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-mono font-semibold"><AlertCircle size={12} />{t('SOURCE ERROR', 'ERROR DE FUENTE')}</span>;
    return <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-mono"><WifiOff size={12} />{t('NO DATA', 'SIN DATOS')}</span>;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-selected={isSelected}
      className={`workspace-enter min-w-0 col-span-1 ${getColSpanClass(colSpan)} relative rounded-md border bg-white p-5 cursor-pointer transition-all shadow-[0_3px_12px_rgba(24,53,43,0.045)] ${
        isSelected ? 'border-emerald-700 ring-2 ring-emerald-700/15 focus:outline-none' : 'border-slate-200 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-700/15'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <button
            type="button"
            aria-label={t('Drag widget', 'Mover widget')}
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-emerald-800 p-1 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={15} />
          </button>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-slate-900" title={comp.props.title}>{comp.props.title}</h3>
            <span className="block text-[11px] text-slate-400 font-mono truncate">{comp.props.data_source}</span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title={t('Duplicate widget', 'Duplicar widget')}
            aria-label={t('Duplicate widget', 'Duplicar widget')}
            className="w-8 h-8 inline-flex items-center justify-center rounded text-slate-400 hover:bg-emerald-50 hover:text-emerald-800"
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title={t('Delete widget', 'Eliminar widget')}
            aria-label={t('Delete widget', 'Eliminar widget')}
            className="w-8 h-8 inline-flex items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {comp.type === 'stat' ? (
        <div className="mt-4 pt-2 border-t border-slate-100">
          <div className="text-3xl font-bold text-slate-900 tabular-nums">
            {metricValue || '—'}
          </div>
          <div className="text-[11px] mt-1 flex items-center justify-between">
            {renderStatusBadge()}
            {metric?.unit && <span className="text-[10px] text-slate-400 font-mono">{metric.unit}</span>}
          </div>
        </div>
      ) : comp.type === 'bar_chart' ? (
        <div className="mt-4 pt-2 border-t border-slate-100">
          {metric?.series && metric.series.length > 0 ? (
            <div className="h-24 flex items-end gap-2 px-1">
              {metric.series.map((item, idx) => {
                const clampedValue = Math.max(0, Math.min(100, Number(item.value) || 0));
                return (
                  <div key={`${item.label}-${idx}`} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-slate-800 rounded-t transition-all" style={{ height: `${clampedValue}%` }} />
                    <span className="text-[9px] text-slate-400 font-mono truncate max-w-full">{item.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-24 flex flex-col items-center justify-center bg-[var(--app-canvas)] border border-dashed border-[var(--app-line)] rounded text-slate-500 text-xs">
              <span>{isLoading ? t('Waiting for telemetry', 'Esperando telemetría') : t('Check this data source', 'Revisa esta fuente de datos')}</span>
              {renderStatusBadge()}
            </div>
          )}
        </div>
      ) : comp.type === 'line_chart' ? (
        <div className="mt-4 pt-2 border-t border-slate-100">
          {metric?.points && metric.points.length > 0 ? (
            <svg viewBox="0 0 200 60" className="w-full h-24 stroke-slate-800 fill-none" preserveAspectRatio="none">
              <path
                d={metric.points.reduce((acc, p, idx) => {
                  const clampedP = Math.max(0, Math.min(100, Number(p) || 0));
                  const totalPoints = metric.points?.length ?? 1;
                  const x = totalPoints <= 1 
                    ? 100 
                    : Math.round((idx / (totalPoints - 1)) * 200);
                  const y = Math.round(55 - (clampedP / 100) * 45);
                  return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                }, '')}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <div className="h-24 flex flex-col items-center justify-center bg-[var(--app-canvas)] border border-dashed border-[var(--app-line)] rounded text-slate-500 text-xs">
              <span>{isLoading ? t('Waiting for telemetry', 'Esperando telemetría') : t('No readings in this period', 'Sin lecturas en este periodo')}</span>
              {renderStatusBadge()}
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
                    <th className="pb-1 font-medium">{t('Key', 'Dato')}</th>
                    <th className="pb-1 font-medium text-right">{t('Value', 'Valor')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {metric.rows.map((row, idx) => {
                    const displayVal = typeof row.value === 'object' && row.value !== null
                      ? JSON.stringify(row.value)
                      : String(row.value ?? '');
                    return (
                      <tr key={`${row.key}-${idx}`}>
                        <td className="py-1 truncate pr-2 font-mono text-[10px]">{row.key}</td>
                        <td className="py-1 text-right font-mono text-slate-900 text-[10px] truncate max-w-[120px]">{displayVal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-20 flex flex-col items-center justify-center bg-[var(--app-canvas)] border border-dashed border-[var(--app-line)] rounded text-slate-500 text-xs">
              <span>{isLoading ? t('Waiting for telemetry', 'Esperando telemetría') : t('No table data available', 'Sin datos de tabla')}</span>
              {renderStatusBadge()}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 pt-2 border-t border-slate-100">
          {metric?.items && metric.items.length > 0 ? (
            <div className="max-h-28 overflow-y-auto space-y-1.5">
              {metric.items.map((item, idx) => (
                <div key={item.id ?? idx} className="text-[11px] flex items-center justify-between text-slate-700 bg-slate-50 px-2 py-1 rounded">
                  <span className="truncate pr-2">{item.text}</span>
                  <span className="text-[9px] text-emerald-600 font-mono font-medium">{item.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-20 flex flex-col items-center justify-center bg-[var(--app-canvas)] border border-dashed border-[var(--app-line)] rounded text-slate-500 text-xs">
              <span>{isLoading ? t('Waiting for telemetry', 'Esperando telemetría') : t('No events received', 'No se recibieron eventos')}</span>
              {renderStatusBadge()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}