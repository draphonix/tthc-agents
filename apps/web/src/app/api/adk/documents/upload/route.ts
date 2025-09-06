import { NextRequest, NextResponse } from 'next/server';
import { ADKClient } from '@/lib/adk/client';
import { DocumentProcessingService } from '@/lib/adk/document-service';
import { ADKError } from '@/lib/adk/types';
import type { DocumentFile } from '@/components/adk/document-uploader';

// Placeholder for user ID - in real app, this would come from auth
const PLACEHOLDER_USER_ID = 'user-123';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const sessionId = formData.get('sessionId') as string;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/', 'application/pdf'];

    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large (max 10MB)` },
          { status: 400 }
        );
      }

      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        return NextResponse.json(
          { error: `File ${file.name} is not a supported type` },
          { status: 400 }
        );
      }
    }

    // Initialize ADK client and processing service
    const adkClient = new ADKClient(PLACEHOLDER_USER_ID);
    const processingService = new DocumentProcessingService(adkClient);

    // Process files
    const results = [];
    
    for (const file of files) {
      try {
        // Convert File to DocumentFile format
        const documentFile: DocumentFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          status: 'pending',
          originalFile: file,
        };

        const result = await processingService.processDocument(sessionId, documentFile);
        results.push({
          id: documentFile.id,
          filename: file.name,
          status: 'uploaded',
          uploadResult: result,
        });
      } catch (error) {
        console.error(`Failed to process file ${file.name}:`, error);
        results.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: file.name,
          status: 'failed',
          error: error instanceof ADKError ? error.message : 'Processing failed',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalFiles: files.length,
      successfulUploads: results.filter(r => r.status === 'uploaded').length,
    });

  } catch (error) {
    console.error('Document upload error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof ADKError ? error.message : 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

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
      result,
    });
  } catch (error) {
    console.error('Get processing results error:', error);
    
    return NextResponse.json(
      {
        error: error instanceof ADKError ? error.message : 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
