"use client";

import { useState, useCallback } from "react";
import { Send, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentUploader, type DocumentFile } from "./document-uploader";

interface MessageInputProps {
  onSendMessage: (message: string, files?: DocumentFile[]) => void;
  onRetryFile?: (file: DocumentFile) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSendMessage, 
  onRetryFile,
  disabled = false,
  placeholder = "Type your message..." 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [showUploader, setShowUploader] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage && files.length === 0) return;
    
    onSendMessage(trimmedMessage, files.length > 0 ? files : undefined);
    setMessage("");
    setFiles([]);
    setShowUploader(false);
  }, [message, files, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleFilesChange = useCallback((newFiles: DocumentFile[]) => {
    setFiles(newFiles);
  }, []);

  const toggleUploader = useCallback(() => {
    setShowUploader(prev => !prev);
  }, []);

  return (
    <div className="p-4 space-y-3">
      {/* Document uploader (when toggled) */}
      {showUploader && (
        <DocumentUploader
          files={files}
          onFilesChange={handleFilesChange}
          onRetryFile={onRetryFile}
          disabled={disabled}
          className="border rounded-lg p-4 bg-secondary/20"
        />
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* File upload toggle button */}
        <Button
          type="button"
          variant={showUploader ? "default" : "outline"}
          size="icon"
          onClick={toggleUploader}
          disabled={disabled}
          title="Upload documents"
        >
          <Upload size={18} />
        </Button>

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
