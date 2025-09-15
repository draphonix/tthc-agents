"use client";

import { useState } from "react";
import type { AIAssistantArtifact, AssessmentWizardData, AssessmentResultsData } from "@/lib/types/ai-artifacts";
import type { AssessmentAnswers } from "@/lib/types";

export function useAssessmentArtifacts() {
  const [artifacts, setArtifacts] = useState<AIAssistantArtifact[]>([
    {
      id: "wizard",
      kind: "assessment-wizard",
      data: {} as AssessmentWizardData,
    },
  ]);

  const replaceWizardWithResults = (answers: AssessmentAnswers, results?: any) => {
    setArtifacts([
      {
        id: "results",
        kind: "assessment-results",
        data: {
          answers,
          results,
        } as AssessmentResultsData,
      },
    ]);
  };

  const addArtifact = (artifact: AIAssistantArtifact) => {
    setArtifacts(prev => [...prev, artifact]);
  };

  const updateArtifact = (id: string, data: Partial<AIAssistantArtifact>) => {
    setArtifacts(prev => 
      prev.map(artifact => 
        artifact.id === id ? { ...artifact, ...data } : artifact
      )
    );
  };

  const removeArtifact = (id: string) => {
    setArtifacts(prev => prev.filter(artifact => artifact.id !== id));
  };

  const clearArtifacts = () => {
    setArtifacts([]);
  };

  const resetToWizard = () => {
    setArtifacts([
      {
        id: "wizard",
        kind: "assessment-wizard",
        data: {} as AssessmentWizardData,
      },
    ]);
  };

  return {
    artifacts,
    replaceWizardWithResults,
    addArtifact,
    updateArtifact,
    removeArtifact,
    clearArtifacts,
    resetToWizard,
  };
}
