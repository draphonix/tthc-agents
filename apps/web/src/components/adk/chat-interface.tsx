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
    // Manual input state management (required in AI SDK v5)
    const [input, setInput] = useState('');

    // AI SDK Chat Hook with proper error handling and callbacks
    const {
        messages: aiMessages,
        sendMessage: sendAIMessage,
        setMessages: setAIMessages,
        error: chatError,
        status,
        regenerate,
        clearError
    } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/adk/ai-chat',
        }),
        onError: (error) => {
            console.error("Chat error:", error);
            setError(error.message);
            toast.error(error.message);
        },
        onFinish: ({ message, messages }) => {
            // Handle completion
            setCurrentAgent(null);
            setProcessingStage(null);
        }
    });

    // Derive loading state from status
    const isLoading = status === 'submitted' || status === 'streaming';

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
        // Map AI SDK messages directly to ChatMessage format (support content or parts)
        ...aiMessages.map((msg: any) => {
            const contentFromArray = Array.isArray(msg?.content)
                ? msg.content
                    .filter((part: any) => part?.type === "text")
                    .map((part: any) => String(part?.text ?? ""))
                    .join("")
                : undefined;

            const contentFromString = typeof msg?.content === "string" ? msg.content : undefined;

            const contentFromParts = Array.isArray(msg?.parts)
                ? msg.parts
                    .filter((part: any) => part?.type === "text")
                    .map((part: any) => String(part?.text ?? ""))
                    .join("")
                : undefined;

            const resolvedContent = contentFromArray ?? contentFromString ?? contentFromParts ?? "";

            return {
                id: msg.id,
                role: msg.role,
                content: resolvedContent,
                timestamp: new Date().toISOString(),
                metadata: {
                    agent: msg.role === "assistant" ? "OrchestratorAgent" : undefined,
                },
            } as ChatMessage;
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



    const sendMessage = useCallback(async (content: string, files?: DocumentFile[]) => {
        if (!currentSession || isLoading) {
            return;
        }

        try {
            setError(null);
            clearError(); // Clear any previous chat errors
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

            // Send message using AI SDK's sendMessage function
            // The streaming and response handling is now managed by AI SDK
            await sendAIMessage({ text: content });

        } catch (error) {
            console.error("Failed to send message:", error);
            const errorMessage = error instanceof ADKError ? error.message : "Failed to send message";
            setError(errorMessage);
            toast.error(errorMessage);
        }
        // Note: setCurrentAgent and setProcessingStage are handled in onFinish callback
    }, [currentSession, isLoading, sendAIMessage, processFiles, clearError]);

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
        // Clear AI SDK messages
        setAIMessages([]);
        clearError(); // Clear any chat errors
    }, [setAIMessages, clearError]);

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

                {chatError && (
                    <div className="mt-2 text-xs text-destructive bg-destructive/10 p-2 rounded flex items-center justify-between">
                        <span>Chat error occurred</span>
                        <button
                            onClick={() => regenerate()}
                            className="text-xs px-2 py-1 bg-destructive/20 text-destructive rounded hover:bg-destructive/30"
                            disabled={isLoading}
                        >
                            Retry
                        </button>
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
