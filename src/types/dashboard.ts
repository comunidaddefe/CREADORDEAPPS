export type LanguageStack =
  | 'html' | 'php' | 'tsx' | 'go' | 'json'
  | 'javascript' | 'typescript' | 'html_css' | 'vue' | 'svelte'
  | 'csharp' | 'rust' | 'cpp' | 'c' | 'zig' | 'nim'
  | 'java' | 'kotlin' | 'swift' | 'dart'
  | 'python' | 'ruby' | 'perl' | 'lua' | 'bash' | 'powershell'
  | 'elixir' | 'erlang' | 'scala' | 'clojure' | 'haskell' | 'fsharp' | 'ocaml'
  | 'r' | 'julia' | 'sql' | 'yaml' | 'solidity';

export type LLMProvider = 'solusol' | 'ollama';
export type ComponentType = 'stat' | 'bar_chart' | 'line_chart' | 'table' | 'list';

export interface DashboardWidget {
  id: string;
  type: ComponentType;
  gridPosition?: {
    colSpan: number;
    rowSpan?: number;
  };
  props: {
    title: string;
    data_source: string;
    value?: string;
  };
}

export interface GeneratedProjectFile {
  path: string;
  content: string;
}

export interface GeneratedProject {
  appName: string;
  description: string;
  stack?: string;
  runCommand: string;
  files: GeneratedProjectFile[];
  readme: string;
}

export interface MetricResponse {
  origin: string;
  status: 'LIVE' | 'DEMO' | 'NO_DATA' | 'ERROR';
  unit: string;
  value?: string;
  series?: Array<{ label: string; value: number }>;
  points?: number[];
  rows?: Array<{ key: string; value: string }>;
  items?: Array<{ id: string; text: string; status: string }>;
  updatedAt: string;
  description?: string;
}

export interface InterviewOption {
  question: string;
  choices: string[];
}

export interface InterviewMessage {
  sender: 'user' | 'santiago';
  text: string;
  questions?: string[];
  options?: InterviewOption[];
  isReadyToBuild?: boolean;
  refinedPrompt?: string;
}