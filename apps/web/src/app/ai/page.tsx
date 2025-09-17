"use client";

import { useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AIPageLayout } from "@/components/ai/layout/AIPageLayout";
import { ChatPanel } from "@/components/ai/layout/ChatPanel";
import { ArtifactsPanel } from "@/components/ai/layout/ArtifactsPanel";
import { useAssessmentArtifacts } from "@/components/ai/hooks/useAssessmentArtifacts";
import type { DocumentSubmissionData, DocumentExtractionData } from "@/lib/types/ai-artifacts";
import { ChatContext } from "@/components/ai/chat/ChatContext";
import type { AssessmentAnswers } from "@/lib/types";

export default function AIPage() {
  const { artifacts, replaceWizardWithResults, addArtifact } = useAssessmentArtifacts();

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_SERVER_URL}/ai`,
    }),
  });

  const [pendingDocumentIds, setPendingDocumentIds] = useState<string[]>([]);
  const extractionsRef = useRef<Record<string, DocumentExtractionData>>({});
  const notifiedDocumentIdsRef = useRef(new Set<string>());

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

  const maybeNotifyValidation = (
    dataset: Record<string, DocumentExtractionData>,
    lastUpdatedId?: string
  ) => {
    if (pendingDocumentIds.length === 0) {
      const latest = lastUpdatedId ? dataset[lastUpdatedId] : undefined;
      if (!latest || notifiedDocumentIdsRef.current.has(latest.documentId)) {
        return;
      }

      sendMessage({
        text: "Tôi đã tải tài liệu lên. Xin xác nhận giúp tôi rằng tài liệu đã được xác thực.",
        metadata: {
          type: "documentExtractionSingle",
          document: latest,
        },
      });
      notifiedDocumentIdsRef.current.add(latest.documentId);
      return;
    }

    const allCompleted = pendingDocumentIds.every((id) => dataset[id]);
    if (!allCompleted) {
      return;
    }

    const documents = pendingDocumentIds
      .map((id) => dataset[id])
      .filter((doc): doc is DocumentExtractionData => Boolean(doc && !notifiedDocumentIdsRef.current.has(doc.documentId)));

    if (documents.length === 0) {
      return;
    }

    sendMessage({
      text: "Tôi đã tải lên toàn bộ tài liệu được yêu cầu. Vui lòng xác thực thông tin giúp tôi.",
      metadata: {
        type: "documentExtractionBatch",
        documents,
      },
    });

    documents.forEach((doc) => notifiedDocumentIdsRef.current.add(doc.documentId));
    setPendingDocumentIds([]);
  };

  const handleExtractionComplete = (payload: DocumentExtractionData) => {
    extractionsRef.current[payload.documentId] = payload;

    maybeNotifyValidation(extractionsRef.current, payload.documentId);
  };

  const handleRequestDocumentSubmission = (documents: DocumentSubmissionData["documents"], note?: string) => {
    const artifactId = `document-submission-${Date.now()}`;

    addArtifact({
      id: artifactId,
      kind: "document-submission",
      data: { documents, note },
    });

    const requiredIds = documents.map((_, index) => `${artifactId}-${index}`);
    setPendingDocumentIds(requiredIds);
  };

  return (
    <ChatContext.Provider value={{ sendMessage }}>
      <AIPageLayout>
        <ChatPanel
          className="col-start-1"
          messages={messages}
          onRequestDocumentSubmission={handleRequestDocumentSubmission}
          onExtractionComplete={handleExtractionComplete}
        />
        <ArtifactsPanel
          artifacts={artifacts}
          className="col-start-2"
          onAssessmentComplete={handleAssessmentComplete}
          onDocumentExtractionComplete={handleExtractionComplete}
        />
      </AIPageLayout>
    </ChatContext.Provider>
  );
}
