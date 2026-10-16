import React from 'react';
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
}: PropertiesPanelProps) {
  return (
    <aside className="w-72 border-l border-slate-200 bg-white p-5 flex flex-col shrink-0 overflow-y-auto">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        {labels.properties}
      </h2>
      {selectedWidget ? (
        <div className="flex flex-col gap-4 text-xs">
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
        <p className="text-xs text-slate-400 leading-relaxed">
          {labels.selectToEdit}
        </p>
      )}
    </aside>
  );
}