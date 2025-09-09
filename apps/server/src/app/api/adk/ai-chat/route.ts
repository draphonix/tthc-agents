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