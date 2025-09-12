import type {
  ADKSession,
  ADKClientConfig,
  ADKInvokeRequest,
  ADKStreamResponse,
  ADKError as ADKErrorType,
  DocumentUpload,
  ADKSSEChunk,
  ParsedADKResponse,
} from './types';
import { ADKError } from './types';

export class ADKClient {
  private baseUrl: string;
  private appName: string = 'orchestrator';
  private timeout: number;
  private retries: number;

  constructor(
    private userId: string,
    config: ADKClientConfig = {}
  ) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_ADK_SERVICE_URL || '';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;

    if (!this.baseUrl) {
      throw new ADKError('ADK service URL is required');
    }
  }

  /**
   * Create a new session with the ADK service
   */
  async createSession(): Promise<ADKSession> {
    try {
      const response = await this.fetch(
        `/apps/${this.appName}/users/${this.userId}/sessions`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new ADKError(
          `Failed to create session: ${response.statusText}`,
          response.status
        );
      }

      const session = await response.json();
      return session as ADKSession;
    } catch (error) {
      throw this.handleError(error, 'Failed to create session');
    }
  }

  /**
   * Get an existing session
   */
  async getSession(sessionId: string): Promise<ADKSession> {
    try {
      const response = await this.fetch(
        `/apps/${this.appName}/users/${this.userId}/sessions/${sessionId}`
      );

      if (!response.ok) {
        throw new ADKError(
          `Failed to get session: ${response.statusText}`,
          response.status
        );
      }

      const session = await response.json();
      return session as ADKSession;
    } catch (error) {
      throw this.handleError(error, 'Failed to get session');
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const response = await this.fetch(
        `/apps/${this.appName}/users/${this.userId}/sessions/${sessionId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new ADKError(
          `Failed to delete session: ${response.statusText}`,
          response.status
        );
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to delete session');
    }
  }

  /**
   * Send a message to the ADK service and get streaming response
   */
  async *sendMessage(
    sessionId: string,
    request: ADKInvokeRequest
  ): AsyncGenerator<ADKStreamResponse, void, unknown> {
    try {
      // Convert to ADK format
      const adkRequest = {
        appName: this.appName,
        userId: this.userId,
        sessionId: sessionId,
        newMessage: {
          parts: request.message ? [{ text: request.message }] : [],
          role: 'user',
        },
        streaming: true,
        ...(request.metadata && { stateDelta: request.metadata }),
      };

      const response = await this.fetch(
        '/run_sse',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(adkRequest),
        }
      );

      if (!response.ok) {
        throw new ADKError(
          `Failed to send message: ${response.statusText}`,
          response.status
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ADKError('No response body available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // Process any remaining content in buffer
            if (buffer.trim()) {
              const parsed = this.parseSSEChunk(buffer.trim());
              if (parsed) {
                yield {
                  chunk: parsed.text,
                  isComplete: parsed.isComplete,
                  metadata: parsed.metadata,
                };
              }
            }
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const jsonStr = line.trim().substring(6); // Remove 'data: ' prefix
              if (jsonStr && jsonStr !== '[DONE]') {
                const parsed = this.parseSSEChunk(jsonStr);
                if (parsed) {
                  yield {
                    chunk: parsed.text,
                    isComplete: parsed.isComplete,
                    metadata: parsed.metadata,
                  };
                }
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to send message');
    }
  }

  private parseSSEChunk(jsonStr: string): ParsedADKResponse | null {
    try {
      const data: ADKSSEChunk = JSON.parse(jsonStr);
      
      // Extract text from the first part
      const text = data.content?.parts?.[0]?.text || '';
      
      // Check if this is a complete response
      const isComplete = !!data.finishReason;
      
      return {
        text,
        isPartial: data.partial,
        isComplete,
        metadata: {
          finishReason: data.finishReason,
          usageMetadata: data.usageMetadata,
          author: data.author,
          invocationId: data.invocationId,
        },
      };
    } catch (error) {
      console.error('Failed to parse SSE chunk:', error);
      return null;
    }
  }

  /**
   * Upload a document for processing
   */
  async uploadDocument(
    sessionId: string,
    file: File
  ): Promise<DocumentUpload> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await this.fetch('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new ADKError(
          `Failed to upload document: ${response.statusText}`,
          response.status
        );
      }

      const upload = await response.json();
      return upload as DocumentUpload;
    } catch (error) {
      throw this.handleError(error, 'Failed to upload document');
    }
  }

  /**
   * Get available apps from the ADK service
   */
  async listApps(): Promise<string[]> {
    try {
      const response = await this.fetch('/list-apps');

      if (!response.ok) {
        throw new ADKError(
          `Failed to list apps: ${response.statusText}`,
          response.status
        );
      }

      const apps = await response.json();
      return apps as string[];
    } catch (error) {
      throw this.handleError(error, 'Failed to list apps');
    }
  }

  /**
   * Health check for the ADK service
   */
  async healthCheck(): Promise<{ status: string }> {
    try {
      const response = await this.fetch('/health');

      if (!response.ok) {
        throw new ADKError(
          `Health check failed: ${response.statusText}`,
          response.status
        );
      }

      const health = await response.json();
      return health;
    } catch (error) {
      throw this.handleError(error, 'Health check failed');
    }
  }

  /**
   * Internal fetch wrapper with retry logic and timeout
   */
  private async fetch(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ADKError('Request timeout', 408);
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    clearTimeout(timeoutId);
    throw lastError!;
  }

  /**
   * Error handler for consistent error formatting
   */
  private handleError(error: unknown, context: string): ADKError {
    if (error instanceof ADKError) {
      return error;
    }

    if (error instanceof Error) {
      return new ADKError(`${context}: ${error.message}`);
    }

    return new ADKError(`${context}: Unknown error`);
  }
}
