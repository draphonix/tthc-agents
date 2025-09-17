"use client";

import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Response } from "@/components/response";
import { validateFile, formatFileSize } from "@/lib/file-utils";
import type {
  DocumentExtractionData,
  DocumentExtractionFields
} from "@/lib/types/ai-artifacts";
import { DocumentExtractionFieldsSchema } from "@/lib/schemas/document-extraction";

interface UploadDocumentationProps {
  onUploadComplete?: (data: DocumentExtractionData) => void;
  className?: string;
  reason?: string;
  isInChat?: boolean;
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
  documentName?: string;
  documentId?: string;
  source?: "chat-panel" | "artifact";
  onExtractionComplete?: (data: DocumentExtractionData) => void;
  
  // New props for external state management
  files?: File[];
  isUploading?: boolean;
  error?: string | null;
  messages?: any[];
  onFilesChange?: (files: File[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  onErrorChange?: (error: string | null) => void;
  onMessagesChange?: (messages: any[]) => void;
  onReset?: () => void;
}

export function UploadDocumentation({
  onUploadComplete,
  className = "",
  reason = "",
  isInChat = false,
  collapsed = false,
  onCollapseChange,
  documentName,
  documentId,
  source = "chat-panel",
  onExtractionComplete,
  // External state props
  files: externalFiles,
  isUploading: externalIsUploading,
  error: externalError,
  messages: externalMessages,
  onFilesChange,
  onUploadingChange,
  onErrorChange,
  onMessagesChange,
  onReset
}: UploadDocumentationProps) {
  // Use external state if provided, otherwise use internal state
  const useExternalState = externalFiles !== undefined &&
                          externalIsUploading !== undefined &&
                          externalError !== undefined &&
                          externalMessages !== undefined &&
                          onFilesChange &&
                          onUploadingChange &&
                          onErrorChange &&
                          onMessagesChange;
  
  const [internalFiles, setInternalFiles] = useState<File[]>([]);
  const [internalIsUploading, setInternalIsUploading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use external or internal state
  const currentFiles = useExternalState ? externalFiles! : internalFiles;
  const currentIsUploading = useExternalState ? externalIsUploading! : internalIsUploading;
  const currentError = useExternalState ? externalError! : internalError;
  const currentMessages = useExternalState ? externalMessages! : internalMessages;
  
  // Use external or internal state setters
  const setCurrentFiles = (files: File[] | ((prev: File[]) => File[])) => {
    if (useExternalState) {
      onFilesChange!(typeof files === 'function' ? files(internalFiles) : files);
    } else {
      setInternalFiles(files);
    }
  };
  
  const setCurrentIsUploading = (isUploading: boolean) => {
    if (useExternalState) {
      onUploadingChange!(isUploading);
    } else {
      setInternalIsUploading(isUploading);
    }
  };
  
  const setCurrentError = (error: string | null) => {
    if (useExternalState) {
      onErrorChange!(error);
    } else {
      setInternalError(error);
    }
  };
  
  const setCurrentMessages = (messages: any[]) => {
    if (useExternalState) {
      onMessagesChange!(messages);
    } else {
      setInternalMessages(messages);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    setCurrentError(null);
    
    // Validate each file
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(validation.error || `Invalid file: ${file.name}`);
      }
    });
    
    if (invalidFiles.length > 0) {
      setCurrentError(invalidFiles.join(". "));
    }
    
    if (validFiles.length > 0) {
      setCurrentFiles(validFiles);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md', '.markdown'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024, // 10 MB
    multiple: false, // MVP: single file only
  });

  const removeFile = (index: number) => {
    setCurrentFiles((prev: File[]) => prev.filter((_: File, i: number) => i !== index));
  };

  const handleUpload = async () => {
    if (currentFiles.length === 0) {
      setCurrentError("Please select a file to upload");
      return;
    }

    setCurrentIsUploading(true);
    setCurrentError(null);
    
    // Clear previous messages
    setCurrentMessages([]);
    
    // Get the file
    const file = currentFiles[0];
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Send the file to the extraction endpoint using fetch directly
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/ai/extract`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      // Add a placeholder message to indicate processing started
      setCurrentMessages([buildStreamingMessage("Processing document...")]);
      
      // Since we're using TextStreamChatTransport, we need to manually handle the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let rawText = "";

      if (reader) {
        let result = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          rawText = result;

          // Update the message with the accumulated result
          setCurrentMessages([buildStreamingMessage(result)]);
        }
        rawText += decoder.decode();
      } else {
        rawText = await response.text();
      }

      rawText = rawText.trim();
      setCurrentMessages([buildCompletedMessage(rawText)]);

      const extraction: DocumentExtractionData = {
        documentId: documentId ?? file.name,
        fileName: file.name,
        rawText,
        extractedFields: parseExtractionResult(rawText),
        documentType: detectDocumentType(rawText),
        confidence: 0.8,
        uploadedAt: new Date().toISOString(),
        source,
      };

      onExtractionComplete?.(extraction);
      onUploadComplete?.(extraction);

      if (onCollapseChange) {
        onCollapseChange(true);
      }

      setCurrentIsUploading(false);
      
    } catch (error) {
      setCurrentIsUploading(false);
      setCurrentError(error instanceof Error ? error.message : "Failed to upload file");
    }
  };

  const resetUpload = () => {
    if (useExternalState && onReset) {
      onReset();
    } else {
      setCurrentFiles([]);
      setCurrentError(null);
      setCurrentMessages([]);
    }
    // Expand when resetting
    if (onCollapseChange) {
      onCollapseChange(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Document header when collapsed */}
      {collapsed && currentMessages.length > 0 && (
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{documentName || "Uploaded Document"}</p>
              <p className="text-xs text-muted-foreground">Click to view extracted information</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCollapseChange?.(false)}
          >
            View
          </Button>
        </div>
      )}
      
      {/* Reason for upload */}
      {reason && !collapsed && (
        <div className="text-sm text-muted-foreground mb-2">
          I need to see your document to {reason}. Please upload it below.
        </div>
      )}
      
      {/* File Upload Area */}
      {currentFiles.length === 0 && !collapsed && (
        <Card>
          <CardContent className={`p-6 ${isInChat ? 'p-4' : ''}`}>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              } ${isInChat ? 'p-4' : 'p-8'}`}
            >
              <input {...getInputProps()} />
              <Upload className={`mx-auto text-muted-foreground mb-2 ${isInChat ? 'h-8 w-8' : 'h-12 w-12'}`} />
              <p className={`font-medium mb-2 ${isInChat ? 'text-sm' : 'text-lg'}`}>
                {isDragActive ? "Drop your file here" : "Upload Documentation"}
              </p>
              <p className={`text-muted-foreground mb-2 ${isInChat ? 'text-xs' : 'text-sm'}`}>
                Drag and drop a file here, or click to browse
              </p>
              <p className={`text-muted-foreground ${isInChat ? 'text-xs' : 'text-xs'}`}>
                Supported formats: PDF, DOCX, TXT, MD, Images (max 10MB)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {currentFiles.length > 0 && !collapsed && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Selected File</h3>
              {currentFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type || "Unknown type"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(index)}
                    disabled={currentIsUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={resetUpload} disabled={currentIsUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={currentIsUploading}>
                {currentIsUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Extract Information"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {currentError && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{currentError}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {currentMessages.length > 0 && !collapsed && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Extracted Information</h3>
              <div className="space-y-4">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary/10 ml-8"
                        : "bg-secondary/20 mr-8"
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {message.role === "user" ? "You" : "AI Assistant"}
                    </p>
                    {message.parts?.map((part: any, index: number) => {
                      if (part.type === "text") {
                        return <Response key={index}>{part.text}</Response>;
                      }
                      return null;
                    })}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <Button variant="outline" onClick={resetUpload}>
                  Upload Another File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function buildStreamingMessage(text: string) {
  return {
    id: "extraction-stream",
    role: "assistant",
    parts: [{ type: "text", text }],
  };
}

function buildCompletedMessage(text: string) {
  const content = text.length > 0 ? text : "Không có dữ liệu trích xuất.";
  return {
    id: "extraction-result",
    role: "assistant",
    parts: [{ type: "text", text: content }],
  };
}

function parseExtractionResult(rawText: string): DocumentExtractionFields | undefined {
  const jsonMatch = rawText.match(/\{[\s\S]*\}$/m);
  if (!jsonMatch) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return DocumentExtractionFieldsSchema.parse(parsed);
  } catch (error) {
    console.warn("Failed to parse extraction JSON", error);
    return undefined;
  }
}

function detectDocumentType(rawText: string): string | undefined {
  const lowered = rawText.toLowerCase();
  if (lowered.includes("giay khai sinh") || lowered.includes("birth certificate")) {
    return "birthCertificate";
  }
  if (lowered.includes("marriage certificate") || lowered.includes("đăng ký kết hôn")) {
    return "marriageCertificate";
  }
  return undefined;
}
