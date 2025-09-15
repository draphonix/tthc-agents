"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AIPageLayoutProps {
  children: ReactNode;
}

export function AIPageLayout({ children }: AIPageLayoutProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'artifact'>('chat');
  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <>
      {/* Mobile tabs - only show on small screens */}
      <div className="lg:hidden flex border-b bg-background">
        <Button
          variant={activeTab === 'chat' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('chat')}
          className="flex-1 rounded-none"
        >
          Trò chuyện / Chat
        </Button>
        <Button
          variant={activeTab === 'artifact' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('artifact')}
          className="flex-1 rounded-none"
        >
          Đánh giá / Assessment
        </Button>
      </div>

      {/* Desktop split view and mobile single view */}
      <div className="grid h-screen lg:grid-cols-[minmax(360px,2fr)_3fr] gap-0">
        {/* Chat Panel */}
        <div className={`${activeTab === 'chat' ? 'block' : 'hidden'} lg:block`}>
          {childrenArray[0]}
        </div>
        
        {/* Artifacts Panel */}
        <div className={`${activeTab === 'artifact' ? 'block' : 'hidden'} lg:block`}>
          {childrenArray[1]}
        </div>
      </div>
    </>
  );
}
