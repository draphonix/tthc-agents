"use client";

import { AIPageLayout } from "@/components/ai/layout/AIPageLayout";
import { ChatPanel } from "@/components/ai/layout/ChatPanel";
import { ArtifactsPanel } from "@/components/ai/layout/ArtifactsPanel";
import { useAssessmentArtifacts } from "@/components/ai/hooks/useAssessmentArtifacts";
import type { AssessmentAnswers } from "@/lib/types";
import { useState } from "react";

export default function AIPage() {
  const { artifacts, replaceWizardWithResults } = useAssessmentArtifacts();
  const [isProcessingAssessment, setIsProcessingAssessment] = useState(false);

  const handleAssessmentComplete = async (answers: AssessmentAnswers) => {
    setIsProcessingAssessment(true);
    
    try {
      // First replace the wizard with results (showing processing state)
      replaceWizardWithResults(answers);
      
      // Send assessment answers to the API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/ai/process-assessment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentAnswers: answers }),
      });

      if (!response.ok) {
        throw new Error('Failed to process assessment');
      }

      // Get the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let result = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          result += chunk;
        }
        
        // Parse the result and update the artifacts
        try {
          const parsedResult = JSON.parse(result);
          replaceWizardWithResults(answers, parsedResult);
        } catch (parseError) {
          // If parsing fails, use the raw result as analysis text
          replaceWizardWithResults(answers, { analysis: result });
        }
      }
    } catch (error) {
      console.error('Error processing assessment:', error);
      // Still show results but with error state
      replaceWizardWithResults(answers, { 
        analysis: 'Đã xảy ra lỗi khi xử lý đánh giá. Vui lòng thử lại sau. / An error occurred while processing the assessment. Please try again later.',
        error: true 
      });
    } finally {
      setIsProcessingAssessment(false);
    }
  };

  const handleUploadComplete = (data: any) => {
    console.log("Upload complete:", data);
  };

  return (
    <AIPageLayout>
      <ChatPanel 
        className="col-start-1" 
        onUploadComplete={handleUploadComplete}
      />
      <ArtifactsPanel 
        artifacts={artifacts}
        className="col-start-2"
        onAssessmentComplete={handleAssessmentComplete}
      />
    </AIPageLayout>
  );
}
