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

    // Extract text content from the message
    const content = lastMessage.content;
    const messageText = Array.isArray(content) 
      ? content.find((part: any) => part.type === 'text')?.text || ''
      : content;

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
    
    // Extract the last user message
    const lastMessage = prompt[prompt.length - 1];
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    // Extract text content from the message
    const content = lastMessage.content;
    const messageText = Array.isArray(content)
      ? content.find((part: any) => part.type === 'text')?.text || ''
      : content;

    // Create session
    const session = await this.client.createSession();

    // Convert message format
    const adkRequest = {
      message: messageText,
      metadata: {},
    };

    // Stream response from ADK
    const stream = this.client.sendMessage(session.id, adkRequest);
    
    // Convert ADK stream to AI SDK format
    const textStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const response of stream) {
            if (response.chunk) {
              controller.enqueue({
                type: 'text-delta',
                delta: response.chunk,
              });
            }
            
            if (response.isComplete) {
              controller.enqueue({
                type: 'finish',
                usage: response.metadata?.usageMetadata ? {
                  promptTokens: response.metadata.usageMetadata.promptTokenCount || 0,
                  completionTokens: response.metadata.usageMetadata.candidatesTokenCount || 0,
                } : { promptTokens: 0, completionTokens: 0 },
                finishReason: response.metadata?.finishReason || 'stop',
              });
              controller.close();
              break;
            }
          }
        } catch (error) {
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