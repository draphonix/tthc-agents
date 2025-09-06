export interface Document {
	name: string;
	nameVn: string;
	required: boolean;
}

export interface Agent {
	id: string;
	name: string;
	nameVn: string;
	icon: string;
	description: string;
	descriptionVn: string;
}

export interface Scenario {
	id: string;
	name: string;
	nameVn: string;
	authority: string;
	authorityVn: string;
	timeline: string;
	timelineVn: string;
	complexity: "Low" | "Medium" | "High";
	complexityVn: string;
	agents: string[];
	documents: Document[];
}

export interface AssessmentOption {
	value: string;
	text: string;
	textVn: string;
}

export interface AssessmentQuestion {
	id: string;
	question: string;
	questionVn: string;
	options: AssessmentOption[];
}

export interface AssessmentAnswers {
	married?: string;
	foreign?: string;
	timing?: string;
	paternity?: string;
	father_present?: string;
}

export interface UploadedFile {
	name: string;
	file: File;
	documentIndex: number;
}

export interface AgentProcessingState {
	id: string;
	status: "waiting" | "processing" | "completed";
	progress: number;
	currentStep?: string;
	steps: string[];
}

export interface Notification {
	id: string;
	type: "info" | "success" | "warning" | "error";
	title: string;
	message: string;
	timestamp: Date;
	icon: string;
}

export interface TimelineStep {
	id: string;
	title: string;
	description: string;
	status: "completed" | "current" | "pending";
	timestamp?: Date;
}

export interface ProcessingState {
	overallProgress: number;
	agents: Record<string, AgentProcessingState>;
	notifications: Notification[];
	timeRemaining: number;
	currentStep: string;
	timeline: TimelineStep[];
}

export interface ApplicationState {
	currentView: "landing" | "assessment" | "documents" | "processing" | "tracking" | "completion";
	selectedScenario: Scenario | null;
	assessmentAnswers: AssessmentAnswers;
	uploadedDocuments: UploadedFile[];
	processingState: ProcessingState;
	referenceCode?: string;
}

export type ViewName = ApplicationState["currentView"];

export type ComplexityLevel = Scenario["complexity"];

export type AgentId = Agent["id"];

export type ScenarioId = Scenario["id"];
