"use client";

import { useState, useEffect, useRef } from "react";
import { ADKChatInterface } from "@/components/adk/chat-interface";
import Header from "@/components/header";

export default function ADKChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto h-[calc(100vh-4rem)] p-4">
        <div className="h-full flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">
              ADK Assistant
            </h1>
            <p className="text-muted-foreground">
              AI-powered assistance for Vietnamese birth certificate registration
            </p>
          </div>
          
          <div className="flex-1 min-h-0">
            <ADKChatInterface />
          </div>
        </div>
      </main>
    </div>
  );
}
