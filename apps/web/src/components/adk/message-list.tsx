"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/adk/types";
import { Response } from "@/components/response";
import { User, Bot, AlertCircle } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getAgentDisplayName = (agent?: string) => {
    switch (agent) {
      case "OrchestratorAgent":
        return "Orchestrator";
      case "ClassificationAgent":
        return "Legal Research";
      case "DocumentProcessorAgent":
        return "Document Processor";
      case "ValidatorAgent":
        return "Validator";
      case "GroundTruthAgent":
        return "Database";
      case "DeliveryAgent":
        return "Delivery";
      case "System":
        return "System";
      default:
        return agent || "AI Assistant";
    }
  };

  const getAgentColor = (agent?: string) => {
    switch (agent) {
      case "OrchestratorAgent":
        return "text-blue-600 dark:text-blue-400";
      case "ClassificationAgent":
        return "text-purple-600 dark:text-purple-400";
      case "DocumentProcessorAgent":
        return "text-green-600 dark:text-green-400";
      case "ValidatorAgent":
        return "text-orange-600 dark:text-orange-400";
      case "GroundTruthAgent":
        return "text-indigo-600 dark:text-indigo-400";
      case "DeliveryAgent":
        return "text-pink-600 dark:text-pink-400";
      case "System":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-foreground";
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="group">
          <div
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {/* Avatar */}
            {message.role !== "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {message.metadata?.agent === "System" ? (
                  <AlertCircle size={16} className="text-destructive" />
                ) : (
                  <Bot size={16} className="text-primary" />
                )}
              </div>
            )}

            {/* Message Content */}
            <div
              className={`max-w-[80%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              } rounded-lg px-4 py-3 shadow-sm`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">
                  {message.role === "user" ? (
                    "You"
                  ) : (
                    <span className={getAgentColor(message.metadata?.agent)}>
                      {getAgentDisplayName(message.metadata?.agent)}
                    </span>
                  )}
                </span>
                
                <span className="text-xs opacity-70">
                  {formatTime(message.timestamp)}
                </span>

                {message.metadata?.processingTime && (
                  <span className="text-xs opacity-60">
                    ({message.metadata.processingTime}ms)
                  </span>
                )}
              </div>

              {/* Message Body */}
              <div className={`text-sm ${
                message.role === "user" 
                  ? "text-primary-foreground" 
                  : "text-foreground"
              }`}>
                {message.role === "user" ? (
                  message.content
                ) : (
                  <Response>{message.content}</Response>
                )}
              </div>

              {/* Metadata */}
              {message.metadata?.documents && message.metadata.documents.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <div className="text-xs opacity-70">
                    Documents: {message.metadata.documents.join(", ")}
                  </div>
                </div>
              )}

              {message.metadata?.validationResults && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <div className="text-xs opacity-70">
                    Validation: {JSON.stringify(message.metadata.validationResults, null, 2)}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {message.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User size={16} className="text-primary-foreground" />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
          <div className="bg-muted rounded-lg px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm text-muted-foreground">
                ADK is thinking...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
