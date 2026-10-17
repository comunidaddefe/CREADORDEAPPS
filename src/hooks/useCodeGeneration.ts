import { useState, useCallback } from 'react';
import type {
  LanguageStack,
  LLMProvider,
  DashboardWidget,
  GeneratedProject,
} from '../types/dashboard';

interface UseCodeGenerationProps {
  targetStack: LanguageStack;
  provider: LLMProvider;
  ollamaModel: string;
  mediaFiles: File[];
  dashboard: DashboardWidget[];
  onApplyLayout: (layout: DashboardWidget[]) => void;
  onSelectWidget: (id: string | null) => void;
  onViewModeChange: (mode: 'canvas' | 'project' | 'code') => void;
}

export function useCodeGeneration({
  targetStack,
  provider,
  ollamaModel,
  mediaFiles,
  dashboard,
  onApplyLayout,
  onSelectWidget,
  onViewModeChange,
}: UseCodeGenerationProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [activeProjectTab, setActiveProjectTab] = useState<'editor' | 'readme'>('editor');

  const setTransientStatus = useCallback((msg: string, durationMs = 3000) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), durationMs);
  }, []);

  const sendGenerationRequest = useCallback((url: string, payload: Record<string, string>) => {
    const requestPayload = { ...payload, provider };

    if (mediaFiles.length === 0) {
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
    }

    const formData = new FormData();
    Object.entries(requestPayload).forEach(([key, value]) => formData.set(key, value));
    mediaFiles.forEach((file) => formData.append('media', file, file.name));
    return fetch(url, { method: 'POST', body: formData });
  }, [mediaFiles, provider]);

  const generateDashboard = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const response = await sendGenerationRequest('/api/generate-dashboard', {
        prompt,
        stack: targetStack,
        model: ollamaModel,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize dashboard layout');
      }
      if (Array.isArray(data)) {
        onApplyLayout(data);
        onSelectWidget(null);
        onViewModeChange('canvas');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error occurred while contacting backend');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, targetStack, provider, ollamaModel, onApplyLayout, onSelectWidget, onViewModeChange, sendGenerationRequest]);

  const generateFullApp = useCallback(async (promptOverride?: string) => {
    const activePrompt = (promptOverride ?? prompt).trim();
    if (!activePrompt) return;
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      const response = await sendGenerationRequest('/api/generate-project', {
        prompt: activePrompt,
        stack: targetStack,
        model: ollamaModel,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate runnable application project');
      }
      if (data.files && Array.isArray(data.files)) {
        setGeneratedProject(data);
        setSelectedFileIndex(0);
        setActiveProjectTab('editor');
        onViewModeChange('project');
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Error connecting to synthesis microservice');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, targetStack, provider, ollamaModel, onViewModeChange, sendGenerationRequest]);

  const synthesizeTargetCode = useCallback(async () => {
    if (dashboard.length === 0) return;
    setIsSynthesizing(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/export-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layout: dashboard,
          stack: targetStack,
          provider,
          model: ollamaModel,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Code synthesis failed');
      }
      setGeneratedCode(data.code || '');
      onViewModeChange('code');
    } catch (err: any) {
      setStatusMessage(err.message || 'Error contacting code synthesis engine');
    } finally {
      setIsSynthesizing(false);
    }
  }, [dashboard, targetStack, provider, ollamaModel, onViewModeChange]);

  return {
    prompt,
    setPrompt,
    isGenerating,
    isSynthesizing,
    statusMessage,
    setStatusMessage,
    setTransientStatus,
    generatedCode,
    setGeneratedCode,
    generatedProject,
    setGeneratedProject,
    selectedFileIndex,
    setSelectedFileIndex,
    activeProjectTab,
    setActiveProjectTab,
    generateDashboard,
    generateFullApp,
    synthesizeTargetCode,
  };
}