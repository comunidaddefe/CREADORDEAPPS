import React, { useState, useEffect } from 'react';
import type { DashboardWidget } from '../../types/dashboard';

interface JsonSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: DashboardWidget[];
  onApply: (widgets: DashboardWidget[]) => void;
  onNotify?: (message: string) => void;
}

export function JsonSchemaModal({
  isOpen,
  onClose,
  dashboard,
  onApply,
  onNotify,
}: JsonSchemaModalProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJsonInput(JSON.stringify(dashboard, null, 2));
      setErrorMessage(null);
    }
  }, [isOpen, dashboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonInput);
      onNotify?.('JSON copied to clipboard');
    } catch {
      onNotify?.('No se pudo copiar el JSON al portapapeles');
    }
  };

  const handleApply = () => {
    try {
      const parsed: unknown = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) {
        setErrorMessage('El JSON debe ser un array de widgets válido.');
        return;
      }
      const isValid = parsed.every(
        (item) => typeof item === 'object' && item !== null && 'id' in item && 'type' in item
      );
      if (!isValid) {
        setErrorMessage('Cada elemento debe contener al menos las propiedades "id" y "type".');
        return;
      }
      onApply(parsed as DashboardWidget[]);
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error de sintaxis JSON';
      setErrorMessage(`JSON Inválido: ${msg}`);
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="json-schema-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 id="json-schema-modal-title" className="text-sm font-semibold text-slate-900">Dashboard JSON Schema</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar modal" className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
        </div>
        {errorMessage && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {errorMessage}
          </div>
        )}
        <textarea
          rows={14}
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-900 mb-4 leading-relaxed"
        />
        <div className="flex justify-between items-center text-xs">
          <div className="flex gap-2">
            <button type="button" onClick={handleCopy} className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded text-slate-700">
              Copy JSON
            </button>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 text-slate-500 hover:text-slate-800">
              Cancel
            </button>
            <button type="button" onClick={handleApply} className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium">
              Apply JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}