"use client";

import { createContext, useContext } from "react";

interface ChatContextValue {
  sendMessage: (message: { text: string; metadata?: any }) => void;
}

export const ChatContext = createContext<ChatContextValue | null>(null);

export const useChatSend = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatSend must be used within a ChatContext.Provider");
  }
  return context.sendMessage;
};
