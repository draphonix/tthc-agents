"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Response } from "@/components/response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadDocumentation } from "@/components/UploadDocumentation";
import { useChatSend } from "@/components/ai/chat/ChatContext";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from '@/components/ai-elements/artifact';
import type { UIMessage } from "ai";

interface ChatPanelProps {
  className?: string;
  messages: UIMessage[];
  onUploadComplete?: (data: any) => void;
}

export function ChatPanel({ className, messages, onUploadComplete }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const sendMessage = useChatSend();

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
    <div className={`h-full flex flex-col ${className}`}>
      <div className="p-4 h-full">
        <Artifact className="h-full flex flex-col">
          <ArtifactHeader>
            <div>
              <ArtifactTitle>Tư vấn AI / AI Assistant</ArtifactTitle>
              <ArtifactDescription>Trò chuyện với AI để được hỗ trợ</ArtifactDescription>
            </div>
            <ArtifactActions>
              <ArtifactAction icon={Send} label="Send" tooltip="Gửi tin nhắn" />
            </ArtifactActions>
          </ArtifactHeader>
          <ArtifactContent className="flex-1 overflow-auto flex flex-col">
            {/* Messages Area */}
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

                      if (part.type === "tool-queryKnowledgeBase") {
                        switch (part.state) {
                          case "input-available":
                            const input = part.input as { question: string };
                            return (
                              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="text-sm font-medium text-blue-800 mb-2">
                                  🔍 Đang tìm kiếm thông tin...
                                </div>
                                <div className="text-xs text-blue-600">
                                  {input.question}
                                </div>
                              </div>
                            );
                          case "output-available":
                            const output = part.output as {
                              answer: string;
                              citations?: Array<{ title: string; source: string; uri: string }>;
                              source?: string;
                            };
                            return (
                              <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="text-sm font-medium text-green-800 mb-3">
                                  📚 Thông tin từ cơ sở dữ liệu pháp luật
                                </div>
                                <div className="text-sm text-gray-800 mb-3">
                                  <Response>{output.answer}</Response>
                                </div>
                                {output.citations && output.citations.length > 0 && (
                                  <div className="border-t border-green-200 pt-3">
                                    <div className="text-xs font-medium text-green-700 mb-2">
                                      Nguồn tham khảo:
                                    </div>
                                    <div className="space-y-1">
                                      {output.citations.slice(0, 3).map((citation, idx) => (
                                        <div key={idx} className="text-xs text-green-600">
                                          • {citation.title || citation.source}
                                        </div>
                                      ))}
                                      {output.citations.length > 3 && (
                                        <div className="text-xs text-green-500">
                                          ... và {output.citations.length - 3} nguồn khác
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          case "output-error":
                            return (
                              <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="text-sm text-red-800">
                                  ⚠️ Lỗi khi tìm kiếm thông tin: {part.errorText}
                                </div>
                              </div>
                            );
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
          </ArtifactContent>
        </Artifact>
      </div>
    </div>
  );
}
