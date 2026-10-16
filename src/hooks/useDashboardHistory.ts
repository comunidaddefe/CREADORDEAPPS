import { useState, useEffect, useCallback } from 'react';
import type { DashboardWidget } from '../types/dashboard';
import { DEFAULT_WIDGETS } from '../constants/stacks';

export function useDashboardHistory() {
  const [dashboard, setDashboard] = useState<DashboardWidget[]>(() => {
    const saved = localStorage.getItem('appcraft_dashboard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_WIDGETS;
  });

  const [history, setHistory] = useState<DashboardWidget[][]>([dashboard]);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem('appcraft_dashboard', JSON.stringify(dashboard));
  }, [dashboard]);

  const pushToHistory = useCallback((newDashboard: DashboardWidget[]) => {
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, newDashboard];
    });
    setHistoryIndex((prev) => prev + 1);
    setDashboard(newDashboard);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setDashboard(history[nextIndex]);
    }
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setDashboard(history[nextIndex]);
    }
  }, [historyIndex, history]);

  // Atajos globales de teclado para Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const clearDashboard = useCallback(() => {
    pushToHistory([]);
    localStorage.removeItem('appcraft_dashboard');
  }, [pushToHistory]);

  const updateWidgetColSpan = useCallback((id: string, colSpan: number) => {
    setDashboard((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, gridPosition: { ...item.gridPosition, colSpan } }
          : item
      )
    );
  }, []);

  return {
    dashboard,
    setDashboard,
    pushToHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    clearDashboard,
    updateWidgetColSpan,
  };
}