import { customProvider, type Provider } from 'ai';
import { ADKClient } from './client';
import { ADKSessionHook } from './session';

export interface ADKProviderConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

class ADKLanguageModel {
  private client: ADKClient;
  private config: ADKProviderConfig;
  private sessionHook: ADKSessionHook;
  private accumulatedStateDelta: Record<string, any> = {};
  private conversationHistory: Array<{role: string, text: string}> = [];

  constructor(config: ADKProviderConfig = {}) {
    this.client = new ADKClient('user-placeholder', config);
    this.config = config;
    // Use ServerSessionManager on the server side
    this.sessionHook = new ADKSessionHook(this.client, false);
  }

  readonly specificationVersion = 'v2' as const;
  readonly provider = 'adk-provider';
  readonly modelId = 'adk-model';
  readonly supportedUrls = {};

  /**
   * Deep merge helper for stateDelta objects
   */
  private deepMerge(target: any, source: any): any {
    for (const key of Object.keys(source || {})) {
      const srcVal = source[key];
      const tgtVal = target[key];
      if (srcVal && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
        target[key] = this.deepMerge(tgtVal && typeof tgtVal === 'object' ? tgtVal : {}, srcVal);
      } else {
        target[key] = srcVal;
      }
    }
    return target;
  }

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

    // Get or create session
    const session = await this.sessionHook.getOrCreateSession();
    console.log('Using session:', session.id);

    // Add user message to conversation history
    this.conversationHistory.push({ role: 'user', text: messageText });

    // Build conversationHistory in ADK-friendly shape
    const conversationHistory = this.conversationHistory.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    // Merge accumulated state with conversationHistory
    const outgoingStateDelta = { ...this.accumulatedStateDelta };
    outgoingStateDelta.conversationHistory = conversationHistory;

    // Convert message format
    const adkRequest = {
      message: messageText,
      metadata: outgoingStateDelta,
    };

    // Get response from ADK (collect all chunks)
    let fullResponse = '';
    let responseStateDelta = {};
    const stream = this.client.sendMessage(session.id, adkRequest);
    
    for await (const response of stream) {
      if (response.chunk) {
        fullResponse += response.chunk;
      }
      
      // Capture any stateDelta the agent proposes
      if (response.metadata?.actions?.stateDelta) {
        responseStateDelta = this.deepMerge(responseStateDelta, response.metadata.actions.stateDelta);
      }
      
      if (response.isComplete) {
        break;
      }
    }

    // Accumulate any returned stateDelta for future turns
    if (Object.keys(responseStateDelta).length > 0) {
      this.accumulatedStateDelta = this.deepMerge(this.accumulatedStateDelta, responseStateDelta);
      console.log('Accumulated stateDelta keys:', Object.keys(this.accumulatedStateDelta));
    }

    // Add assistant reply to history for subsequent turns
    this.conversationHistory.push({ role: 'assistant', text: fullResponse });

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

    // Get or create session
    const session = await this.sessionHook.getOrCreateSession();
    console.log('Using session:', session.id);

    // Add user message to conversation history
    this.conversationHistory.push({ role: 'user', text: messageText });

    // Build conversationHistory in ADK-friendly shape
    const conversationHistory = this.conversationHistory.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));

    // Merge accumulated state with conversationHistory
    const outgoingStateDelta = { ...this.accumulatedStateDelta };
    outgoingStateDelta.conversationHistory = conversationHistory;

    // Convert message format
    const adkRequest = {
      message: messageText,
      metadata: outgoingStateDelta,
    };

    // Stream response from ADK
    const stream = this.client.sendMessage(session.id, adkRequest);
    
    // Convert ADK stream to AI SDK format
    let fullResponse = '';
    let responseStateDelta = {};
    
    // Store a reference to the deepMerge method to avoid 'this' binding issues
    const deepMerge = this.deepMerge.bind(this);
    
    const textStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const response of stream) {
            if (response.chunk) {
              controller.enqueue({
                type: 'text-delta',
                delta: response.chunk,
              });
              fullResponse += response.chunk;
            }
            
            // Capture any stateDelta the agent proposes
            if (response.metadata?.actions?.stateDelta) {
              responseStateDelta = deepMerge(responseStateDelta, response.metadata.actions.stateDelta);
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

    // Accumulate any returned stateDelta for future turns
    if (Object.keys(responseStateDelta).length > 0) {
      this.accumulatedStateDelta = this.deepMerge(this.accumulatedStateDelta, responseStateDelta);
      console.log('Accumulated stateDelta keys:', Object.keys(this.accumulatedStateDelta));
    }

    // Add assistant reply to history for subsequent turns
    this.conversationHistory.push({ role: 'assistant', text: fullResponse });

    return {
      stream: textStream,
    };
  }
}

export function createADKProvider(config: ADKProviderConfig = {}): Provider {
  return customProvider({
    languageModels: {
      'adk-model': new ADKLanguageModel(config),
    },
  });
}