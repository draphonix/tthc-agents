# AI SDK Refactor Plan

## 1. Executive Summary

This document outlines a comprehensive technical implementation plan for integrating the AI SDK into the existing ADK chat interface. The refactor aims to modernize the chat implementation by leveraging the AI SDK's standardized approach to streaming chat interfaces while maintaining compatibility with the existing ADK service architecture.

### Key Benefits and Rationale

- **Standardization**: Use industry-standard AI SDK patterns for chat interfaces
- **Improved Developer Experience**: Leverage AI SDK's built-in hooks and utilities
- **Enhanced Streaming**: Better handling of streaming responses with proper TextStreamPart formatting
- **Maintainability**: Cleaner separation of concerns between UI and backend logic
- **Extensibility**: Easier to add new features like tool calling, file attachments, and more

### High-Level Timeline

- **Phase 1**: Custom AI SDK Provider Creation (1 day)
- **Phase 2**: Custom Transport Implementation (1 day)
- **Phase 3**: Chat Interface Updates (2 days)
- **Phase 4**: Backend API Updates (1 day)
- **Total Implementation Time**: 5 days
- **Testing and Validation**: 2 days

## 2. Current State Analysis

### Existing ADK Implementation Details

The current ADK chat implementation is located in:
- Web client: `apps/web/src/components/adk/chat-interface.tsx`
- ADK client: `apps/web/src/lib/adk/client.ts`
- ADK types: `apps/web/src/lib/adk/types.ts`
- Server endpoint: `apps/server/src/app/api/adk/chat/route.ts`

### Current Request Format

The existing ADK client sends requests in the following format:
```typescript
const adkRequest = {
  appName: 'orchestrator',
  userId: string,
  sessionId: string,
  newMessage: {
    parts: [{ text: string }],
    role: 'user',
  },
  streaming: true,
  stateDelta?: Record<string, any>,
}
```

### Current Response Format

The current implementation receives Server-Sent Events (SSE) with raw text chunks. Each chunk is processed individually and appended to build the complete assistant response.

### Session Management Approach

Session management is handled through:
- POST `/apps/orchestrator/users/{userId}/sessions` - Create new session
- GET `/apps/orchestrator/users/{userId}/sessions/{sessionId}` - Retrieve existing session
- DELETE `/apps/orchestrator/users/{userId}/sessions/{sessionId}` - Delete session

### Document Processing Flow

Document processing is implemented via:
- POST `/documents/upload` - Upload documents for processing
- GET `/documents/status` - Check document processing status

## 3. AI SDK Requirements Analysis

### AI SDK Architecture Overview

The AI SDK provides a standardized approach to implementing AI-powered chat interfaces with:
- `streamText()` function for creating streaming responses
- `useChat()` hook for client-side chat state management
- Provider abstraction for different AI services
- Transport layer for custom communication protocols

### Required Interfaces and Formats

To integrate with the AI SDK, we need to implement:
- Custom provider using `customProvider()` function
- Language model interface that maps to ADK service
- Custom transport for `useChat()` hook that handles ADK communication

### Streaming Expectations

The AI SDK expects streaming responses in TextStreamPart format:
```typescript
type TextStreamPart = 
  | { type: 'text'; content: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: any }
  | { type: 'tool-result'; toolCallId: string; result: any }
  | { type: 'error'; error: unknown }
  | { type: 'finish'; finishReason: string; usage: any }
```

### Message Format Requirements

The AI SDK uses UIMessage format:
```typescript
type UIMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}
```

## 4. Implementation Strategy

### Phase 1: Custom AI SDK Provider Creation

Create a custom provider that wraps the ADK service and implements the language model interface required by the AI SDK.

**Files to create:**
- `apps/web/src/lib/adk/ai-sdk-provider.ts`

### Phase 2: Custom Transport Implementation

Implement a custom transport class that handles communication between the `useChat()` hook and the ADK service, including message format conversion.

**Files to create:**
- `apps/web/src/lib/adk/ai-sdk-transport.ts`

### Phase 3: Chat Interface Updates

Update the chat interface component to use the AI SDK's `useChat()` hook instead of the custom implementation.

**Files to modify:**
- `apps/web/src/components/adk/chat-interface.tsx`

### Phase 4: Backend API Updates

Create a new API endpoint that serves as a bridge between the AI SDK format and the ADK service, ensuring proper TextStreamPart formatting.

**Files to create:**
- `apps/server/src/app/api/adk/ai-chat/route.ts`

## 5. Technical Implementation Details

### Custom Provider Implementation

Create a custom provider that implements the language model interface:

