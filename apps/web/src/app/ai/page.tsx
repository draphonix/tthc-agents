"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AIPageLayout } from "@/components/ai/layout/AIPageLayout";
import { ChatPanel } from "@/components/ai/layout/ChatPanel";
import { ArtifactsPanel } from "@/components/ai/layout/ArtifactsPanel";
import { useAssessmentArtifacts } from "@/components/ai/hooks/useAssessmentArtifacts";
import type { DocumentSubmissionData } from "@/lib/types/ai-artifacts";
import { ChatContext } from "@/components/ai/chat/ChatContext";
import type { AssessmentAnswers } from "@/lib/types";

export default function AIPage() {
  const { artifacts, replaceWizardWithResults, addArtifact } = useAssessmentArtifacts();
  
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_SERVER_URL}/ai`,
    }),
  });

  const handleAssessmentComplete = (answers: AssessmentAnswers) => {
    // Replace wizard with results (showing processing state)
    replaceWizardWithResults(answers);
    
    // Send assessment answers through chat system
    sendMessage({
      text: 'Tôi vừa hoàn thành bài đánh giá tình huống đăng ký khai sinh. Xin vui lòng phân tích và tư vấn cho tình huống của tôi.',
      metadata: {
        type: 'assessmentAnswers',
        answers: answers
      }
    });
  };

  const handleUploadComplete = (data: any) => {
  console.log("Upload complete:", data);
  };

  const handleRequestDocumentSubmission = (documents: DocumentSubmissionData["documents"], note?: string) => {
  addArtifact({
  id: `document-submission-${Date.now()}`,
  kind: "document-submission",
  data: { documents, note },
  });
  };
  
  return (
  <ChatContext.Provider value={{ sendMessage }}>
  <AIPageLayout>
  <ChatPanel 
    className="col-start-1" 
      messages={messages}
        onUploadComplete={handleUploadComplete}
          onRequestDocumentSubmission={handleRequestDocumentSubmission}
        />
        <ArtifactsPanel 
          artifacts={artifacts}
          className="col-start-2"
          onAssessmentComplete={handleAssessmentComplete}
        />
      </AIPageLayout>
    </ChatContext.Provider>
  );
}
