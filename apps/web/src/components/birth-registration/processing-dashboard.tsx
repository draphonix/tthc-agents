"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBirthRegistration } from "./context";
import { agents } from "@/lib/data";
import { Agent, AgentProcessingState, TimelineStep } from "@/lib/types";
import { generateReferenceCode } from "@/lib/utils/scenario";
import { useEffect, useState } from "react";

export function ProcessingDashboard() {
	const { state, navigateTo, updateProcessingState, setReferenceCode } = useBirthRegistration();
	const [hasStartedProcessing, setHasStartedProcessing] = useState(false);

	if (!state.selectedScenario) {
		return (
			<div className="p-8 text-center">
				<p>No scenario selected. Please go back to assessment.</p>
				<Button onClick={() => navigateTo("assessment")}>Back to Assessment</Button>
			</div>
		);
	}

	const scenarioAgents = agents.filter(agent => 
		state.selectedScenario!.agents.includes(agent.id)
	);

	// Initialize and simulate processing
	useEffect(() => {
		if (!hasStartedProcessing) {
			initializeProcessing();
			setHasStartedProcessing(true);
		}
	}, [hasStartedProcessing]);

	const initializeProcessing = () => {
		// Generate reference code
		const refCode = generateReferenceCode();
		setReferenceCode(refCode);

		// Initialize agent states
		const agentStates: Record<string, AgentProcessingState> = {};
		scenarioAgents.forEach((agent, index) => {
			agentStates[agent.id] = {
				id: agent.id,
				status: index === 0 ? "processing" : "waiting",
				progress: index === 0 ? 10 : 0,
				steps: getAgentSteps(agent.id),
				currentStep: index === 0 ? getAgentSteps(agent.id)[0] : undefined
			};
		});

		// Initialize timeline
		const timeline: TimelineStep[] = scenarioAgents.map((agent, index) => ({
			id: agent.id,
			title: agent.nameVn,
			description: agent.descriptionVn,
			status: index === 0 ? "current" : "pending"
		}));

		updateProcessingState({
			agents: agentStates,
			timeline,
			currentStep: scenarioAgents[0]?.nameVn || "",
			overallProgress: 5
		});

		// Start processing simulation
		simulateProcessing(agentStates, timeline);
	};

	const simulateProcessing = async (
		initialAgents: Record<string, AgentProcessingState>,
		initialTimeline: TimelineStep[]
	) => {
		let currentAgents = { ...initialAgents };
		let currentTimeline = [...initialTimeline];
		let overallProgress = 5;

		for (let i = 0; i < scenarioAgents.length; i++) {
			const agent = scenarioAgents[i];
			const agentDuration = getAgentDuration(agent.id);

			// Process current agent
			for (let step = 0; step < agentDuration; step++) {
				await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second intervals

				const progress = Math.round(((step + 1) / agentDuration) * 100);
				currentAgents[agent.id] = {
					...currentAgents[agent.id],
					progress,
					status: progress === 100 ? "completed" : "processing"
				};

				overallProgress = Math.round(((i + (step + 1) / agentDuration) / scenarioAgents.length) * 100);

				// Update timeline
				if (progress === 100) {
					currentTimeline[i] = {
						...currentTimeline[i],
						status: "completed",
						timestamp: new Date()
					};

					// Start next agent
					if (i + 1 < scenarioAgents.length) {
						currentAgents[scenarioAgents[i + 1].id] = {
							...currentAgents[scenarioAgents[i + 1].id],
							status: "processing",
							progress: 10,
							currentStep: getAgentSteps(scenarioAgents[i + 1].id)[0]
						};

						currentTimeline[i + 1] = {
							...currentTimeline[i + 1],
							status: "current"
						};
					}
				}

				updateProcessingState({
					agents: { ...currentAgents },
					timeline: [...currentTimeline],
					overallProgress,
					currentStep: agent.nameVn,
					timeRemaining: Math.max(1, Math.round((100 - overallProgress) / 2))
				});
			}
		}

		// Processing complete - navigate to completion
		setTimeout(() => {
			navigateTo("completion");
		}, 2000);
	};

	const getAgentSteps = (agentId: string): string[] => {
		const stepMap: Record<string, string[]> = {
			intake: ["Nhận tài liệu", "Phân loại hồ sơ", "Kiểm tra tính đầy đủ"],
			validation: ["Xác thực chữ ký", "Kiểm tra tính hợp lệ", "Xác minh nguồn gốc"],
			extraction: ["Quét tài liệu", "Trích xuất thông tin", "Xử lý OCR"],
			paternity: ["Xem xét đơn", "Xác minh nhân chứng", "Phê duyệt quan hệ"],
			dna: ["Nhận mẫu ADN", "Phân tích kết quả", "Xác minh chính xác"],
			embassy: ["Liên hệ đại sứ quán", "Xác thực tài liệu", "Nhận chứng nhận"],
			nationality: ["Xem xét thỏa thuận", "Kiểm tra quy định", "Phê duyệt quốc tịch"],
			late: ["Xem xét lý do", "Kiểm tra bằng chứng", "Quyết định chấp nhận"],
			verification: ["Kiểm tra cơ sở dữ liệu", "Xác minh chéo", "Cập nhật hệ thống"],
			approval: ["Xem xét cuối cùng", "Ký phê duyệt", "Chuyển tạo giấy tờ"],
			generation: ["Tạo giấy khai sinh", "In ấn tài liệu", "Hoàn thiện hồ sơ"]
		};
		return stepMap[agentId] || ["Xử lý", "Hoàn thành"];
	};

	const getAgentDuration = (agentId: string): number => {
		const durationMap: Record<string, number> = {
			intake: 3,
			validation: 4,
			extraction: 3,
			paternity: 5,
			dna: 6,
			embassy: 7,
			nationality: 4,
			late: 5,
			verification: 4,
			approval: 3,
			generation: 3
		};
		return durationMap[agentId] || 3;
	};

	return (
		<div className="animate-fade-in">
			{/* Header */}
			<header className="bg-card border-b-2 border-primary py-4">
				<div className="container mx-auto px-6">
					<div className="flex items-center justify-between flex-wrap gap-4">
						<div className="flex items-center gap-4">
							<h1 className="text-2xl font-semibold vietnam-accent">
								Xử lý chuyên biệt / Specialized Processing
							</h1>
							{state.referenceCode && (
								<span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-mono">
									{state.referenceCode}
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							{Array.from({ length: 5 }, (_, i) => (
								<div
									key={i}
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
										i < 2 
											? "bg-green-500 text-white border-green-500" 
											: i === 2
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
				<div className="max-w-7xl mx-auto space-y-8">
					{/* Processing Overview */}
					<div className="grid lg:grid-cols-3 gap-6">
						{/* Authority Info */}
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<span className="text-2xl">🏛️</span>
									<div>
										<h3 className="font-semibold vietnam-accent">Processing Authority</h3>
										<p className="text-sm text-muted-foreground">Cơ quan xử lý</p>
									</div>
								</div>
								<div className="space-y-2">
									<p className="font-medium">{state.selectedScenario.authority}</p>
									<p className="text-sm text-muted-foreground">{state.selectedScenario.authorityVn}</p>
								</div>
							</CardContent>
						</Card>

						{/* Timeline Estimate */}
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<span className="text-2xl">⏱️</span>
									<div>
										<h3 className="font-semibold vietnam-accent">Timeline Estimate</h3>
										<p className="text-sm text-muted-foreground">Ước tính thời gian</p>
									</div>
								</div>
								<div className="space-y-2">
									<p className="font-medium">{state.selectedScenario.timeline}</p>
									<p className="text-sm text-muted-foreground">{state.selectedScenario.timelineVn}</p>
								</div>
							</CardContent>
						</Card>

						{/* Overall Progress */}
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center gap-3 mb-4">
									<span className="text-2xl">📊</span>
									<div>
										<h3 className="font-semibold vietnam-accent">Overall Progress</h3>
										<p className="text-sm text-muted-foreground">Tiến độ tổng thể</p>
									</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<div className="flex-1 bg-secondary rounded-full h-3">
											<div 
												className="progress-vietnam h-3 rounded-full transition-all duration-1000"
												style={{ width: `${state.processingState.overallProgress}%` }}
											/>
										</div>
										<span className="font-bold vietnam-accent min-w-[3rem]">
											{state.processingState.overallProgress}%
										</span>
									</div>
									<p className="text-sm text-muted-foreground">
										Time remaining: {state.processingState.timeRemaining} minutes
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Agents Grid */}
					<div>
						<h3 className="text-xl font-semibold vietnam-accent mb-6">
							AI Processing Agents / Các Agent AI xử lý
						</h3>
						<div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
							{scenarioAgents.map(agent => (
								<AgentCard 
									key={agent.id} 
									agent={agent} 
									processingState={state.processingState.agents[agent.id]}
								/>
							))}
						</div>
					</div>

					{/* Processing Timeline */}
					<Card>
						<CardHeader>
							<CardTitle className="vietnam-accent">
								Dòng thời gian xử lý / Processing Timeline
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{state.processingState.timeline.map((step, index) => (
									<TimelineItem key={step.id} step={step} isLast={index === state.processingState.timeline.length - 1} />
								))}
							</div>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
}

interface AgentCardProps {
	agent: Agent;
	processingState?: AgentProcessingState;
}

function AgentCard({ agent, processingState }: AgentCardProps) {
	if (!processingState) return null;

	const getStatusColor = () => {
		switch (processingState.status) {
			case "completed":
				return "border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-700";
			case "processing":
				return "border-primary bg-primary/5 dark:bg-primary/10";
			default:
				return "border-border bg-card";
		}
	};

	const getStatusIcon = () => {
		switch (processingState.status) {
			case "completed":
				return "✅";
			case "processing":
				return "⚡";
			default:
				return "⏳";
		}
	};

	return (
		<Card className={`transition-all ${getStatusColor()}`}>
			<CardContent className="p-6">
				<div className="flex items-center gap-3 mb-4">
					<span className="text-2xl">{agent.icon}</span>
					<div className="flex-1">
						<h4 className="font-semibold vietnam-accent">{agent.name}</h4>
						<p className="text-sm text-muted-foreground">{agent.nameVn}</p>
					</div>
					<span className="text-xl">{getStatusIcon()}</span>
				</div>

				<p className="text-sm text-muted-foreground mb-4">{agent.descriptionVn}</p>

				{processingState.status !== "waiting" && (
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<div className="flex-1 bg-secondary rounded-full h-2">
								<div 
									className={`h-2 rounded-full transition-all duration-500 ${
										processingState.status === "processing" 
											? "bg-primary animate-pulse-slow" 
											: "bg-green-500"
									}`}
									style={{ width: `${processingState.progress}%` }}
								/>
							</div>
							<span className="text-sm font-medium">{processingState.progress}%</span>
						</div>

						{processingState.currentStep && (
							<p className="text-xs text-muted-foreground">
								Current: {processingState.currentStep}
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

interface TimelineItemProps {
	step: TimelineStep;
	isLast: boolean;
}

function TimelineItem({ step, isLast }: TimelineItemProps) {
	const getStatusColor = () => {
		switch (step.status) {
			case "completed":
				return "bg-green-500 border-green-500 text-white";
			case "current":
				return "bg-primary border-primary text-white animate-pulse-slow";
			default:
				return "bg-secondary border-border text-muted-foreground";
		}
	};

	const getStatusIcon = () => {
		switch (step.status) {
			case "completed":
				return "✓";
			case "current":
				return "⚡";
			default:
				return step.title[0];
		}
	};

	return (
		<div className="flex items-start gap-4 relative">
			{!isLast && (
				<div className="absolute left-4 top-8 w-0.5 h-16 bg-border" />
			)}
			
			<div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${getStatusColor()}`}>
				{getStatusIcon()}
			</div>
			
			<div className="flex-1 pb-4">
				<h4 className="font-medium">{step.title}</h4>
				<p className="text-sm text-muted-foreground">{step.description}</p>
				{step.timestamp && (
					<p className="text-xs text-muted-foreground mt-1">
						Completed at {step.timestamp.toLocaleTimeString()}
					</p>
				)}
			</div>
		</div>
	);
}
