import {createRoot} from 'react-dom/client';
import React, { useState } from 'react';
import './index.css';

const translations = {
  en: { title: "AppCraft AI Builder", generate: "Generate", placeholder: "Describe your dashboard...", export: "Export", clear: "Clear", lang: "EN" },
  es: { title: "Constructor AI AppCraft", generate: "Generar", placeholder: "Describe tu dashboard...", export: "Exportar", clear: "Limpiar", lang: "ES" }
};

function App() {
  const [dashboard, setDashboard] = useState<any[]>(() => {
    const saved = localStorage.getItem('dashboard');
    return saved ? JSON.parse(saved) : [];
  });
  const [prompt, setPrompt] = useState('');
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const t = (key: keyof typeof translations.en) => translations[lang][key];

  React.useEffect(() => {
    localStorage.setItem('dashboard', JSON.stringify(dashboard));
  }, [dashboard]);

  const generateDashboard = async () => {
    const response = await fetch('/api/generate-dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await response.json();
    setDashboard(data);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(dashboard, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setDashboard([]);
    localStorage.removeItem('dashboard');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between gap-8 px-8 py-6 border-b border-slate-100">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap shrink-0">{t('title')}</h1>
        
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <button onClick={() => setLang(lang === 'en' ? 'es' : 'en')} className="hover:text-slate-900 transition-colors">{t('lang')}</button>
          <button onClick={handleExport} className="hover:text-slate-900 transition-colors">{t('export')}</button>
          <button onClick={handleClear} className="hover:text-red-600 transition-colors">{t('clear')}</button>
        </nav>
      </header>
      
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12 flex gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('placeholder')}
            className="flex-1 p-3 border border-slate-200 rounded-lg"
          />
          <button onClick={generateDashboard} className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
            {t('generate')}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dashboard.map((comp) => (
            <div key={comp.id} className="group relative border-b border-slate-100 pb-6">
              <button
                onClick={() => setDashboard(dashboard.filter((c) => c.id !== comp.id))}
                className="absolute top-0 right-0 p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Delete
              </button>
              <h3 className="text-lg font-semibold text-slate-900">{comp.props.title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span>{comp.type}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-mono">{comp.id.substring(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
