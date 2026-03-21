export type Theme = 'dark' | 'light';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FilePreview[];
  analysis?: AnalysisResult;
}

export interface FilePreview {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface AnalysisResult {
  summary: string;
  steps: string[];
  notes: string[];
  promptOutput: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  isPinned: boolean;
  isArchived: boolean;
  updatedAt: Date;
}
