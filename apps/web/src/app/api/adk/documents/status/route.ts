import { NextRequest, NextResponse } from 'next/server';
import { ADKClient } from '@/lib/adk/client';
import { DocumentProcessingService } from '@/lib/adk/document-service';
import { ADKError } from '@/lib/adk/types';

// Placeholder for user ID - in real app, this would come from auth
const PLACEHOLDER_USER_ID = 'user-123';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get('uploadId');

  if (!uploadId) {
    return NextResponse.json(
      { error: 'Upload ID is required' },
      { status: 400 }
    );
  }

  try {
    const adkClient = new ADKClient(PLACEHOLDER_USER_ID);
    const processingService = new DocumentProcessingService(adkClient);
    
    const result = await processingService.getProcessingResults(uploadId);
    
    return NextResponse.json({
      success: true,
      uploadId,
      status: result.status,
      results: result.results,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
    });
  } catch (error) {
    console.error('Get processing status error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof ADKError ? error.message : 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uploadId = searchParams.get('uploadId');

  if (!uploadId) {
    return NextResponse.json(
      { error: 'Upload ID is required' },
      { status: 400 }
    );
  }

  try {
    const adkClient = new ADKClient(PLACEHOLDER_USER_ID);
    const processingService = new DocumentProcessingService(adkClient);
    
    await processingService.cancelProcessing(uploadId);
    
    return NextResponse.json({
      success: true,
      message: 'Processing cancelled successfully',
      uploadId,
    });
  } catch (error) {
    console.error('Cancel processing error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof ADKError ? error.message : 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
