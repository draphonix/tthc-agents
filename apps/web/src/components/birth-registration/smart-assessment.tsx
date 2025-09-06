"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assessmentQuestions } from "@/lib/data";
import type { AssessmentQuestion } from "@/lib/types";
import { determineScenario, isAssessmentComplete } from "@/lib/utils/scenario";
import { useBirthRegistration } from "./context";
import { useState } from "react";

export function SmartAssessment() {
	const { state, navigateTo, setAssessmentAnswer, setSelectedScenario } = useBirthRegistration();
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

	const handleAnswerSelect = (questionId: string, value: string) => {
		setAssessmentAnswer(questionId, value);

		// Check if assessment is complete after this answer
		const updatedAnswers = { ...state.assessmentAnswers, [questionId]: value };
		
		if (isAssessmentComplete(updatedAnswers)) {
			const scenario = determineScenario(updatedAnswers);
			setSelectedScenario(scenario);
		}
	};

	const handleProceedToDocuments = () => {
		if (state.selectedScenario) {
			navigateTo("documents");
		}
	};

	const isComplete = isAssessmentComplete(state.assessmentAnswers);
	const currentProgress = Object.keys(state.assessmentAnswers).length;
	const totalQuestions = assessmentQuestions.length;

	return (
		<div className="animate-fade-in">
			{/* Header */}
			<header className="bg-card border-b-2 border-primary py-4">
				<div className="container mx-auto px-6">
					<div className="flex items-center justify-between flex-wrap gap-4">
						<Button 
							variant="outline" 
							onClick={() => navigateTo("landing")}
							className="text-sm"
						>
							← Quay lại / Back
						</Button>
						<h1 className="text-2xl font-semibold vietnam-accent">
							Đánh giá thông minh / Smart Assessment
						</h1>
						<div className="flex items-center gap-2">
							{Array.from({ length: 5 }, (_, i) => (
								<div
									key={i}
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
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
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-6 py-8">
				<div className="max-w-4xl mx-auto">
					{/* Assessment Intro */}
					<div className="text-center mb-8 p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
						<h2 className="text-xl font-semibold vietnam-accent mb-2">
							Trả lời một vài câu hỏi để xác định quy trình phù hợp
						</h2>
						<p className="text-muted-foreground">
							Answer a few questions to determine the appropriate process
						</p>
					</div>

					{/* Questions */}
					<div className="space-y-6 mb-8">
						{assessmentQuestions.map((question, index) => (
							<QuestionCard
								key={question.id}
								question={question}
								selectedValue={state.assessmentAnswers[question.id as keyof typeof state.assessmentAnswers]}
								onAnswerSelect={(value) => handleAnswerSelect(question.id, value)}
								isVisible={index <= currentProgress}
							/>
						))}
					</div>

					{/* Result Display */}
					{isComplete && state.selectedScenario && (
						<Card className="mb-8 animate-fade-in border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
							<CardHeader>
								<CardTitle className="vietnam-accent text-center">
									Kết quả đánh giá / Assessment Result
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="bg-card rounded-lg p-6 border border-green-300 dark:border-green-700">
										<h3 className="text-xl font-semibold vietnam-accent mb-2">
											{state.selectedScenario.name}
										</h3>
										<p className="text-lg text-muted-foreground mb-4">
											{state.selectedScenario.nameVn}
										</p>
										
										<div className="grid md:grid-cols-3 gap-4 mb-4">
											<div className="flex items-center gap-3">
												<span className="text-2xl">🏛️</span>
												<div>
													<div className="font-medium text-sm">Authority:</div>
													<div className="text-sm text-muted-foreground">{state.selectedScenario.authority}</div>
													<div className="text-sm text-muted-foreground">{state.selectedScenario.authorityVn}</div>
												</div>
											</div>
											
											<div className="flex items-center gap-3">
												<span className="text-2xl">⏱️</span>
												<div>
													<div className="font-medium text-sm">Timeline:</div>
													<div className="text-sm text-muted-foreground">{state.selectedScenario.timeline}</div>
													<div className="text-sm text-muted-foreground">{state.selectedScenario.timelineVn}</div>
												</div>
											</div>
											
											<div className="flex items-center gap-3">
												<span className="text-2xl">📊</span>
												<div>
													<div className="font-medium text-sm">Complexity:</div>
													<div className="text-sm text-muted-foreground">
														{state.selectedScenario.complexity} / {state.selectedScenario.complexityVn}
													</div>
												</div>
											</div>
										</div>

										<div>
											<h4 className="font-semibold vietnam-accent mb-3">
												Required Documents / Tài liệu cần thiết:
											</h4>
											<div className="flex flex-wrap gap-2">
												{state.selectedScenario.documents.map((doc, index) => (
													<span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs border">
														{doc.nameVn}
													</span>
												))}
											</div>
										</div>
									</div>

									<div className="text-center">
										<Button 
											className="vietnam-primary px-8 py-3 text-lg"
											onClick={handleProceedToDocuments}
										>
											Tiếp tục nộp tài liệu / Proceed to Document Submission
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</main>
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
			<CardContent className="p-6">
				<div className="mb-6">
					<h3 className="text-lg font-medium text-foreground mb-2">
						{question.question}
					</h3>
					<p className="text-muted-foreground">
						{question.questionVn}
					</p>
				</div>

				<div className="space-y-3">
					{question.options.map((option) => (
						<button
							key={option.value}
							onClick={() => onAnswerSelect(option.value)}
							className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
								selectedValue === option.value
									? "border-primary bg-primary/5 text-primary"
									: "border-border bg-card hover:border-primary/50 hover:bg-primary/5"
							}`}
						>
							<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
								selectedValue === option.value
									? "border-primary bg-primary"
									: "border-border"
							}`}>
								{selectedValue === option.value && (
									<div className="w-2 h-2 bg-white rounded-full" />
								)}
							</div>
							<div className="flex-1 text-left">
								<div className="font-medium">{option.text}</div>
								<div className="text-sm text-muted-foreground">{option.textVn}</div>
							</div>
						</button>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
