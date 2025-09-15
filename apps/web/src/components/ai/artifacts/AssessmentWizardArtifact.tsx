"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { assessmentQuestions } from "@/lib/data";
import type { AssessmentQuestion, AssessmentAnswers } from "@/lib/types";
import type { AIAssistantArtifact } from "@/lib/types/ai-artifacts";
import { determineScenario, isAssessmentComplete } from "@/lib/utils/scenario";
import { useState } from "react";

interface AssessmentWizardArtifactProps {
  artifact: AIAssistantArtifact;
  onAssessmentComplete?: (answers: AssessmentAnswers) => void;
}

export function AssessmentWizardArtifact({ artifact, onAssessmentComplete }: AssessmentWizardArtifactProps) {
  const [assessmentAnswers, setAssessmentAnswers] = useState<AssessmentAnswers>({});

  const handleAnswerSelect = (questionId: string, value: string) => {
    const updatedAnswers = { ...assessmentAnswers, [questionId]: value };
    setAssessmentAnswers(updatedAnswers);

    // Check if assessment is complete after this answer
    if (isAssessmentComplete(updatedAnswers)) {
      const scenario = determineScenario(updatedAnswers);
      onAssessmentComplete?.(updatedAnswers);
    }
  };

  const currentProgress = Object.keys(assessmentAnswers).length;
  const totalQuestions = assessmentQuestions.length;
  const isComplete = isAssessmentComplete(assessmentAnswers);

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: totalQuestions }, (_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i < currentProgress 
                ? "bg-primary text-primary-foreground border-primary" 
                : i === currentProgress
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Assessment Intro */}
      <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold vietnam-accent mb-1">
          Trả lời một vài câu hỏi để xác định quy trình phù hợp
        </h3>
        <p className="text-sm text-muted-foreground">
          Answer a few questions to determine the appropriate process
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {assessmentQuestions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            selectedValue={assessmentAnswers[question.id as keyof AssessmentAnswers]}
            onAnswerSelect={(value) => handleAnswerSelect(question.id, value)}
            isVisible={index <= currentProgress}
          />
        ))}
      </div>

      {/* Completion Status */}
      {isComplete && (
        <Card className="animate-fade-in border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium vietnam-accent mb-1">
                Đánh giá hoàn tất / Assessment Complete
              </p>
              <p className="text-xs text-muted-foreground">
                Đang phân tích tình huống của bạn... / Analyzing your situation...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: AssessmentQuestion;
  selectedValue?: string;
  onAnswerSelect: (value: string) => void;
  isVisible: boolean;
}

function QuestionCard({ question, selectedValue, onAnswerSelect, isVisible }: QuestionCardProps) {
  if (!isVisible) return null;

  return (
    <Card className="transition-all">
      <CardContent className="p-4">
        <div className="mb-4">
          <h4 className="text-base font-medium text-foreground mb-1">
            {question.question}
          </h4>
          <p className="text-sm text-muted-foreground">
            {question.questionVn}
          </p>
        </div>

        <div className="space-y-2">
          {question.options.map((option) => (
            <button
              key={option.value}
              onClick={() => onAnswerSelect(option.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                selectedValue === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedValue === option.value
                  ? "border-primary bg-primary"
                  : "border-border"
              }`}>
                {selectedValue === option.value && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{option.text}</div>
                <div className="text-xs text-muted-foreground">{option.textVn}</div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default AssessmentWizardArtifact;
