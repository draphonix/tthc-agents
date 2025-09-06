"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ADKClient } from "@/lib/adk/client";
import { ADKSessionHook } from "@/lib/adk/session";
import type { ADKSession, ChatMessage, ADKStreamResponse } from "@/lib/adk/types";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { AgentStatusIndicator } from "./agent-status-indicator";
import { ADKError } from "@/lib/adk/types";
import { useDocumentProcessing } from "@/hooks/use-document-processing";
import type { DocumentFile } from "./document-uploader";
import { NetworkStatus } from "./network-status";
import { toast } from "sonner";

// Placeholder for user ID - in real app, this would come from auth
const PLACEHOLDER_USER_ID = "user-123";

export function ADKChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<ADKSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const adkClientRef = useRef<ADKClient | null>(null);
  const sessionHookRef = useRef<ADKSessionHook | null>(null);

  // Document processing hook
  const {
    processingStatus,
    isProcessing: isDocProcessing,
    processFiles,
    clearProcessingStatus,
  } = useDocumentProcessing({
    sessionId: currentSession?.id || '',
    onFileComplete: (fileId, results) => {
      // Add processing results to chat
      const resultsMessage: ChatMessage = {
        id: `results-${Date.now()}`,
        role: "assistant",
        content: `Document processed successfully:\n\n**Document Type:** ${results.documentType}\n**Status:** ${results.validationStatus}\n\n**Extracted Information:**\n${Object.entries(results.extractedData || {}).map(([key, value]) => `- **${key}:** ${value}`).join('\n')}`,
        timestamp: new Date().toISOString(),
        metadata: {
          agent: "DocumentProcessor",
          documents: [fileId],
          processingResults: results,
        },
      };
      setMessages(prev => [...prev, resultsMessage]);
    },
    onFileError: (fileId, error) => {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Failed to process document: ${error}`,
        timestamp: new Date().toISOString(),
        metadata: {
          agent: "DocumentProcessor",
          documents: [fileId],
        },
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  // Initialize ADK client and session
  useEffect(() => {
    const initializeADK = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Initialize ADK client
        const client = new ADKClient(PLACEHOLDER_USER_ID);
        adkClientRef.current = client;

        // Initialize session hook
        const sessionHook = new ADKSessionHook(client);
        sessionHookRef.current = sessionHook;

        // Test connection
        await client.healthCheck();

        // Get or create session
        const session = await sessionHook.getOrCreateSession();
        setCurrentSession(session);

        // Add welcome message
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your ADK Assistant, here to help you with Vietnamese birth certificate registration. How can I assist you today?",
            timestamp: new Date().toISOString(),
            metadata: {
              agent: "OrchestratorAgent",
            },
          },
        ]);

        setIsConnecting(false);
      } catch (error) {
        console.error("Failed to initialize ADK:", error);
        setError(error instanceof ADKError ? error.message : "Failed to connect to ADK service");
        setIsConnecting(false);
        toast.error("Failed to connect to ADK service");
      }
    };

    initializeADK();
  }, []);

  const sendMessage = useCallback(async (content: string, files?: DocumentFile[]) => {
    if (!currentSession || !adkClientRef.current || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setCurrentAgent("OrchestratorAgent");
      setProcessingStage("Processing your request...");

      // Add user message to chat
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content,
        timestamp: new Date().toISOString(),
        metadata: files && files.length > 0 ? {
          documents: files.map(f => f.id),
        } : undefined,
      };

      setMessages(prev => [...prev, userMessage]);

      // If files are uploaded, process them first
      if (files && files.length > 0) {
        setCurrentAgent("DocumentProcessor");
        setProcessingStage("Processing uploaded documents...");
        
        try {
          await processFiles(files);
        } catch (error) {
          console.error('Document processing error:', error);
          toast.error('Failed to process documents');
        }
        
        // Continue with normal message processing after documents are handled
        if (!content.trim()) {
          setIsLoading(false);
          setCurrentAgent(null);
          setProcessingStage(null);
          return;
        }
      }

      // Prepare request - convert DocumentFiles to Files if needed
      const request = {
        message: content,
        files: files?.map(f => f.originalFile),
        metadata: {},
      };

      // Start assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        metadata: {
          agent: "OrchestratorAgent",
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Stream response
      const stream = adkClientRef.current.sendMessage(currentSession.id, request);
      let fullContent = "";

      for await (const response of stream) {
        if (response.chunk) {
          fullContent += response.chunk;
          
          // Update current message with streaming content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: fullContent }
                : msg
            )
          );

          // Update agent status from metadata if available
          if (response.metadata) {
            if (response.metadata.currentAgent) {
              setCurrentAgent(response.metadata.currentAgent);
            }
            if (response.metadata.processingStage) {
              setProcessingStage(response.metadata.processingStage);
            }
          }
        }

        if (response.isComplete) {
          setCurrentAgent(null);
          setProcessingStage(null);
          break;
        }
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage = error instanceof ADKError ? error.message : "Failed to send message";
      setError(errorMessage);
      toast.error(errorMessage);

      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date().toISOString(),
        metadata: {
          agent: "System",
        },
      };

      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
      setCurrentAgent(null);
      setProcessingStage(null);
    }
  }, [currentSession, isLoading]);

  const retryConnection = useCallback(async () => {
    if (!sessionHookRef.current || !adkClientRef.current) {
      window.location.reload();
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Test connection
      await adkClientRef.current.healthCheck();

      // Try to restore or create new session
      const session = await sessionHookRef.current.getOrCreateSession();
      setCurrentSession(session);

      setIsConnecting(false);
      toast.success("Reconnected successfully!");
    } catch (error) {
      console.error("Failed to retry connection:", error);
      setError(error instanceof ADKError ? error.message : "Failed to reconnect");
      setIsConnecting(false);
      toast.error("Failed to reconnect");
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your ADK Assistant, here to help you with Vietnamese birth certificate registration. How can I assist you today?",
        timestamp: new Date().toISOString(),
        metadata: {
          agent: "OrchestratorAgent",
        },
      },
    ]);
    setError(null);
    clearProcessingStatus();
    toast.success("Chat cleared");
  }, [clearProcessingStatus]);

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-pulse text-lg font-medium">
            Connecting to ADK Assistant...
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Initializing session and agents
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-lg font-medium text-destructive mb-2">
            Connection Error
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            {error}
          </div>
          <button
            onClick={retryConnection}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Retry Connection"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm">
      {/* Header with status */}
      <div className="p-4 border-b bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AgentStatusIndicator 
              currentAgent={currentAgent}
              processingStage={processingStage}
              isLoading={isLoading}
            />
            {currentSession && (
              <div className="text-xs text-muted-foreground">
                Session: {currentSession.id.slice(-8)}
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            {error && (
              <button
                onClick={retryConnection}
                className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                disabled={isConnecting}
              >
                Retry
              </button>
            )}
            <button
              onClick={clearChat}
              className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}
        
        {/* Network status */}
        <NetworkStatus 
          onRetry={retryConnection}
          className="mt-2"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <div className="border-t bg-card/50">
        <MessageInput 
          onSendMessage={sendMessage}
          onRetryFile={(file) => {
            // Use the retry function from the document processing hook
            processFiles([file]);
          }}
          disabled={isLoading || !currentSession}
          placeholder={
            !currentSession 
              ? "Connecting to ADK..." 
              : isLoading 
              ? "ADK is processing..." 
              : "Ask about birth certificate registration..."
          }
        />
      </div>
    </div>
  );
}
