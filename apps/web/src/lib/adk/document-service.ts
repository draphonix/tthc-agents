import { ADKClient } from './client';
import { ADKError } from './types';
import type { DocumentUpload } from './types';
import type { DocumentFile } from '@/components/adk/document-uploader';

export class DocumentProcessingService {
  constructor(private adkClient: ADKClient) {}

  /**
   * Upload and process a single document with retry logic
   */
  async processDocument(
    sessionId: string,
    file: DocumentFile,
    onProgress?: (progress: number) => void,
    maxRetries: number = 3
  ): Promise<DocumentUpload> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Start upload
        onProgress?.(10);

        // Extract the original File object from DocumentFile
        const uploadFile = file.originalFile;

        // Upload to ADK service with exponential backoff on retry
        if (attempt > 0) {
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          onProgress?.(5); // Reset progress for retry
        }

        const upload = await this.adkClient.uploadDocument(sessionId, uploadFile);
        onProgress?.(50);

        // Poll for processing completion
        const processedUpload = await this.pollProcessingStatus(upload.id, onProgress);
        
        return processedUpload;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed for file ${file.name}:`, error);
        
        // Don't retry certain types of errors
        if (error instanceof ADKError) {
          // If it's a client error (4xx), don't retry
          if (error.status && error.status >= 400 && error.status < 500) {
            break;
          }
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }
        
        onProgress?.(0); // Reset progress for retry
      }
    }
    
    throw this.handleError(lastError, `Failed to process document after ${maxRetries + 1} attempts: ${file.name}`);
  }

  /**
   * Process multiple documents
   */
  async processDocuments(
    sessionId: string,
    files: DocumentFile[],
    onProgress?: (fileId: string, progress: number) => void,
    onFileComplete?: (fileId: string, result: DocumentUpload) => void,
    onFileError?: (fileId: string, error: string) => void
  ): Promise<DocumentUpload[]> {
    const results: DocumentUpload[] = [];
    
    // Process files in parallel with limited concurrency
    const concurrentLimit = 3;
    const batches = [];
    
    for (let i = 0; i < files.length; i += concurrentLimit) {
      batches.push(files.slice(i, i + concurrentLimit));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.processDocument(
            sessionId,
            file,
            (progress) => onProgress?.(file.id, progress)
          );
          
          onFileComplete?.(file.id, result);
          return result;
        } catch (error) {
          const errorMessage = error instanceof ADKError ? error.message : 'Processing failed';
          onFileError?.(file.id, errorMessage);
          throw error;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
    }

    return results;
  }

  /**
   * Poll for document processing status
   */
  private async pollProcessingStatus(
    uploadId: string,
    onProgress?: (progress: number) => void,
    maxAttempts: number = 30,
    interval: number = 2000
  ): Promise<DocumentUpload> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        // Note: This endpoint doesn't exist yet in the ADK client, so we'll simulate it
        // In a real implementation, this would call something like:
        // const status = await this.adkClient.getDocumentStatus(uploadId);
        
        // For now, simulate processing completion
        const progress = Math.min(50 + (attempts / maxAttempts) * 50, 100);
        onProgress?.(progress);

        if (attempts >= 3) { // Simulate completion after a few attempts
          return {
            id: uploadId,
            sessionId: '',
            filename: '',
            mimeType: '',
            size: 0,
            status: 'completed',
            results: {
              documentType: 'Birth Certificate',
              extractedData: {
                childName: 'Sample Name',
                birthDate: '2023-01-01',
                birthPlace: 'Ho Chi Minh City',
              },
              validationStatus: 'valid',
            },
          };
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    throw new ADKError('Document processing timeout', 408);
  }

  /**
   * Get processing results for a document
   */
  async getProcessingResults(uploadId: string): Promise<DocumentUpload> {
    try {
      // This would call the ADK service to get results
      // For now, return a mock response
      return {
        id: uploadId,
        sessionId: '',
        filename: '',
        mimeType: '',
        size: 0,
        status: 'completed',
        results: {
          documentType: 'Birth Certificate',
          extractedData: {},
          validationStatus: 'valid',
        },
      };
    } catch (error) {
      throw this.handleError(error, 'Failed to get processing results');
    }
  }

  /**
   * Cancel document processing
   */
  async cancelProcessing(uploadId: string): Promise<void> {
    try {
      // This would call the ADK service to cancel processing
      // For now, just simulate success
      console.log(`Cancelling processing for document: ${uploadId}`);
    } catch (error) {
      throw this.handleError(error, 'Failed to cancel processing');
    }
  }

  /**
   * Error handler for consistent error formatting
   */
  private handleError(error: unknown, context: string): ADKError {
    if (error instanceof ADKError) {
      return error;
    }

    if (error instanceof Error) {
      return new ADKError(`${context}: ${error.message}`);
    }

    return new ADKError(`${context}: Unknown error`);
  }
}

/**
 * Convert DocumentFile to native File for processing
 */
export function documentFileToFile(docFile: DocumentFile): File {
  return docFile.originalFile;
}

/**
 * Create processing results for display
 */
export function formatProcessingResults(upload: DocumentUpload) {
  if (!upload.results) return null;

  const { documentType, extractedData, validationStatus, errors, confidence } = upload.results;

  return {
    documentType,
    extractedData,
    validationStatus,
    errors: errors || [],
    confidence: confidence || 0,
    summary: `Detected: ${documentType} (${validationStatus})`,
  };
}