```typescript
// apps/web/src/lib/adk/ai-sdk-provider.ts
import { customProvider } from '@ai-sdk/react';
import { ADKClient } from './client';
import type { UIMessage } from 'ai';

export interface ADKProviderConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export function createADKProvider(config: ADKProviderConfig = {}) {
  return customProvider({
    name: 'adk',
    execute: async ({ messages }: { messages: UIMessage[] }) => {
      // Convert UIMessage to ADK format
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== 'user') {
        throw new Error('Last message must be from user');
      }

      // Create ADK client instance
      const adkClient = new ADKClient('user-placeholder', config);

      // Create session
      const session = await adkClient.createSession();

      // Convert message format
      const adkRequest = {
        message: lastMessage.content,
        metadata: {},
      };

      // Stream response
      return adkClient.sendMessage(session.id, adkRequest);
    },
  });
}
```

### Custom Transport Implementation

Create a transport class that handles the communication between `useChat()` and the ADK service:

```typescript
// apps/web/src/lib/adk/ai-sdk-transport.ts
import { 
  type UIMessage, 
  type ChatRequestOptions,
  type StreamPart,
  type IdGenerator
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

    const adkRequest = {
      message: lastMessage.content,
      metadata: options?.body as Record<string, any> || {},
    };

    // Stream response from ADK
    const stream = this.adkClient.sendMessage(session.id, adkRequest);
    
    // Convert ADK stream to TextStreamPart format
    const textStream = new ReadableStream<StreamPart>({
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
```

### Updated Chat Interface Implementation

Update the chat interface to use the AI SDK's `useChat()` hook:

```typescript
// apps/web/src/components/adk/chat-interface.tsx (updated version)
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { ADKClient } from "@/lib/adk/client";
import { ADKSessionHook } from "@/lib/adk/session";
import type { ADKSession, ChatMessage, ADKStreamResponse } from "@/lib/adk/types";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { AgentStatusIndicator } from "./agent-status-indicator";
import { ADKError } from "@/lib/adk/types";
import { useDocumentProcessing } from "@/hooks/use-document-processing";
import type { DocumentFile } from "./document-uploader";
import { NetworkStatus } from "./network-status";
import { toast } from "sonner";
import { ADKTransport } from "@/lib/adk/ai-sdk-transport";

// Placeholder for user ID - in real app, this would come from auth
const PLACEHOLDER_USER_ID = "user-123";

export function ADKChatInterface() {
  const [currentSession, setCurrentSession] = useState<ADKSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adkClientRef = useRef<ADKClient | null>(null);
  const sessionHookRef = useRef<ADKSessionHook | null>(null);

  // Initialize ADK transport
  const transport = new ADKTransport(PLACEHOLDER_USER_ID, {
    baseUrl: process.env.NEXT_PUBLIC_ADK_SERVICE_URL,
    timeout: 30000,
    retries: 3,
  });

  // Use AI SDK's useChat hook
  const { messages, input, handleInputChange, handleSubmit, isLoading, reload } = useChat({
    api: '/api/adk/ai-chat',
    streamProtocol: 'text-stream',
    fetch: transport.fetch.bind(transport),
  });

  // Document processing hook
  const {
    processingStatus,
    isProcessing: isDocProcessing,
    processFiles,
    clearProcessingStatus,
  } = useDocumentProcessing({
    sessionId: currentSession?.id || '',
    onFileComplete: (fileId, results) => {
      // Handle document processing completion
    },
    onFileError: (fileId, error) => {
      // Handle document processing errors
    },
  });

  // Initialize ADK client and session
  useEffect(() => {
    const initializeADK = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Initialize ADK client
        const client = new ADKClient(PLACEHOLDER_USER_ID);
        adkClientRef.current = client;

        // Initialize session hook
        const sessionHook = new ADKSessionHook(client);
        sessionHookRef.current = sessionHook;

        // Test connection
        await client.healthCheck();

        // Get or create session
        const session = await sessionHook.getOrCreateSession();
        setCurrentSession(session);

        setIsConnecting(false);
      } catch (error) {
        console.error("Failed to initialize ADK:", error);
        setError(error instanceof ADKError ? error.message : "Failed to connect to ADK service");
        setIsConnecting(false);
        toast.error("Failed to connect to ADK service");
      }
    };

    initializeADK();
  }, []);

  const handleChatSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Handle document processing if files are attached
    // Then submit the chat message
    handleSubmit(e);
  }, [handleSubmit]);

  const retryConnection = useCallback(async () => {
    if (!sessionHookRef.current || !adkClientRef.current) {
      window.location.reload();
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Test connection
      await adkClientRef.current.healthCheck();

      // Try to restore or create new session
      const session = await sessionHookRef.current.getOrCreateSession();
      setCurrentSession(session);

      setIsConnecting(false);
      toast.success("Reconnected successfully!");
    } catch (error) {
      console.error("Failed to retry connection:", error);
      setError(error instanceof ADKError ? error.message : "Failed to reconnect");
      setIsConnecting(false);
      toast.error("Failed to reconnect");
    }
  }, []);

  const clearChat = useCallback(() => {
    // Clear chat logic
    setError(null);
    clearProcessingStatus();
    toast.success("Chat cleared");
  }, [clearProcessingStatus]);

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-pulse text-lg font-medium">
            Connecting to ADK Assistant...
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Initializing session and agents
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-lg font-medium text-destructive mb-2">
            Connection Error
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            {error}
          </div>
          <button
            onClick={retryConnection}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm">
      {/* Header with status */}
      <div className="p-4 border-b bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AgentStatusIndicator 
              currentAgent={currentAgent}
              processingStage={processingStage}
              isLoading={isLoading}
            />
            {currentSession && (
              <div className="text-xs text-muted-foreground">
                Session: {currentSession.id.slice(-8)}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {error && (
              <button
                onClick={retryConnection}
                className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                disabled={isConnecting}
              >
                Retry
              </button>
            )}
            <button
              onClick={clearChat}
              className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}
        
        {/* Network status */}
        <NetworkStatus 
          onRetry={retryConnection}
          className="mt-2"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0">
        <MessageList messages={messages as unknown as ChatMessage[]} isLoading={isLoading} />
      </div>

      {/* Input */}
      <div className="border-t bg-card/50">
        <MessageInput 
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleChatSubmit}
          onRetryFile={(file) => {
            // Use the retry function from the document processing hook
            processFiles([file]);
          }}
          disabled={isLoading || !currentSession}
          placeholder={
            !currentSession 
              ? "Connecting to ADK..." 
              : isLoading 
              ? "ADK is processing..." 
              : "Ask about birth certificate registration..."
          }
        />
      </div>
    </div>
  );
}
```

