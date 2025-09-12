import { customProvider } from 'ai';
import { ADKClient } from './client';

export interface ADKProviderConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

class ADKLanguageModel {
  private client: ADKClient;
  private config: ADKProviderConfig;

  constructor(config: ADKProviderConfig = {}) {
    this.client = new ADKClient('user-placeholder', config);
    this.config = config;
  }

  readonly specificationVersion = 'v2' as const;
  readonly provider = 'adk-provider';
  readonly modelId = 'adk-model';
  readonly supportedUrls = {};

  async doGenerate(options: any) {
    const { prompt } = options;
    
    // Extract the last user message
    const lastMessage = prompt[prompt.length - 1];
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    // Extract text content from the message - handle both content and parts formats
    let messageText = '';
    
    if (lastMessage.content) {
      // Standard AI SDK format with content
      const content = lastMessage.content;
      messageText = Array.isArray(content) 
        ? content.find((part: any) => part.type === 'text')?.text || ''
        : content;
    } else if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      // Parts format from useChat
      const textPart = lastMessage.parts.find((part: any) => part.type === 'text');
      messageText = textPart?.text || '';
    } else {
      messageText = String(lastMessage.content || '');
    }

    // Create session
    const session = await this.client.createSession();

    // Convert message format
    const adkRequest = {
      message: messageText,
      metadata: {},
    };

    // Get response from ADK (collect all chunks)
    let fullResponse = '';
    const stream = this.client.sendMessage(session.id, adkRequest);
    
    for await (const response of stream) {
      if (response.chunk) {
        fullResponse += response.chunk;
      }
      
      if (response.isComplete) {
        break;
      }
    }

    return {
      content: [{ type: 'text', text: fullResponse }] as any,
      finishReason: 'stop' as any,
      usage: { promptTokens: 0, completionTokens: 0 } as any,
      warnings: [],
    };
  }

  async doStream(options: any) {
    const { prompt } = options;
    
    // Debug: Log the received message format
    console.log('doStream received prompt:', JSON.stringify(prompt, null, 2));
    
    // Extract the last user message
    const lastMessage = prompt[prompt.length - 1];
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    // Extract text content from the message - handle both content and parts formats
    let messageText = '';
    
    if (lastMessage.content) {
      // Standard AI SDK format with content
      const content = lastMessage.content;
      messageText = Array.isArray(content)
        ? content.find((part: any) => part.type === 'text')?.text || ''
        : content;
    } else if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
      // Parts format from useChat
      const textPart = lastMessage.parts.find((part: any) => part.type === 'text');
      messageText = textPart?.text || '';
    } else {
      messageText = String(lastMessage.content || '');
    }

    console.log('Extracted messageText:', messageText);

    // Create session
    console.log('Creating ADK session...');
    const session = await this.client.createSession();
    console.log('ADK session created:', session.id);

    // Convert message format
    const adkRequest = {
      message: messageText,
      metadata: {},
    };

    console.log('Sending ADK request:', adkRequest);

    // Stream response from ADK
    const stream = this.client.sendMessage(session.id, adkRequest);
    console.log('ADK stream created, starting to process...');

    // Convert ADK stream to UI Message chunks expected by ai v5
    // Emit a single text part with a stable id across the stream
    const TEXT_ID = 'text-1';
    const textStream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting to iterate ADK stream...');

          // Begin a text part
          controller.enqueue({ type: 'text-start', id: TEXT_ID });

          for await (const response of stream) {
            console.log('ADK stream response:', response);
            if (response.chunk) {
              console.log('Enqueueing text-delta:', response.chunk);
              controller.enqueue({ type: 'text-delta', id: TEXT_ID, delta: response.chunk });
            }
            
            if (response.isComplete) {
              console.log('ADK stream complete');
              // End the text part before finishing
              controller.enqueue({ type: 'text-end', id: TEXT_ID });
              controller.enqueue({
                type: 'finish',
                usage: response.metadata?.usageMetadata ? {
                  promptTokens: response.metadata.usageMetadata.promptTokenCount || 0,
                  completionTokens: response.metadata.usageMetadata.candidatesTokenCount || 0,
                } : { promptTokens: 0, completionTokens: 0 },
                finishReason: response.metadata?.finishReason || 'stop'
              });
              controller.close();
              break;
            }
          }
          console.log('ADK stream iteration finished');
        } catch (error) {
          console.error('ADK stream error:', error);
          controller.enqueue({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          controller.close();
        }
      }
    });

    return {
      stream: textStream,
    };
  }
}

export function createADKProvider(config: ADKProviderConfig = {}) {
  return customProvider({
    languageModels: {
      'adk-model': new ADKLanguageModel(config),
    },
  });
}
