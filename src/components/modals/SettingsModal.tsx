import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl: string;
  onSave: (url: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  initialUrl,
  onSave,
}: SettingsModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUrl(initialUrl);
    setError(null);
  }, [initialUrl, isOpen]);

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

  const handleSave = () => {
    const trimmed = url.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('El protocolo debe ser http:// o https://');
        return;
      }
    } catch {
      setError('Por favor ingresa una URL válida (ej. https://api.solusol.net)');
      return;
    }
    onSave(trimmed);
    onClose();
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 id="settings-modal-title" className="text-sm font-semibold text-slate-900">SoluSol Cloud Settings</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar modal" className="text-slate-400 hover:text-slate-700 text-sm">✕</button>
        </div>
        {error && <div className="mb-3 text-red-600 text-xs font-medium">{error}</div>}
        <div className="space-y-4 text-xs">
          <div>
            <label htmlFor="upstream-api-url" className="block text-slate-600 font-medium mb-1">Upstream API URL</label>
            <input
              id="upstream-api-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.solusol.net"
              className="w-full px-3 py-2 border border-slate-200 rounded font-mono"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 text-xs">
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-slate-500 hover:text-slate-800">
            Cancel
          </button>
          <button type="button" onClick={handleSave} className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}