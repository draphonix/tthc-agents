"use client";

import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Response } from "@/components/response";
import {
  validateFile,
  formatFileSize,
  isFileTypeAllowed,
  isFileSizeAllowed,
  type AllowedFileType
} from "@/lib/file-utils";

interface UploadDocumentationProps {
  onUploadComplete?: (data: any) => void;
  className?: string;
  reason?: string;
  isInChat?: boolean;
}

export function UploadDocumentation({
  onUploadComplete,
  className = "",
  reason = "",
  isInChat = false
}: UploadDocumentationProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, setMessages, sendMessage } = useChat({
    transport: new TextStreamChatTransport({
      api: `${process.env.NEXT_PUBLIC_SERVER_URL}/ai/extract`,
    }),
    onFinish: (message) => {
      setIsUploading(false);
      if (onUploadComplete) {
        onUploadComplete(message);
      }
    },
    onError: (error) => {
      setIsUploading(false);
      setError(error.message || "Failed to process document");
    },
  });

  const onDrop = (acceptedFiles: File[]) => {
    setError(null);
    
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
      setError(invalidFiles.join(". "));
    }
    
    if (validFiles.length > 0) {
      setFiles(validFiles);
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
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    setError(null);
    
    // Clear previous messages
    setMessages([]);
    
    // Get the file
    const file = files[0];
    
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
      setMessages([{
        id: Date.now().toString(),
        role: "assistant",
        parts: [{ type: "text", text: "Processing document..." }],
      }]);
      
      // Since we're using TextStreamChatTransport, we need to manually handle the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let result = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          result += chunk;
          
          // Update the message with the accumulated result
          setMessages([{
            id: Date.now().toString(),
            role: "assistant",
            parts: [{ type: "text", text: result }],
          }]);
        }
      }
      
      setIsUploading(false);
      
    } catch (error) {
      setIsUploading(false);
      setError(error instanceof Error ? error.message : "Failed to upload file");
    }
  };

  const resetUpload = () => {
    setFiles([]);
    setError(null);
    setMessages([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Reason for upload */}
      {reason && (
        <div className="text-sm text-muted-foreground mb-2">
          I need to see your document to {reason}. Please upload it below.
        </div>
      )}
      
      {/* File Upload Area */}
      {files.length === 0 && (
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
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Selected File</h3>
              {files.map((file, index) => (
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
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={resetUpload} disabled={isUploading}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
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
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {messages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Extracted Information</h3>
              <div className="space-y-4">
                {messages.map((message) => (
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
                    {message.parts?.map((part, index) => {
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