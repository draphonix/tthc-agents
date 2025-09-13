# ADK Integration with Vercel AI SDK - Plan

## Current State Analysis

### ADK Response Format
The ADK service returns Server-Sent Events (SSE) with the following format:
```
data: {"content":{"parts":[{"thoughtSignature":"...","text":"Of course! I can certainly help you with that..."}],"role":"model"},"partial":true,"usageMetadata":{"trafficType":"ON_DEMAND"},"invocationId":"...","author":"OrchestratorAgent","actions":{},"id":"...","timestamp":...}
```

### Current Implementation Issues
1. The ADK client is not properly parsing the SSE format from ADK
2. The AI SDK provider is not correctly handling the ADK response structure
3. The streaming response is not being formatted correctly for the Vercel AI SDK

## Integration Plan

### 1. Implement ADK Response Parser for SSE Format

**Goal**: Create a parser that can properly extract text content from ADK's SSE responses.

**Implementation Details**:
- Create a new parser function that can handle the SSE format
- Extract text content from the `content.parts[0].text` field
- Handle both partial and complete responses
- Extract metadata like `finishReason`, `usageMetadata`, etc.

**Files to Modify**:
- `apps/server/src/lib/adk/types.ts` - Add new types for parsed ADK responses
- `apps/web/src/lib/adk/types.ts` - Add new types for parsed ADK responses

### 2. Update ADK Client to Properly Parse SSE Chunks

**Goal**: Modify the ADK client to parse SSE chunks correctly and extract meaningful content.

**Implementation Details**:
- Update the `sendMessage` method in the ADK client
- Parse each SSE chunk to extract JSON data
- Extract text content from the parsed data
- Handle partial responses (when `partial: true`)
- Handle complete responses (when `finishReason` is present)

**Files to Modify**:
- `apps/server/src/lib/adk/client.ts`
- `apps/web/src/lib/adk/client.ts`

### 3. Update AI SDK Provider to Handle ADK Response Format

**Goal**: Modify the AI SDK provider to properly format ADK responses for the Vercel AI SDK.

**Implementation Details**:
- Update the `doStream` method in the ADK language model
- Format the streaming response according to Vercel AI SDK expectations
- Handle text deltas properly
- Include metadata when available

**Files to Modify**:
- `apps/server/src/lib/adk/ai-sdk-provider.ts`
- `apps/web/src/lib/adk/ai-sdk-provider.ts`

### 4. Test the Integration with a Sample Message

**Goal**: Verify that the integration works correctly with a test message.

**Implementation Details**:
- Create a test script that sends a message to the ADK service
- Verify that the response is properly streamed
- Check that the text content is correctly extracted and displayed
- Ensure that the streaming works as expected

**Files to Create/Modify**:
- Create a test script or update existing test files

## Detailed Implementation Steps

### Step 1: Add New Types for Parsed ADK Responses

Add the following interfaces to both `apps/server/src/lib/adk/types.ts` and `apps/web/src/lib/adk/types.ts`:

```typescript
export interface ADKSSEChunk {
  content: {
    parts: Array<{
      thoughtSignature?: string;
      text: string;
    }>;
    role: string;
  };
  partial: boolean;
  usageMetadata?: {
    trafficType: string;
    candidatesTokenCount?: number;
    promptTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
  invocationId: string;
  author: string;
  actions: {
    stateDelta: Record<string, any>;
    artifactDelta: Record<string, any>;
    requestedAuthConfigs: Record<string, any>;
  };
  id: string;
  timestamp: number;
  finishReason?: string;
}

export interface ParsedADKResponse {
  text: string;
  isPartial: boolean;
  isComplete: boolean;
  metadata?: {
    finishReason?: string;
    usageMetadata?: any;
    author?: string;
    invocationId?: string;
  };
}
```

### Step 2: Update ADK Client to Parse SSE Chunks

Modify the `sendMessage` method in both ADK client implementations:

```typescript
async *sendMessage(
  sessionId: string,
  request: ADKInvokeRequest
): AsyncGenerator<ADKStreamResponse, void, unknown> {
  try {
    // ... existing code to send request ...

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
```

### Step 3: Update AI SDK Provider to Handle ADK Response Format

Modify the `doStream` method in both AI SDK provider implementations:

```typescript
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
```

### Step 4: Update the API Route for Proper Headers

Update the API route in `apps/web/src/app/api/adk/ai-chat/route.ts` to include proper headers for streaming:

```typescript
export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  
  // Convert UIMessages to ModelMessages if needed
  const modelMessages = convertToModelMessages(messages);
  
  const result = await streamText({
    model: ADK_PROVIDER.languageModel('adk-model'),
    messages: modelMessages,
  });

  // Return a UI message stream compatible with @ai-sdk/react useChat
  // Add proper headers for streaming
  return result.toUIMessageStreamResponse({
    headers: {
      'Transfer-Encoding': 'chunked',
      'Connection': 'keep-alive',
      'Content-Encoding': 'none',
    },
  });
}
```

## Acceptance Criteria Verification

After implementing these changes, we should be able to:

1. **Send a message**: The user should be able to send a message through the chat interface.
2. **Get streaming response**: The response should be streamed in real-time, with text appearing as it's received.
3. **Display response correctly**: The complete response should be displayed correctly in the chat interface.

## Testing Plan

1. **Unit Testing**: Test each component individually (parser, client, provider).
2. **Integration Testing**: Test the entire flow from sending a message to receiving the response.
3. **End-to-End Testing**: Test the complete user experience in the browser.

## Rollback Plan

If any issues arise during implementation, we can:
1. Revert to the previous implementation
2. Implement a fallback mechanism
3. Use a non-streaming approach as a temporary solution

## Timeline

- **Day 1**: Implement ADK response parser and update types
- **Day 2**: Update ADK client to properly parse SSE chunks
- **Day 3**: Update AI SDK provider to handle ADK response format
- **Day 4**: Test and debug the integration
- **Day 5**: Final testing and documentation
