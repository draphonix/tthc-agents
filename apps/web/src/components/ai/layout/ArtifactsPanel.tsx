"use client";

import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from '@/components/ai-elements/artifact';
import { Copy } from "lucide-react";
import type { AssessmentAnswers } from "@/lib/types";
import type { AIAssistantArtifact, DocumentExtractionData } from "@/lib/types/ai-artifacts";
import { AssessmentWizardArtifact } from "@/components/ai/artifacts/AssessmentWizardArtifact";
import { AssessmentResultsArtifact } from "@/components/ai/artifacts/AssessmentResultsArtifact";
import { DocumentSubmissionArtifact } from "@/components/ai/artifacts/DocumentSubmissionArtifact";
import { ValidationResultArtifact } from "@/components/ai/artifacts/ValidationResultArtifact";

interface ArtifactsPanelProps {
  artifacts: AIAssistantArtifact[];
  className?: string;
  onAssessmentComplete?: (answers: AssessmentAnswers) => void;
  onDocumentExtractionComplete?: (data: DocumentExtractionData) => void;
}

export function ArtifactsPanel({ artifacts, className, onAssessmentComplete, onDocumentExtractionComplete }: ArtifactsPanelProps) {
  const renderArtifactContent = (artifact: AIAssistantArtifact) => {
    switch (artifact.kind) {
      case "assessment-wizard":
        return <AssessmentWizardArtifact artifact={artifact} onAssessmentComplete={onAssessmentComplete} />;
      case "assessment-results":
        return <AssessmentResultsArtifact artifact={artifact} />;
      case "document-submission":
        return (
          <DocumentSubmissionArtifact
            artifact={artifact}
            onDocumentExtractionComplete={onDocumentExtractionComplete}
          />
        );
      case "validation-result":
        return <ValidationResultArtifact artifact={artifact} />;
      default:
        return <div>Unknown artifact type: {artifact.kind}</div>;
    }
  };

  const getArtifactTitle = (artifact: AIAssistantArtifact) => {
    switch (artifact.kind) {
      case "assessment-wizard":
        return "Đánh giá thông tin / Information Assessment";
      case "assessment-results":
        return "Kết quả đánh giá / Assessment Results";
      case "document-submission":
        return "Nộp tài liệu / Document Submission";
      case "validation-result":
        return "Kết quả xác thực / Validation Results";
      default:
        return "AI Assistant Artifact";
    }
  };

  const getArtifactDescription = (artifact: AIAssistantArtifact) => {
    switch (artifact.kind) {
      case "assessment-wizard":
        return "Vui lòng trả lời các câu hỏi để xác định tình huống của bạn";
      case "assessment-results":
        return "Kết quả phân tích và hướng dẫn tiếp theo";
      case "document-submission":
        return "Danh sách tài liệu cần nộp dựa trên kết quả tra cứu";
      case "validation-result":
        return "Tài liệu đã được xác thực thành công";
      default:
        return "AI generated content";
    }
  };

  if (artifacts.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 border-l ${className}`}>
        <p className="text-muted-foreground">No artifacts to display</p>
      </div>
    );
  }

  // Show the latest artifact
  const currentArtifact = artifacts[artifacts.length - 1];

  return (
    <div className={`h-full flex flex-col border-l bg-muted/50 ${className}`}>
      <div className="p-4 h-full">
        <Artifact className="h-full flex flex-col">
          <ArtifactHeader>
            <div>
              <ArtifactTitle>{getArtifactTitle(currentArtifact)}</ArtifactTitle>
              <ArtifactDescription>{getArtifactDescription(currentArtifact)}</ArtifactDescription>
            </div>
            <ArtifactActions>
              <ArtifactAction icon={Copy} label="Copy" tooltip="Sao chép nội dung" />
            </ArtifactActions>
          </ArtifactHeader>
          <ArtifactContent className="flex-1 overflow-auto">
            {renderArtifactContent(currentArtifact)}
          </ArtifactContent>
        </Artifact>
      </div>
    </div>
  );
}
