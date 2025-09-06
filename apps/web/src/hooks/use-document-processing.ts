"use client";

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { DocumentFile } from '@/components/adk/document-uploader';

interface ProcessingStatus {
  fileId: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  results?: {
    documentType?: string;
    extractedData?: Record<string, any>;
    validationStatus?: 'valid' | 'invalid';
    errors?: string[];
  };
}

interface UseDocumentProcessingOptions {
  sessionId: string;
  onFileComplete?: (fileId: string, results: any) => void;
  onFileError?: (fileId: string, error: string) => void;
  onAllComplete?: (results: any[]) => void;
}

export function useDocumentProcessing({
  sessionId,
  onFileComplete,
  onFileError,
  onAllComplete,
}: UseDocumentProcessingOptions) {
  const [processingStatus, setProcessingStatus] = useState<Map<string, ProcessingStatus>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  // Update file status
  const updateFileStatus = useCallback((fileId: string, update: Partial<ProcessingStatus>) => {
    setProcessingStatus(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(fileId) || { 
        fileId, 
        status: 'pending' as const, 
        progress: 0 
      };
      newMap.set(fileId, { ...current, ...update });
      return newMap;
    });
  }, []);

  // Process a single file
  const processFile = useCallback(async (file: DocumentFile): Promise<void> => {
    const fileId = file.id;
    let abortController: AbortController | undefined;

    try {
      // Create abort controller for this file
      abortController = new AbortController();
      abortControllersRef.current.set(fileId, abortController);

      // Initialize status
      updateFileStatus(fileId, { status: 'uploading', progress: 0 });

      // Prepare form data
      const formData = new FormData();
      formData.append('files', file.originalFile);
      formData.append('sessionId', sessionId);

      // Start upload with progress simulation
      const uploadProgressInterval = setInterval(() => {
        const currentStatus = processingStatus.get(fileId);
        const currentProgress = currentStatus?.progress || 0;
        updateFileStatus(fileId, {
          progress: Math.min(currentProgress + Math.random() * 10, 45),
        });
      }, 200);

      try {
        const response = await fetch('/api/adk/documents/upload', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
        });

        clearInterval(uploadProgressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        
        if (!data.success || data.results.length === 0) {
          throw new Error('Upload failed: No results returned');
        }

        const result = data.results[0];
        
        if (result.status === 'failed') {
          throw new Error(result.error || 'Processing failed');
        }

        // Update to processing state
        updateFileStatus(fileId, { 
          status: 'processing', 
          progress: 50 
        });

        // Simulate processing progress
        const processingProgressInterval = setInterval(() => {
          const currentStatus = processingStatus.get(fileId);
          const currentProgress = currentStatus?.progress || 50;
          updateFileStatus(fileId, {
            progress: Math.min(currentProgress + Math.random() * 5, 95),
          });
        }, 500);

        // Poll for completion (simulated)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        
        clearInterval(processingProgressInterval);

        // Mark as completed
        const mockResults = {
          documentType: 'Birth Certificate',
          extractedData: {
            childName: 'Sample Name',
            birthDate: '2023-01-01',
            birthPlace: 'Ho Chi Minh City',
            parentName: 'Sample Parent Name',
          },
          validationStatus: 'valid' as const,
        };

        updateFileStatus(fileId, { 
          status: 'completed', 
          progress: 100,
          results: mockResults,
        });

        onFileComplete?.(fileId, mockResults);
        toast.success(`${file.name} processed successfully`);

      } catch (fetchError) {
        clearInterval(uploadProgressInterval);
        throw fetchError;
      }

    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      updateFileStatus(fileId, { 
        status: 'failed', 
        error: errorMessage,
      });

      onFileError?.(fileId, errorMessage);
      
      if (error instanceof Error && error.name !== 'AbortError') {
        toast.error(`Failed to process ${file.name}: ${errorMessage}`);
      }
    } finally {
      // Clean up abort controller
      if (abortController) {
        abortControllersRef.current.delete(fileId);
      }
    }
  }, [sessionId, updateFileStatus, onFileComplete, onFileError]);

  // Process multiple files
  const processFiles = useCallback(async (files: DocumentFile[]) => {
    if (!sessionId) {
      toast.error('No active session. Please refresh and try again.');
      return;
    }

    if (files.length === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize all files as pending
      files.forEach(file => {
        updateFileStatus(file.id, { 
          status: 'pending', 
          progress: 0 
        });
      });

      // Process files with limited concurrency
      const concurrency = 2;
      const results = [];

      for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency);
        const batchPromises = batch.map(file => processFile(file));
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
      }

      // Collect successful results
      const successfulResults = Array.from(processingStatus.values())
        .filter(status => status.status === 'completed')
        .map(status => status.results)
        .filter(Boolean);

      onAllComplete?.(successfulResults);

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} document${successCount === 1 ? '' : 's'}`);
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to process ${failureCount} document${failureCount === 1 ? '' : 's'}`);
      }

    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process documents');
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, processFile, onAllComplete, processingStatus]);

  // Cancel processing for a specific file
  const cancelFileProcessing = useCallback((fileId: string) => {
    const abortController = abortControllersRef.current.get(fileId);
    if (abortController) {
      abortController.abort();
      abortControllersRef.current.delete(fileId);
    }

    updateFileStatus(fileId, { 
      status: 'failed', 
      error: 'Cancelled by user' 
    });

    toast.info('Processing cancelled');
  }, [updateFileStatus]);

  // Cancel all processing
  const cancelAllProcessing = useCallback(() => {
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();

    setProcessingStatus(prev => {
      const newMap = new Map(prev);
      newMap.forEach((status, fileId) => {
        if (status.status === 'uploading' || status.status === 'processing') {
          newMap.set(fileId, {
            ...status,
            status: 'failed',
            error: 'Cancelled by user',
          });
        }
      });
      return newMap;
    });

    setIsProcessing(false);
    toast.info('All processing cancelled');
  }, []);

  // Retry processing for a specific file
  const retryFile = useCallback((file: DocumentFile) => {
    updateFileStatus(file.id, { 
      status: 'pending', 
      progress: 0, 
      error: undefined 
    });
    
    processFile(file);
  }, [updateFileStatus, processFile]);

  // Get processing status for all files
  const getProcessingStatuses = useCallback((): ProcessingStatus[] => {
    return Array.from(processingStatus.values());
  }, [processingStatus]);

  // Get processing status for a specific file
  const getFileStatus = useCallback((fileId: string): ProcessingStatus | undefined => {
    return processingStatus.get(fileId);
  }, [processingStatus]);

  // Clear processing status
  const clearProcessingStatus = useCallback(() => {
    setProcessingStatus(new Map());
    abortControllersRef.current.clear();
  }, []);

  return {
    processingStatus: getProcessingStatuses(),
    isProcessing,
    processFiles,
    cancelFileProcessing,
    cancelAllProcessing,
    retryFile,
    getFileStatus,
    clearProcessingStatus,
  };
}
