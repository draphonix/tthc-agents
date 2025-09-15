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
import type { AIAssistantArtifact } from "@/lib/types/ai-artifacts";
import { AssessmentWizardArtifact } from "@/components/ai/artifacts/AssessmentWizardArtifact";
import { AssessmentResultsArtifact } from "@/components/ai/artifacts/AssessmentResultsArtifact";

interface ArtifactsPanelProps {
  artifacts: AIAssistantArtifact[];
  className?: string;
  onAssessmentComplete?: (answers: AssessmentAnswers) => void;
}

export function ArtifactsPanel({ artifacts, className, onAssessmentComplete }: ArtifactsPanelProps) {
  const renderArtifactContent = (artifact: AIAssistantArtifact) => {
    switch (artifact.kind) {
      case "assessment-wizard":
        return <AssessmentWizardArtifact artifact={artifact} onAssessmentComplete={onAssessmentComplete} />;
      case "assessment-results":
        return <AssessmentResultsArtifact artifact={artifact} />;
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
    <div className={`overflow-y-auto border-l bg-muted/50 p-4 ${className}`}>
      <Artifact>
        <ArtifactHeader>
          <div>
            <ArtifactTitle>{getArtifactTitle(currentArtifact)}</ArtifactTitle>
            <ArtifactDescription>{getArtifactDescription(currentArtifact)}</ArtifactDescription>
          </div>
          <ArtifactActions>
            <ArtifactAction icon={Copy} label="Copy" tooltip="Sao chép nội dung" />
          </ArtifactActions>
        </ArtifactHeader>
        <ArtifactContent>
          {renderArtifactContent(currentArtifact)}
        </ArtifactContent>
      </Artifact>
    </div>
  );
}
