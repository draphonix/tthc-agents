"use client";

import { FileText, CheckCircle, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProcessingResultsProps {
  results: {
    documentType?: string;
    extractedData?: Record<string, any>;
    validationStatus?: 'valid' | 'invalid';
    errors?: string[];
    confidence?: number;
  };
  filename?: string;
  className?: string;
}

export function ProcessingResults({ 
  results, 
  filename,
  className 
}: ProcessingResultsProps) {
  const { documentType, extractedData, validationStatus, errors, confidence } = results;

  return (
    <div className={cn("space-y-3 p-4 bg-secondary/20 rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText size={20} className="text-blue-500" />
        <div className="flex-1">
          <div className="font-medium text-sm">
            {filename || 'Document'} - Processing Complete
          </div>
          {documentType && (
            <div className="text-xs text-muted-foreground">
              Detected: {documentType}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {validationStatus && (
            <div className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
              validationStatus === 'valid' 
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            )}>
              {validationStatus === 'valid' ? (
                <CheckCircle size={12} />
              ) : (
                <AlertTriangle size={12} />
              )}
              {validationStatus === 'valid' ? 'Valid' : 'Invalid'}
            </div>
          )}
          {confidence && (
            <div className="text-xs text-muted-foreground">
              {Math.round(confidence * 100)}% confidence
            </div>
          )}
        </div>
      </div>

      {/* Extracted Data */}
      {extractedData && Object.keys(extractedData).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium flex items-center gap-2">
            <Eye size={14} />
            Extracted Information
          </div>
          <div className="grid gap-2">
            {Object.entries(extractedData).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <div className="font-medium text-muted-foreground min-w-0 flex-shrink-0 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </div>
                <div className="flex-1 break-words">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors && errors.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle size={14} />
            Issues Found
          </div>
          <div className="space-y-1">
            {errors.map((error, index) => (
              <div key={index} className="text-sm text-red-600 dark:text-red-400 pl-6">
                • {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            // TODO: Implement view details functionality
            console.log('View details:', results);
          }}
        >
          <Eye size={12} className="mr-1" />
          View Details
        </Button>
        
        {validationStatus === 'invalid' && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              // TODO: Implement retry functionality
              console.log('Retry processing');
            }}
          >
            Retry Processing
          </Button>
        )}
      </div>
    </div>
  );
}

interface ProcessingProgressProps {
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  className?: string;
}

export function ProcessingProgress({
  filename,
  status,
  progress = 0,
  error,
  className
}: ProcessingProgressProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      default: return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing...';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
    }
  };

  return (
    <div className={cn("space-y-2 p-3 bg-secondary/10 rounded-lg border", className)}>
      <div className="flex items-center gap-2">
        <FileText size={16} className="text-gray-500" />
        <span className="text-sm font-medium truncate flex-1">{filename}</span>
        <span className={cn("text-xs font-medium", getStatusColor())}>
          {getStatusText()}
        </span>
      </div>
      
      {/* Progress bar */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-600 dark:text-red-400 break-words">
          {error}
        </div>
      )}
    </div>
  );
}
