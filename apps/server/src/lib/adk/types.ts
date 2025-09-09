export interface ADKSession {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, any>;
  events: ADKEvent[];
  lastUpdateTime: number;
}

export interface ADKEvent {
  id: string;
  timestamp: number;
  type: string;
  data: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    agent?: string;
    documents?: string[];
    validationResults?: any;
    processingResults?: any;
    processingTime?: number;
  };
}

export interface DocumentUpload {
  id: string;
  sessionId: string;
  filename: string;
  mimeType: string;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadUrl?: string;
  results?: {
    documentType: string;
    extractedData: Record<string, any>;
    validationStatus: 'valid' | 'invalid';
    errors?: string[];
    confidence?: number;
  };
}

export interface ADKStreamResponse {
  chunk: string;
  isComplete: boolean;
  metadata?: {
    currentAgent?: string;
    processingStage?: string;
  };
}

export interface ADKInvokeRequest {
  message?: string;
  files?: File[];
  metadata?: Record<string, any>;
}

export interface ADKInvokeResponse {
  success: boolean;
  sessionId: string;
  response: string;
  agent: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface ADKClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class ADKError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ADKError';
  }
}
