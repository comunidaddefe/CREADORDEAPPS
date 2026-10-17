import React, { useEffect, useRef, useState } from 'react';
import { Eye, FileImage, Film, ImagePlus, MessageSquareText, X, Zap } from 'lucide-react';

interface ScaffoldingBarProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerateDashboard: () => void;
  onGenerateFullApp: () => void;
  onOpenInterview: () => void;
  mediaFiles: File[];
  onMediaFilesChange: (files: File[]) => void;
  isGenerating: boolean;
  lang: 'en' | 'es';
  placeholder: string;
  generatingLabel: string;
  generateLabel: string;
  statusMessage?: string | null;
}

export function ScaffoldingBar({
  prompt,
  onPromptChange,
  onGenerateDashboard,
  onGenerateFullApp,
  onOpenInterview,
  mediaFiles,
  onMediaFilesChange,
  isGenerating,
  lang,
  placeholder,
  generatingLabel,
  generateLabel,
  statusMessage,
}: ScaffoldingBarProps) {
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(previewFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewFile]);

  useEffect(() => {
    if (!previewFile) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewFile(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [previewFile]);

  const handleMediaSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    const nextFiles = [...mediaFiles];
    let error: string | null = null;

    for (const file of selectedFiles) {
      const isSupported = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(file.type);
      if (!isSupported) {
        error = lang === 'es' ? 'Usa imágenes JPG, PNG o WebP y videos MP4 o WebM.' : 'Use JPG, PNG, or WebP images and MP4 or WebM videos.';
        continue;
      }
      if (file.size > 6 * 1024 * 1024) {
        error = lang === 'es' ? `${file.name} supera el límite de 6 MB.` : `${file.name} exceeds the 6 MB limit.`;
        continue;
      }
      if (nextFiles.length >= 4) {
        error = lang === 'es' ? 'Puedes adjuntar hasta 4 referencias.' : 'You can attach up to 4 references.';
        break;
      }
      const totalBytes = nextFiles.reduce((total, current) => total + current.size, file.size);
      if (totalBytes > 12 * 1024 * 1024) {
        error = lang === 'es' ? 'El total de referencias no puede superar 12 MB.' : 'References cannot exceed 12 MB in total.';
        continue;
      }
      nextFiles.push(file);
    }

    onMediaFilesChange(nextFiles);
    setMediaError(error);
  };

  const removeMediaFile = (fileToRemove: File) => {
    onMediaFilesChange(mediaFiles.filter((file) => file !== fileToRemove));
    setMediaError(null);
  };

  const formatFileSize = (bytes: number) => bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="border-b border-[var(--app-line)] bg-white px-4 xl:px-6 py-3 shrink-0">
      <div className="max-w-6xl mx-auto flex flex-wrap xl:flex-nowrap gap-2.5">
        <input
          type="text"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isGenerating && prompt.trim()) {
              onGenerateDashboard();
            }
          }}
          aria-label={lang === 'es' ? 'Describe el panel que necesitas' : 'Describe the dashboard you need'}
          placeholder={placeholder}
          className="basis-full sm:basis-auto min-w-0 sm:min-w-[220px] flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 placeholder:text-slate-400"
        />
        <input
          ref={mediaInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          multiple
          className="sr-only"
          aria-label={lang === 'es' ? 'Seleccionar imágenes o videos de referencia' : 'Select reference images or videos'}
          onChange={handleMediaSelection}
        />
        <button
          type="button"
          onClick={() => mediaInputRef.current?.click()}
          disabled={isGenerating || mediaFiles.length >= 4}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-md bg-white text-slate-700 hover:border-emerald-700 hover:text-emerald-800 disabled:opacity-50 text-xs font-semibold"
          title={lang === 'es' ? 'Adjunta imágenes o videos de referencia' : 'Attach reference images or videos'}
        >
          <ImagePlus size={15} />
          {lang === 'es' ? 'Añadir referencias' : 'Add references'}
        </button>
        <button
          type="button"
          onClick={onGenerateFullApp}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2.5 bg-[var(--app-lime)] hover:bg-[#c9e95a] disabled:opacity-50 text-[var(--app-ink)] text-xs font-bold rounded-md transition-colors shadow-sm"
        >
          {isGenerating ? (lang === 'es' ? 'Creando proyecto...' : 'Building project...') : <><Zap size={14} />{lang === 'es' ? 'Crear proyecto' : 'Build project'}</>}
        </button>
        <button
          type="button"
          onClick={onOpenInterview}
          className="px-3.5 py-2.5 bg-[var(--app-ink)] hover:bg-[#244b3d] text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
          title="Conversa con Santiago para definir las características paso a paso"
        >
          <MessageSquareText size={14} /> {lang === 'es' ? 'Definir la idea' : 'Shape the idea'}
        </button>
        <button
          type="button"
          onClick={onGenerateDashboard}
          disabled={isGenerating || !prompt.trim()}
          className="px-4 py-2.5 bg-[var(--app-green)] hover:bg-[#1d573b] disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors"
        >
          {isGenerating ? generatingLabel : generateLabel}
        </button>
      </div>
      {(mediaFiles.length > 0 || mediaError) && (
        <div className="max-w-6xl mx-auto mt-2 flex flex-wrap items-center gap-2">
          {mediaFiles.map((file) => {
            const MediaIcon = file.type.startsWith('video/') ? Film : FileImage;
            return (
              <span key={`${file.name}-${file.size}-${file.lastModified}`} className="inline-flex max-w-full items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 py-1 pl-2.5 pr-1 text-emerald-900">
                <button type="button" onClick={() => setPreviewFile(file)} className="inline-flex min-w-0 items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-emerald-100" title={lang === 'es' ? `Previsualizar ${file.name}` : `Preview ${file.name}`}>
                  <MediaIcon size={14} className="shrink-0" />
                  <span className="max-w-48 truncate text-xs font-medium" title={file.name}>{file.name}</span>
                  <span className="shrink-0 text-[10px] text-emerald-800">{formatFileSize(file.size)}</span>
                  <Eye size={13} className="shrink-0" />
                </button>
                <button type="button" onClick={() => removeMediaFile(file)} aria-label={`${lang === 'es' ? 'Quitar' : 'Remove'} ${file.name}`} className="w-6 h-6 inline-flex items-center justify-center rounded hover:bg-emerald-100">
                  <X size={13} />
                </button>
              </span>
            );
          })}
          {mediaFiles.length > 0 && <span className="text-xs text-slate-500">{lang === 'es' ? 'Las referencias se enviarán a SoluSol al generar.' : 'References will be sent to SoluSol during generation.'}</span>}
          {mediaError && <span className="w-full text-xs text-rose-700" role="alert">{mediaError}</span>}
        </div>
      )}
      {statusMessage && (
        <div className="max-w-6xl mx-auto mt-2 text-xs text-red-600">
          {statusMessage}
        </div>
      )}
      {previewFile && previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'es' ? `Vista previa: ${previewFile.name}` : `Preview: ${previewFile.name}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setPreviewFile(null);
          }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-700 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <span className="min-w-0 truncate text-sm font-semibold text-slate-900" title={previewFile.name}>{previewFile.name}</span>
              <button type="button" onClick={() => setPreviewFile(null)} aria-label={lang === 'es' ? 'Cerrar vista previa' : 'Close preview'} className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <X size={17} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-slate-950 p-3">
              {previewFile.type.startsWith('video/') ? (
                <video src={previewUrl} controls playsInline preload="metadata" className="max-h-[78vh] max-w-full rounded-sm" />
              ) : (
                <img src={previewUrl} alt={previewFile.name} className="max-h-[78vh] max-w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}