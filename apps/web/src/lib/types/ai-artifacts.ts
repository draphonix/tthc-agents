import type { AssessmentAnswers } from "@/lib/types";

export type ArtifactKind = "assessment-wizard" | "assessment-results" | "document-submission" | "validation-result";

export interface AIAssistantArtifact {
  id: string;
  kind: ArtifactKind;
  data: any;
}

export interface AssessmentWizardData {
  // Empty for initial state, can be extended later
}

export interface AssessmentResultsData {
  answers: AssessmentAnswers;
  scenario?: string;
  results?: {
    analysis: string;
    documents: string[];
    nextSteps: string[];
    timeline?: string;
    authority?: string;
  };
}

export type DocumentExtractionFields = Record<string, string | Array<{ key: string; value: string }>>;

export interface DocumentExtractionData {
  documentId: string;
  fileName: string;
  rawText: string;
  extractedFields?: DocumentExtractionFields;
  documentType?: string;
  confidence?: number;
  uploadedAt: string;
  source: "chat-panel" | "artifact";
}

export interface DocumentUploadState {
  files: File[];
  isUploading: boolean;
  error: string | null;
  messages: any[]; // Using any for now, could be typed more specifically
  extraction?: DocumentExtractionData;
}

export interface DocumentSubmissionData {
  documents: Array<{ name: string; nameVn: string; required: boolean } | string>;
  note?: string;
}

export interface ValidationResultData {
  documentIds: string[];
  fileNames: string[];
  validatedAt: string;
}
