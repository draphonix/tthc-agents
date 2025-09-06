import { NextRequest, NextResponse } from 'next/server';

const ADK_SERVICE_URL = process.env.ADK_SERVICE_URL || 'https://adk-service-418025649220.us-east4.run.app';

export async function GET(request: NextRequest) {
  try {
    // Check ADK service health
    const adkHealthResponse = await fetch(`${ADK_SERVICE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const adkHealth = await adkHealthResponse.json();

    // Check list-apps endpoint to verify connectivity
    const appsResponse = await fetch(`${ADK_SERVICE_URL}/list-apps`, {
      method: 'GET',
    });
    
    const apps = await appsResponse.json();

    return NextResponse.json({
      status: 'healthy',
      adkService: {
        url: ADK_SERVICE_URL,
        health: adkHealth,
        availableApps: apps,
        lastChecked: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('ADK health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Failed to connect to ADK service',
        adkService: {
          url: ADK_SERVICE_URL,
          lastChecked: new Date().toISOString(),
        },
      },
      { status: 503 }
    );
  }
}
