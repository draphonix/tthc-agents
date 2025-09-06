"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  onSendMessage: (message: string, files?: File[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Type your message..." 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage && files.length === 0) return;
    
    onSendMessage(trimmedMessage, files.length > 0 ? files : undefined);
    setMessage("");
    setFiles([]);
  }, [message, files, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        console.warn(`File ${file.name} is too large (max 10MB)`);
        return false;
      }
      
      // Check file type (images and PDFs)
      const allowedTypes = ['image/', 'application/pdf'];
      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        console.warn(`File ${file.name} is not a supported type`);
        return false;
      }
      
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 space-y-3">
      {/* File attachments */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Attached files ({files.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-secondary/50 rounded px-2 py-1 text-xs"
              >
                <span className="truncate max-w-32">
                  {file.name}
                </span>
                <span className="text-muted-foreground">
                  ({formatFileSize(file.size)})
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-destructive hover:text-destructive/80 ml-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* File upload button */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="relative"
            disabled={disabled}
            title="Attach files (images, PDFs)"
          >
            <Paperclip size={18} />
          </Button>
        </div>

        {/* Text input */}
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
          autoComplete="off"
        />

        {/* Send button */}
        <Button
          type="submit"
          size="icon"
          disabled={disabled || (!message.trim() && files.length === 0)}
        >
          <Send size={18} />
        </Button>
      </form>

      {/* Usage hints */}
      <div className="text-xs text-muted-foreground">
        You can ask questions about Vietnamese birth certificate registration, upload documents for analysis, or request help with the process. 
        Press Enter to send, Shift+Enter for new line.
      </div>
    </div>
  );
}
