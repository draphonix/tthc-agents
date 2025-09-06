import { NextRequest, NextResponse } from 'next/server';

const ADK_SERVICE_URL = process.env.ADK_SERVICE_URL || 'https://adk-service-418025649220.us-east4.run.app';

export async function POST(request: NextRequest) {
  try {
    // For now, we'll use a default user ID - later integrate with auth
    const userId = 'tthc-user-' + Date.now();
    
    const response = await fetch(
      `${ADK_SERVICE_URL}/apps/orchestrator/users/${userId}/sessions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: response.status }
      );
    }

    const session = await response.json();
    
    return NextResponse.json({
      ...session,
      userId, // Include the generated userId for client-side use
    });
  } catch (error) {
    console.error('ADK session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'sessionId and userId are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${ADK_SERVICE_URL}/apps/orchestrator/users/${userId}/sessions/${sessionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get session' },
        { status: response.status }
      );
    }

    const session = await response.json();
    return NextResponse.json(session);
  } catch (error) {
    console.error('ADK session get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'sessionId and userId are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${ADK_SERVICE_URL}/apps/orchestrator/users/${userId}/sessions/${sessionId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ADK session delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
