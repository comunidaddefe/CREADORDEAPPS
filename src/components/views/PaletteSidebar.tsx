import React from 'react';
import type { ComponentType, DashboardWidget } from '../../types/dashboard';
import { PALETTE_TEMPLATES } from '../../constants/stacks';

interface PaletteSidebarProps {
  onAddComponent: (type: ComponentType, defaultProps: DashboardWidget['props'], defaultColSpan?: number) => void;
  title: string;
  addLabel: string;
}

export function PaletteSidebar({
  onAddComponent,
  title,
  addLabel,
}: PaletteSidebarProps) {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col shrink-0 overflow-y-auto">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {title}
      </h2>
      <div className="flex flex-col gap-2">
        {PALETTE_TEMPLATES.map((item) => (
          <button
            type="button"
            key={`${item.type}-${item.label}`}
            onClick={() => onAddComponent(item.type, item.defaultProps, item.defaultColSpan)}
            aria-label={`Añadir widget ${item.label}`}
            className="group flex flex-col items-start p-3 border border-slate-200 rounded-md hover:border-slate-900 hover:bg-slate-50 transition-all text-left"
          >
            <span className="text-xs font-semibold text-slate-900">{item.label}</span>
            <span className="text-[11px] text-slate-400 font-mono mt-0.5">{item.type}</span>
            <span className="text-[10px] text-slate-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              + {addLabel}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}