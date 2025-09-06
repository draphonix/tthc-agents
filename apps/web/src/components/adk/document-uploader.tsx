"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileText, Image, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
  originalFile: File;
  results?: {
    documentType?: string;
    extractedData?: Record<string, any>;
    validationStatus?: 'valid' | 'invalid';
    errors?: string[];
  };
}

interface DocumentUploaderProps {
  onFilesChange: (files: DocumentFile[]) => void;
  onRetryFile?: (file: DocumentFile) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
  files: DocumentFile[];
  className?: string;
}

export function DocumentUploader({
  onFilesChange,
  onRetryFile,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  files,
  className
}: DocumentUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach((rejection) => {
        const { file, errors } = rejection;
        errors.forEach((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              toast.error(`File "${file.name}" is too large (max ${formatFileSize(maxSize)})`);
              break;
            case 'file-invalid-type':
              toast.error(`File "${file.name}" is not a supported type (images, PDFs only)`);
              break;
            case 'too-many-files':
              toast.error(`You can only upload up to ${maxFiles} files at once`);
              break;
            default:
              toast.error(`File "${file.name}" was rejected: ${error.message}`);
          }
        });
      });
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const newFiles: DocumentFile[] = acceptedFiles.map((file) => {
        const documentFile: DocumentFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          status: 'pending',
          originalFile: file,
        };
        
        return documentFile;
      });

      // Check if adding these files would exceed the limit
      const totalFiles = files.length + newFiles.length;
      if (totalFiles > maxFiles) {
        toast.error(`You can only have up to ${maxFiles} files total`);
        return;
      }

      onFilesChange([...files, ...newFiles]);
      toast.success(`Added ${newFiles.length} file${newFiles.length === 1 ? '' : 's'} for upload`);
    }
  }, [files, onFilesChange, maxFiles, maxSize]);

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles,
    maxSize,
    disabled,
    multiple: true,
  });

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    onFilesChange(updatedFiles);
    toast.success("File removed");
  }, [files, onFilesChange]);

  const formatFileSize = (bytes: number | undefined) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: DocumentFile) => {
    const fileType = file.type || '';
    if (fileType.startsWith('image/')) {
      return <Image size={20} className="text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText size={20} className="text-red-500" />;
    }
    return <FileText size={20} className="text-gray-500" />;
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'uploading':
      case 'processing':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        );
      default:
        return null;
    }
  };

  const getStatusText = (file: DocumentFile) => {
    switch (file.status) {
      case 'pending':
        return 'Ready to upload';
      case 'uploading':
        return `Uploading... ${file.progress ? `${Math.round(file.progress)}%` : ''}`;
      case 'processing':
        return 'Processing document...';
      case 'completed':
        return file.results?.documentType ? 
          `Processed: ${file.results.documentType}` : 
          'Processing completed';
      case 'failed':
        return 'Processing failed';
      default:
        return '';
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          "hover:border-primary/50 hover:bg-primary/5",
          {
            "border-green-500 bg-green-50 dark:bg-green-950/20": isDragAccept,
            "border-red-500 bg-red-50 dark:bg-red-950/20": isDragReject,
            "border-primary bg-primary/5": isDragActive && !isDragReject,
            "border-gray-300 dark:border-gray-600": !isDragActive && !isDragAccept && !isDragReject,
            "opacity-50 cursor-not-allowed": disabled,
          }
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload 
            size={32} 
            className={cn(
              "text-gray-400",
              { 
                "text-green-500": isDragAccept,
                "text-red-500": isDragReject,
                "text-primary": isDragActive && !isDragReject,
              }
            )} 
          />
          <div className="text-sm font-medium">
            {isDragActive ? (
              isDragReject ? (
                "Some files are not supported"
              ) : (
                "Drop files here"
              )
            ) : (
              "Drag & drop documents or click to browse"
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Supports images (PNG, JPG, GIF, etc.) and PDF files up to {formatFileSize(maxSize)}
          </div>
          <div className="text-xs text-muted-foreground">
            Maximum {maxFiles} files ({files.length}/{maxFiles} uploaded)
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Attached Documents ({files.length})
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border"
              >
                {/* File icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {file.name || 'Unknown file'}
                    </span>
                    <div className="flex-shrink-0">
                      {getStatusIcon(file.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{getStatusText(file)}</span>
                  </div>
                  
                  {/* Progress bar for uploading files */}
                  {(file.status === 'uploading' && file.progress !== undefined) && (
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {/* Results display */}
                  {file.status === 'completed' && file.results && (
                    <div className="mt-2 text-xs">
                      {file.results.documentType && (
                        <div className="text-green-600 dark:text-green-400">
                          Document Type: {file.results.documentType}
                        </div>
                      )}
                      {file.results.validationStatus && (
                        <div className={cn(
                          file.results.validationStatus === 'valid' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        )}>
                          Status: {file.results.validationStatus === 'valid' ? 'Valid' : 'Invalid'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Error display */}
                  {file.status === 'failed' && file.results?.errors && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      {file.results.errors.join(', ')}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  {/* Retry button for failed files */}
                  {file.status === 'failed' && onRetryFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRetryFile(file)}
                      disabled={disabled}
                      title="Retry processing"
                    >
                      <svg 
                        width={16} 
                        height={16} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth={2}
                      >
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                    </Button>
                  )}
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => removeFile(file.id)}
                    disabled={disabled || file.status === 'uploading' || file.status === 'processing'}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
