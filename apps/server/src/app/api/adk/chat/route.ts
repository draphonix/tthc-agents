import { NextRequest, NextResponse } from 'next/server';

const ADK_SERVICE_URL = process.env.ADK_SERVICE_URL || 'https://adk-service-418025649220.us-east4.run.app';

export const maxDuration = 60; // 60 seconds for long AI responses

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, userId, message, files, metadata } = body;

    if (!sessionId || !userId || !message) {
      return NextResponse.json(
        { error: 'sessionId, userId, and message are required' },
        { status: 400 }
      );
    }

    // Prepare the request payload for ADK
    const adkRequest = {
      appName: 'orchestrator',
      userId,
      sessionId,
      newMessage: {
        parts: [{ text: message }],
        role: 'user',
      },
      streaming: true,
      ...(metadata && { stateDelta: metadata }),
    };

    const response = await fetch(
      `${ADK_SERVICE_URL}/run_sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adkRequest),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('ADK invoke error:', error);
      return NextResponse.json(
        { error: 'Failed to invoke ADK service' },
        { status: response.status }
      );
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            // Decode the chunk and send it to the client
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('ADK chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
