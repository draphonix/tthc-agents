"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Response } from "@/components/response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadDocumentation } from "@/components/UploadDocumentation";

interface ChatPanelProps {
  className?: string;
  onUploadComplete?: (data: any) => void;
}

export function ChatPanel({ className, onUploadComplete }: ChatPanelProps) {
  const [input, setInput] = useState("");
  
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_SERVER_URL}/ai`,
    }),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  };

  const handleUploadComplete = (data: any) => {
    console.log("Upload complete:", data);
    sendMessage({
      text: "I've uploaded the document. Please analyze the information and let me know what's needed next."
    });
    onUploadComplete?.(data);
  };

  return (
    <div className={`flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-center p-4 border-b">
        <h1 className="text-xl font-semibold vietnam-accent">
          Tư vấn AI / AI Assistant
        </h1>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            Xin chào! Tôi sẽ giúp bạn đăng ký khai sinh cho con bạn tại Việt Nam. 
            Hầu hết trẻ em được sinh tại bệnh viện với giấy chứng sinh. 
            Bạn có giấy chứng sinh của con không?
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-primary/10 ml-8"
                  : "bg-secondary/20 mr-8"
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {message.role === "user" ? "Bạn" : "AI Assistant"}
              </p>
              {message.parts?.map((part, index) => {
                if (part.type === "text") {
                  return <Response key={index}>{part.text}</Response>;
                }

                if (part.type === "tool-requestDocumentUpload") {
                  switch (part.state) {
                    case "input-available":
                      return <div key={index}>Loading document upload...</div>;
                    case "output-available":
                      const output = part.output as { reason: string };
                      return (
                        <div key={index}>
                          <UploadDocumentation
                            reason={output.reason}
                            isInChat={true}
                            onUploadComplete={handleUploadComplete}
                          />
                        </div>
                      );
                    case "output-error":
                      return <div key={index}>Error: {part.errorText}</div>;
                    default:
                      return null;
                  }
                }

                return null;
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center space-x-2 p-4 border-t"
      >
        <Input
          name="prompt"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn của bạn..."
          className="flex-1"
          autoComplete="off"
          autoFocus
        />
        <Button type="submit" size="icon">
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
}
