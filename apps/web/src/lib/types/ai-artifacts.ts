import type { AssessmentAnswers } from "@/lib/types";

export type ArtifactKind = "assessment-wizard" | "assessment-results";

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