### Backend API Endpoint for AI SDK Compatibility

Create a new API endpoint that bridges AI SDK and ADK service:

```typescript
// apps/server/src/app/api/adk/ai-chat/route.ts
import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createADKProvider } from '@/lib/adk/ai-sdk-provider';

const ADK_PROVIDER = createADKProvider({
  baseUrl: process.env.ADK_SERVICE_URL || 'https://adk-service-418025649220.us-east4.run.app',
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  
  const result = await streamText({
    model: ADK_PROVIDER.languageModel('adk-model'),
    messages,
  });
  
  return result.toTextStreamResponse();
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

## 6. Technical Challenges & Solutions

### Session Management Mapping

**Challenge**: The AI SDK doesn't natively handle session-based communication with the ADK service.
**Solution**: Implement session management within the custom transport layer, maintaining session state between requests.

### Streaming Format Conversion

**Challenge**: ADK service returns raw text chunks via SSE, while AI SDK expects TextStreamPart format.
**Solution**: Create a stream transformation layer in the custom transport that converts ADK responses to TextStreamPart format.

### Document Processing Integration

**Challenge**: Document processing is a separate flow from chat messages in the current implementation.
**Solution**: Extend the transport layer to handle document uploads before sending chat messages, and include document metadata in requests.

### Error Handling and Retry Logic

**Challenge**: Ensuring consistent error handling between ADK service errors and AI SDK expectations.
**Solution**: Implement comprehensive error mapping in the transport layer that converts ADK errors to AI SDK error stream parts.

## 7. Migration Strategy

### Parallel Implementation Approach

To minimize disruption, we'll implement the AI SDK integration alongside the existing ADK implementation:
1. Create new files for AI SDK provider and transport
2. Create new API endpoint without modifying existing ones
3. Update chat interface to use AI SDK (but keep ADK client for other functionality)
4. Test thoroughly before removing legacy code

### Feature Parity Requirements

The new implementation must maintain the following features:
- Streaming responses from ADK service
- Session management
- Document processing workflow
- Agent status tracking
- Error handling and retry mechanisms
- Network status monitoring

### Rollout Plan

1. **Development**: Implement all new components in isolation
2. **Testing**: Validate functionality with unit and integration tests
3. **Staging**: Deploy to staging environment for QA testing
4. **Gradual Rollout**: Enable for subset of users initially
5. **Full Deployment**: Deploy to all users after validation

### Cleanup Process

After successful rollout:
1. Remove legacy streaming implementation from ADK client
2. Consolidate session management logic
3. Update documentation and remove deprecated code paths
4. Optimize bundle size by removing unused dependencies

## 8. Testing Strategy

### Unit Testing Approach

Test each component in isolation:
- Custom provider implementation
- Transport class functionality
- Message format conversion functions
- Error handling mechanisms

### Integration Testing

Test the complete flow:
- Chat interface with AI SDK hooks
- Transport layer with actual ADK service
- Backend endpoint with various message types
- Document processing integration

### End-to-End Testing

Test user scenarios:
- Complete chat conversation flow
- Document upload and processing
- Error recovery and retry mechanisms
- Session management across multiple requests

### Performance Considerations

- Measure streaming latency compared to legacy implementation
- Validate memory usage during long conversations
- Test concurrent user sessions
- Benchmark response times under load

## 9. Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Streaming format incompatibility | High | Medium | Implement comprehensive format conversion and validation |
| Session management issues | High | Low | Maintain backward compatibility with existing session endpoints |
| Document processing integration failure | Medium | Medium | Keep existing document processing flow as fallback |
| Error handling inconsistencies | Medium | High | Create detailed error mapping between ADK and AI SDK formats |

### Timeline Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| ADK service API changes | High | Low | Maintain close communication with ADK service team |
| Dependency conflicts | Medium | Medium | Test integration in isolated environment first |
| Performance degradation | High | Medium | Implement performance monitoring and benchmarking |

### Mitigation Strategies

1. **Backward Compatibility**: Keep existing endpoints functional during transition
2. **Feature Flags**: Enable new implementation selectively
3. **Comprehensive Testing**: Validate all user flows before deployment
4. **Monitoring**: Implement logging and metrics for the new implementation

## 10. Success Criteria

### Functional Requirements

- [ ] Chat interface successfully streams responses from ADK service
- [ ] Session management works correctly with new implementation
- [ ] Document processing workflow is preserved
- [ ] Agent status tracking is maintained
- [ ] Error handling and retry mechanisms function properly
- [ ] Network status monitoring continues to work

### Performance Metrics

- [ ] Response latency < 200ms for initial chunk
- [ ] Streaming throughput > 10 chunks/second
- [ ] Memory usage < 50MB during long conversations
- [ ] Session creation time < 1 second

### User Experience Improvements

- [ ] More consistent loading states
- [ ] Better error messages and recovery options
- [ ] Improved typing indicators
- [ ] Enhanced accessibility support

## 11. Appendix

### File Structure Changes

```
apps/
├── web/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── adk/
│   │   │   │   ├── ai-sdk-provider.ts (new)
│   │   │   │   ├── ai-sdk-transport.ts (new)
│   │   │   │   ├── client.ts (modified)
│   │   │   │   ├── session.ts (modified)
│   │   │   │   ├── index.ts (modified)
│   │   │   │   └── types.ts (modified)
│   │   ├── components/
│   │   │   ├── adk/
│   │   │   │   ├── chat-interface.tsx (modified)
│   │   │   │   └── ... (other components unchanged)
├── server/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   ├── adk/
│   │   │   │   │   ├── chat/
│   │   │   │   │   │   └── route.ts (unchanged)
│   │   │   │   │   ├── ai-chat/
│   │   │   │   │   │   └── route.ts (new)
│   │   │   │   │   └── ... (other endpoints unchanged)
```

### API Endpoint Mapping

| Legacy Endpoint | New Endpoint | Purpose |
|----------------|--------------|---------|
| POST `/run_sse` | POST `/api/adk/ai-chat` | Chat message streaming with AI SDK compatibility |
| POST `/apps/orchestrator/users/{userId}/sessions` | Same | Session creation (unchanged) |
| GET `/apps/orchestrator/users/{userId}/sessions/{sessionId}` | Same | Session retrieval (unchanged) |
| POST `/documents/upload` | Same | Document upload (unchanged) |

### Message Format Conversion Examples

**UIMessage to ADK Request Format:**
```typescript
// Input UIMessage
const uiMessage = {
  id: "msg-1",
  role: "user",
  content: "Hello, I need help with birth certificate registration",
  createdAt: new Date()
};

// Converted ADK Request
const adkRequest = {
  appName: "orchestrator",
  userId: "user-123",
  sessionId: "session-abc",
  newMessage: {
    parts: [{ text: "Hello, I need help with birth certificate registration" }],
    role: "user"
  },
  streaming: true
};
```

**ADK Response to TextStreamPart Format:**
```typescript
// ADK Response Chunk
const adkResponse: ADKStreamResponse = {
  chunk: "I can help you with that. What information do you have?",
  isComplete: false,
  metadata: {
    currentAgent: "RegistrationAgent",
    processingStage: "Gathering information"
  }
};

// Converted TextStreamPart
const textStreamPart: TextStreamPart = {
  type: "text",
  content: "I can help you with that. What information do you have?"
};

// Final TextStreamPart
const finishStreamPart: TextStreamPart = {
  type: "finish",
  finishReason: "stop",
  usage: { completionTokens: 0, promptTokens: 0, totalTokens: 0 }
};
```