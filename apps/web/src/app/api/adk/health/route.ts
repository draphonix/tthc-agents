import { NextRequest, NextResponse } from 'next/server';
import { ADKClient } from '@/lib/adk/client';
import { ADKError } from '@/lib/adk/types';

// Placeholder for user ID - in real app, this would come from auth
const PLACEHOLDER_USER_ID = 'user-123';

export async function GET(request: NextRequest) {
  try {
    const adkClient = new ADKClient(PLACEHOLDER_USER_ID);
    
    // Test ADK service health
    const health = await adkClient.healthCheck();
    
    return NextResponse.json({
      status: 'healthy',
      adkService: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    const isADKError = error instanceof ADKError;
    const statusCode = isADKError && error.status ? error.status : 500;
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: isADKError ? error.message : 'Service unavailable',
        timestamp: new Date().toISOString(),
        details: {
          adkService: 'unavailable',
          reason: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: statusCode }
    );
  }
}
