import { 
  type UIMessage, 
  type ChatRequestOptions
} from 'ai';
import { ADKClient } from './client';
import { ADKSessionHook } from './session';
import type { ADKStreamResponse } from './types';

export class ADKTransport {
  private adkClient: ADKClient;
  private sessionHook: ADKSessionHook;

  constructor(
    userId: string,
    config?: { baseUrl?: string; timeout?: number; retries?: number }
  ) {
    this.adkClient = new ADKClient(userId, config);
    this.sessionHook = new ADKSessionHook(this.adkClient);
  }

  async fetch(
    chatId: string,
    messages: UIMessage[],
    options?: ChatRequestOptions
  ) {
    // Get or create session
    const session = await this.sessionHook.getOrCreateSession();
    
    // Convert last message to ADK format
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      throw new Error('Last message must be from user');
    }

    // Extract text content from UIMessage - handle both old and new formats
    let messageContent = '';
    
    // Try to access content as any to handle different AI SDK versions
    const messageAny = lastMessage as any;
    
    if (typeof messageAny.content === 'string') {
      messageContent = messageAny.content;
    } else if (Array.isArray(messageAny.content)) {
      const textPart = messageAny.content.find((part: any) => part.type === 'text');
      messageContent = textPart?.text || '';
    } else if (messageAny.content && typeof messageAny.content === 'object') {
      // Handle new format where content might be structured differently
      messageContent = messageAny.content.text || messageAny.content.toString() || '';
    }

    const adkRequest = {
      message: messageContent,
      metadata: options?.body as Record<string, any> || {},
    };

    // Stream response from ADK
    const stream = this.adkClient.sendMessage(session.id, adkRequest);
    
    // Convert ADK stream to TextStreamPart format
    const textStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const response of stream) {
            if (response.chunk) {
              controller.enqueue({
                type: 'text',
                content: response.chunk,
              });
            }
            
            if (response.isComplete) {
              controller.enqueue({
                type: 'finish',
                finishReason: 'stop',
                usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 }
              });
              break;
            }
          }
          controller.close();
        } catch (error) {
          controller.enqueue({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          controller.close();
        }
      }
    });

    return textStream;
  }
}