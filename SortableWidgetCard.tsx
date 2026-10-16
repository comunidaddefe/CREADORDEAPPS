import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DashboardWidget, MetricResponse } from './src/types/dashboard';
import { getColSpanClass } from './src/constants/stacks';

interface SortableWidgetCardProps {
  comp: DashboardWidget;
  isSelected: boolean;
  metric: MetricResponse | null | undefined;
  isLoading: boolean;
  onDuplicate: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableWidgetCard({
  comp,
  isSelected,
  metric,
  isLoading,
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

  const renderStatusBadge = () => {
    if (isLoading) return <span className="text-[9px] text-amber-500 font-mono">FETCHING</span>;
    if (!metric) return <span className="text-[9px] text-red-500 font-mono">UNREACHABLE</span>;
    if (metric.status === 'LIVE') return <span className="text-[9px] text-emerald-600 font-mono font-medium">LIVE ({metric.origin})</span>;
    if (metric.status === 'DEMO') return <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.5 rounded font-mono font-semibold">DEMO MODE</span>;
    if (metric.status === 'ERROR') return <span className="text-[9px] bg-red-50 text-red-700 border border-red-200 px-1 py-0.5 rounded font-mono font-semibold">ERROR</span>;
    return <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-mono">NO DATA</span>;
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
      className={`col-span-12 ${getColSpanClass(colSpan)} relative rounded-lg border bg-white p-5 cursor-pointer transition-all shadow-xs ${
        isSelected ? 'border-slate-900 ring-1 ring-slate-900 focus:outline-none' : 'border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400'
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title="Duplicate widget"
            aria-label="Duplicate widget"
            className="text-slate-400 hover:text-slate-700 text-xs p-1"
          >
            ⧉
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete widget"
            aria-label="Delete widget"
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
            <div className="h-24 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
              <span>No series available</span>
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
            <div className="h-24 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
              <span>Empty stream</span>
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
                    <th className="pb-1 font-medium">Key</th>
                    <th className="pb-1 font-medium text-right">Value</th>
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
            <div className="h-20 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
              <span>No connected table source</span>
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
            <div className="h-20 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded text-slate-400 text-xs">
              <span>Empty event stream</span>
              {renderStatusBadge()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}