import { NextRequest } from 'next/server';
import { streamText, convertToModelMessages } from 'ai';
import { createADKProvider } from '@/lib/adk/ai-sdk-provider';

const ADK_PROVIDER = createADKProvider({
  baseUrl: process.env.ADK_SERVICE_URL || 'https://adk-service-418025649220.us-east4.run.app',
});

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  
  // Debug: Log the received messages format
  console.log('API received messages:', JSON.stringify(messages, null, 2));
  
  // Convert UIMessages to ModelMessages if needed
  const modelMessages = convertToModelMessages(messages);
  console.log('Converted to model messages:', JSON.stringify(modelMessages, null, 2));
  
  const result = await streamText({
    model: ADK_PROVIDER.languageModel('adk-model'),
    messages: modelMessages,
  });

  // Return a UI message stream compatible with @ai-sdk/react useChat
  return result.toUIMessageStreamResponse();
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
