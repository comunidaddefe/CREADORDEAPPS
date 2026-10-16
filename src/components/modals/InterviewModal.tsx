import React, { useState, useRef, useEffect } from 'react';
import type { InterviewMessage, LanguageStack } from '../../types/dashboard';

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStack: LanguageStack;
  history: InterviewMessage[];
  isLoading: boolean;
  onSendMessage: (text?: string) => void;
  onBuild: (refinedPrompt: string) => void;
}

export function InterviewModal({
  isOpen,
  onClose,
  targetStack,
  history,
  isLoading,
  onSendMessage,
  onBuild,
}: InterviewModalProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, history.length, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = (textToSend?: string) => {
    const msg = (textToSend || input).trim();
    if (!msg || isLoading) return;
    onSendMessage(msg);
    if (!textToSend) setInput('');
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col h-[600px] border border-slate-200 overflow-hidden">
        {/* Header del Chat */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
              ST
            </div>
            <div>
              <h3 id="interview-modal-title" className="text-sm font-bold text-slate-900">Santiago • Arquitecto de Apps</h3>
              <p className="text-[11px] text-slate-500">
                Definiendo características para stack: <span className="font-mono text-indigo-600 font-semibold">{targetStack}</span>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar modal" className="text-slate-400 hover:text-slate-700 text-sm p-1">✕</button>
        </div>

        {/* Historial de conversación */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          {history.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p className="text-2xl mb-2">🎙️</p>
              <p className="font-semibold text-slate-700">Dime qué aplicación tienes en mente.</p>
              <p className="mt-1">Por ejemplo: <em>"Quiero una página web de una radio por internet"</em>.</p>
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Opciones interactivas con un clic */}
                {msg.options && msg.options.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                    {msg.options.map((optGroup, gIdx) => (
                      <div key={gIdx} className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{optGroup.question}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {optGroup.choices.map((choice, cIdx) => (
                            <button
                              type="button"
                              key={cIdx}
                              disabled={isLoading}
                              onClick={() => handleSend(`Elegí: ${choice}`)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:pointer-events-none text-indigo-700 rounded text-[11px] font-medium border border-indigo-200/60 transition-colors"
                            >
                              + {choice}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón de construir cuando la entrevista confirma que el alcance está definido */}
                {msg.isReadyToBuild && msg.refinedPrompt && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => onBuild(msg.refinedPrompt!)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <span>🚀</span> ¡Construir Aplicación Ahora!
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="text-xs text-slate-400 font-mono italic">Santiago está pensando las preguntas técnicas...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de respuesta */}
        <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            disabled={isLoading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            aria-label="Mensaje para la entrevista con Santiago"
            placeholder="Escribe tu idea o responde a las preguntas..."
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}