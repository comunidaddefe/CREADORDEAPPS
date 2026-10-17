import React from 'react';
import JSZip from 'jszip';
import { Download, Package } from 'lucide-react';
import type { GeneratedProject } from '../../types/dashboard';

interface ProjectWorkspaceProps {
  project: GeneratedProject | null;
  selectedFileIndex: number;
  onSelectFileIndex: (index: number) => void;
  activeTab: 'editor' | 'readme';
  onSelectTab: (tab: 'editor' | 'readme') => void;
  onNotify?: (message: string) => void;
  lang: 'en' | 'es';
}

export function ProjectWorkspace({
  project,
  selectedFileIndex,
  onSelectFileIndex,
  activeTab,
  onSelectTab,
  onNotify,
  lang,
}: ProjectWorkspaceProps) {
  if (!project) {
    return (
      <div className="max-w-xl mx-auto text-center py-24 text-slate-400">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Sin proyecto generado</h3>
        <p className="text-xs text-slate-500">Usa "⚡ Generar App" para crear un proyecto multiarchivo.</p>
      </div>
    );
  }

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(project.runCommand || 'dotnet run');
      onNotify?.('Comando copiado al portapapeles');
    } catch {
      onNotify?.('No se pudo copiar el comando al portapapeles');
    }
  };

  const handleExportManifest = () => {
    const fullDump = JSON.stringify(project, null, 2);
    const blob = new Blob([fullDump], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.appName || 'project'}.manifest.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadProject = async () => {
    const archive = new JSZip();
    project.files.forEach((file) => archive.file(file.path, file.content));
    if (project.readme && !project.files.some((file) => file.path.toLowerCase() === 'readme.md')) {
      archive.file('README.md', project.readme);
    }
    archive.file('appcraft.manifest.json', JSON.stringify(project, null, 2));

    const safeName = (project.appName || 'appcraft-project')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'appcraft-project';
    const blob = await archive.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeName}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    onNotify?.(lang === 'es' ? 'Proyecto descargado como ZIP' : 'Project downloaded as ZIP');
  };

  const handleCopyContent = async () => {
    try {
      const toCopy =
        activeTab === 'editor'
          ? project.files[selectedFileIndex]?.content || ''
          : project.readme || '';
      await navigator.clipboard.writeText(toCopy);
      onNotify?.('Contenido copiado al portapapeles');
    } catch {
      onNotify?.('No se pudo copiar el contenido al portapapeles');
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-4">
      <div className="bg-white border border-slate-200 p-5 rounded-lg flex items-center justify-between shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">{project.appName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{project.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-mono">
            <span>▶</span>
            <span>{project.runCommand || 'dotnet run'}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyCommand}
            className="text-xs border border-slate-300 hover:bg-slate-50 px-2.5 py-1.5 rounded text-slate-700 font-medium"
            title="Copiar comando de ejecución"
          >
            Copiar comando
          </button>
          <button
            type="button"
            onClick={handleDownloadProject}
            className="inline-flex items-center gap-1.5 text-xs bg-[var(--app-green)] hover:bg-[#1d573b] text-white px-3 py-1.5 rounded font-semibold"
            title={lang === 'es' ? 'Descargar todos los archivos del proyecto' : 'Download all project files'}
          >
            <Package size={14} />
            {lang === 'es' ? 'Descargar ZIP' : 'Download ZIP'}
          </button>
          <button
            type="button"
            onClick={handleExportManifest}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1.5 rounded font-medium"
          >
            {lang === 'es' ? 'Manifiesto JSON' : 'JSON manifest'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[580px] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-lg">
        {/* Árbol de Archivos */}
        <div className="col-span-3 bg-slate-950/90 border-r border-slate-800 p-3 overflow-y-auto flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Archivos</span>
            <div className="space-y-1">
              {project.files.map((file, idx) => (
                <button
                  type="button"
                  key={file.path}
                  onClick={() => {
                    onSelectFileIndex(idx);
                    onSelectTab('editor');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs font-mono transition-colors truncate ${
                    selectedFileIndex === idx && activeTab === 'editor'
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  📄 {file.path}
                </button>
              ))}
            </div>
          </div>
          {project.readme && (
            <button
              type="button"
              onClick={() => onSelectTab('readme')}
              className={`w-full text-left px-2.5 py-2 mt-4 rounded text-xs font-sans border transition-colors ${
                activeTab === 'readme'
                  ? 'bg-emerald-950/50 border-emerald-600 text-emerald-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              📖 Guía de Compilación (README)
            </button>
          )}
        </div>

        {/* Visor de Código / README */}
        <div className="col-span-9 flex flex-col overflow-hidden bg-slate-900">
          <div className="h-10 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>{activeTab === 'editor' ? project.files[selectedFileIndex]?.path : 'README.md'}</span>
            <button
              type="button"
              onClick={handleCopyContent}
              className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-0.5 rounded text-[11px] font-sans"
            >
              Copiar contenido
            </button>
          </div>
          <pre className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-100 whitespace-pre leading-relaxed">
            {activeTab === 'editor'
              ? project.files[selectedFileIndex]?.content
              : project.readme}
          </pre>
        </div>
      </div>
    </div>
  );
}