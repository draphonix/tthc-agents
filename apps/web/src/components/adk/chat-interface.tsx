"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
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
    // AI SDK Chat Hook
    const { messages: aiMessages, sendMessage: sendAIMessage, setMessages: setAIMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/adk/ai-chat',
        }),
    });

    // Track if we're loading (sending a message)
    const [isChatLoading, setIsChatLoading] = useState(false);
    
    // Local state for immediate UI updates
    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

    // Convert AI SDK messages to ChatMessage format for compatibility + add welcome message
    const messages: ChatMessage[] = [
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your ADK Assistant, here to help you with Vietnamese birth certificate registration. How can I assist you today?",
            timestamp: new Date().toISOString(),
            metadata: {
                agent: "OrchestratorAgent",
            },
        },
        // Combine local messages (for immediate UI updates) and AI SDK messages
        ...localMessages,
        ...aiMessages.map(msg => {
            // Extract content from message parts (AI SDK v5 format)
            let content = "";
            if (msg.parts && Array.isArray(msg.parts)) {
                const textParts = msg.parts.filter((part: any) => part.type === "text");
                content = textParts.map((part: any) => part.text).join("");
            }
            
            return {
                id: msg.id || `msg-${Date.now()}`,
                role: msg.role as "user" | "assistant" | "system",
                content: content,
                timestamp: new Date().toISOString(),
                metadata: {
                    agent: msg.role === "assistant" ? "OrchestratorAgent" : undefined,
                },
            };
        }),
    ];

    // ADK-specific state
    const [currentSession, setCurrentSession] = useState<ADKSession | null>(null);
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
            // Add processing results to chat using AI SDK
            const processingMessage = `Document processed successfully:\n\n**Document Type:** ${results.documentType}\n**Status:** ${results.validationStatus}\n\n**Extracted Information:**\n${Object.entries(results.extractedData || {}).map(([key, value]) => `- **${key}:** ${value}`).join('\n')}`;

            sendAIMessage({ text: processingMessage });
        },
        onFileError: (fileId, error) => {
            // Add error message to chat using AI SDK
            sendAIMessage({ text: `Failed to process document: ${error}` });
        },
    });

    // Initialize ADK client and session
    useEffect(() => {
        const initializeADK = async () => {
            try {
                setIsConnecting(true);
                setError(null);

                // Initialize ADK client for direct operations (health check, manual session management)
                const client = new ADKClient(PLACEHOLDER_USER_ID);
                adkClientRef.current = client;

                // Initialize session hook for session operations
                const sessionHook = new ADKSessionHook(client);
                sessionHookRef.current = sessionHook;

                // Test connection
                await client.healthCheck();

                // Get or create session for document processing and session display
                const session = await sessionHook.getOrCreateSession();
                setCurrentSession(session);

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

    // Effect to clean up local messages when AI SDK messages are updated
    // This prevents duplicate messages in the UI
    useEffect(() => {
        if (aiMessages.length > 0) {
            // Clear local messages when AI SDK messages are updated
            // since the AI SDK now contains the complete conversation
            setLocalMessages([]);
        }
    }, [aiMessages]);

    const sendMessage = useCallback(async (content: string, files?: DocumentFile[]) => {
        if (!currentSession || isChatLoading) {
            return;
        }

        try {
            setError(null);
            setCurrentAgent("OrchestratorAgent");
            setProcessingStage("Processing your request...");

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

                // If no text content, just finish document processing
                if (!content.trim()) {
                    setCurrentAgent(null);
                    setProcessingStage(null);
                    return;
                }
            }

            // Add user message to local state for immediate UI feedback
            if (content.trim()) {
                const userMessage: ChatMessage = {
                    id: `user-msg-${Date.now()}`,
                    role: "user",
                    content: content.trim(),
                    timestamp: new Date().toISOString(),
                    metadata: {},
                };
                
                setLocalMessages(prev => [...prev, userMessage]);
            }

            // Send message using AI SDK's sendMessage function
            // The streaming and response handling is now managed by AI SDK
            setIsChatLoading(true);
            await sendAIMessage({ text: content });

        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = error instanceof ADKError ? error.message : "Failed to send message";
            setError(errorMessage);
            toast.error(errorMessage);

            // Add error message using AI SDK
            sendAIMessage({ text: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.` });
        } finally {
            setCurrentAgent(null);
            setProcessingStage(null);
            setIsChatLoading(false);
        }
    }, [currentSession, isChatLoading, sendAIMessage, processFiles]);

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
        // Clear both AI SDK messages and local messages
        setAIMessages([]);
        setLocalMessages([]);
    }, [setAIMessages]);

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
                            isLoading={isChatLoading}
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
                <MessageList messages={messages} isLoading={isChatLoading} />
            </div>

            {/* Input */}
            <div className="border-t bg-card/50">
                <MessageInput
                    onSendMessage={sendMessage}
                    onRetryFile={(file) => {
                        // Use the retry function from the document processing hook
                        processFiles([file]);
                    }}
                    disabled={isChatLoading || !currentSession}
                    placeholder={
                        !currentSession
                            ? "Connecting to ADK..."
                            : isChatLoading
                                ? "ADK is processing..."
                                : "Ask about birth certificate registration..."
                    }
                />
            </div>
        </div>
    );
}
