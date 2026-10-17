import React from 'react';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import type { DashboardWidget } from '../../types/dashboard';

interface PropertiesPanelProps {
  selectedWidget: DashboardWidget | undefined;
  onUpdateProps: (patch: Partial<DashboardWidget['props']>) => void;
  onUpdateColSpan: (span: number) => void;
  onDelete: (id: string) => void;
  labels: {
    properties: string;
    propTitle: string;
    propDataSource: string;
    propValue: string;
    delete: string;
    selectToEdit: string;
  };
  lang: 'en' | 'es';
}

const GRID_PRESETS = [
  { label: '1/4 (3)', span: 3 },
  { label: '1/3 (4)', span: 4 },
  { label: '1/2 (6)', span: 6 },
  { label: '2/3 (8)', span: 8 },
  { label: 'Full (12)', span: 12 },
];

export function PropertiesPanel({
  selectedWidget,
  onUpdateProps,
  onUpdateColSpan,
  onDelete,
  labels,
  lang,
}: PropertiesPanelProps) {
  return (
    <aside className="properties-sidebar w-full md:w-60 xl:w-72 border-l border-[var(--app-line)] bg-white p-4 xl:p-5 flex flex-col shrink-0 overflow-y-auto max-h-64 md:max-h-none">
      <div className="flex items-center gap-2 mb-4">
        <SlidersHorizontal size={15} className="text-[var(--app-green)]" />
        <h2 className="text-[11px] font-bold text-[var(--app-green)] uppercase tracking-wide">
          {labels.properties}
        </h2>
      </div>
      {selectedWidget ? (
        <div className="flex flex-col gap-4 text-xs">
          <div className="rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">{selectedWidget.type.replace('_', ' ')}</span>
            <p className="text-[11px] text-emerald-700 mt-0.5 truncate">{selectedWidget.props.data_source}</p>
          </div>
          <div>
            <label htmlFor="widget-title" className="block text-slate-600 mb-1 font-medium">{labels.propTitle}</label>
            <input
              id="widget-title"
              type="text"
              value={selectedWidget.props.title}
              onChange={(e) => onUpdateProps({ title: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-medium">Grid Width (1-12)</label>
              <span className="font-mono text-slate-900 font-semibold">
                {selectedWidget.gridPosition?.colSpan || 4} cols
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 text-[11px] font-mono" role="group" aria-label="Grid Width presets">
              {GRID_PRESETS.map((preset) => (
                <button
                  key={preset.span}
                  type="button"
                  onClick={() => onUpdateColSpan(preset.span)}
                  aria-pressed={(selectedWidget.gridPosition?.colSpan || 4) === preset.span}
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
            <label htmlFor="widget-datasource" className="block text-slate-600 mb-1 font-medium">{labels.propDataSource}</label>
            <input
              id="widget-datasource"
              type="text"
              value={selectedWidget.props.data_source}
              onChange={(e) => onUpdateProps({ data_source: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {selectedWidget.type === 'stat' && (
            <div>
              <label htmlFor="widget-value" className="block text-slate-600 mb-1 font-medium">{labels.propValue}</label>
              <input
                id="widget-value"
                type="text"
                value={selectedWidget.props.value || ''}
                onChange={(e) => onUpdateProps({ value: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[11px] text-slate-400 font-mono">ID: {selectedWidget.id}</span>
            <button
              type="button"
              onClick={() => onDelete(selectedWidget.id)}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              {labels.delete}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center rounded-md border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8">
          <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
            <Sparkles size={17} />
          </span>
          <p className="text-xs font-semibold text-slate-700">{labels.selectToEdit}</p>
          <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{lang === 'es' ? 'Ajusta el nombre, el origen de datos y el espacio que ocupa.' : 'Adjust its name, data source, and layout.'}</p>
        </div>
      )}
    </aside>
  );
}