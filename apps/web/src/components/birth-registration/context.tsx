"use client";

import React, { createContext, useContext, useReducer, type ReactNode } from "react";
import type { ApplicationState, ViewName, Scenario, AssessmentAnswers, UploadedFile, ProcessingState } from "@/lib/types";

// Initial state
const initialProcessingState: ProcessingState = {
	overallProgress: 0,
	agents: {},
	notifications: [],
	timeRemaining: 60,
	currentStep: "",
	timeline: []
};

const initialState: ApplicationState = {
	currentView: "landing",
	selectedScenario: null,
	assessmentAnswers: {},
	uploadedDocuments: [],
	processingState: initialProcessingState
};

// Action types
type Action = 
	| { type: "SET_VIEW"; payload: ViewName }
	| { type: "SET_SELECTED_SCENARIO"; payload: Scenario | null }
	| { type: "SET_ASSESSMENT_ANSWER"; payload: { questionId: string; value: string } }
	| { type: "RESET_ASSESSMENT_ANSWERS" }
	| { type: "ADD_UPLOADED_DOCUMENT"; payload: UploadedFile }
	| { type: "REMOVE_UPLOADED_DOCUMENT"; payload: number }
	| { type: "UPDATE_PROCESSING_STATE"; payload: Partial<ProcessingState> }
	| { type: "SET_REFERENCE_CODE"; payload: string }
	| { type: "RESET_APPLICATION" };

// Reducer
function appReducer(state: ApplicationState, action: Action): ApplicationState {
	switch (action.type) {
		case "SET_VIEW":
			return { ...state, currentView: action.payload };
		case "SET_SELECTED_SCENARIO":
			return { ...state, selectedScenario: action.payload };
		case "SET_ASSESSMENT_ANSWER":
			return {
				...state,
				assessmentAnswers: {
					...state.assessmentAnswers,
					[action.payload.questionId]: action.payload.value
				}
			};
		case "RESET_ASSESSMENT_ANSWERS":
			return { ...state, assessmentAnswers: {} };
		case "ADD_UPLOADED_DOCUMENT":
			return {
				...state,
				uploadedDocuments: [...state.uploadedDocuments, action.payload]
			};
		case "REMOVE_UPLOADED_DOCUMENT":
			return {
				...state,
				uploadedDocuments: state.uploadedDocuments.filter((_, index) => index !== action.payload)
			};
		case "UPDATE_PROCESSING_STATE":
			return {
				...state,
				processingState: { ...state.processingState, ...action.payload }
			};
		case "SET_REFERENCE_CODE":
			return { ...state, referenceCode: action.payload };
		case "RESET_APPLICATION":
			return initialState;
		default:
			return state;
	}
}

// Context
interface BirthRegistrationContextType {
	state: ApplicationState;
	dispatch: React.Dispatch<Action>;
	// Helper functions
	navigateTo: (view: ViewName) => void;
	setSelectedScenario: (scenario: Scenario | null) => void;
	setAssessmentAnswer: (questionId: string, value: string) => void;
	addUploadedDocument: (document: UploadedFile) => void;
	removeUploadedDocument: (index: number) => void;
	updateProcessingState: (updates: Partial<ProcessingState>) => void;
	setReferenceCode: (code: string) => void;
	resetApplication: () => void;
}

const BirthRegistrationContext = createContext<BirthRegistrationContextType | undefined>(undefined);

// Provider component
interface BirthRegistrationProviderProps {
	children: ReactNode;
}

export function BirthRegistrationProvider({ children }: BirthRegistrationProviderProps) {
	const [state, dispatch] = useReducer(appReducer, initialState);

	const contextValue: BirthRegistrationContextType = {
		state,
		dispatch,
		navigateTo: (view: ViewName) => dispatch({ type: "SET_VIEW", payload: view }),
		setSelectedScenario: (scenario: Scenario | null) => dispatch({ type: "SET_SELECTED_SCENARIO", payload: scenario }),
		setAssessmentAnswer: (questionId: string, value: string) => dispatch({ type: "SET_ASSESSMENT_ANSWER", payload: { questionId, value } }),
		addUploadedDocument: (document: UploadedFile) => dispatch({ type: "ADD_UPLOADED_DOCUMENT", payload: document }),
		removeUploadedDocument: (index: number) => dispatch({ type: "REMOVE_UPLOADED_DOCUMENT", payload: index }),
		updateProcessingState: (updates: Partial<ProcessingState>) => dispatch({ type: "UPDATE_PROCESSING_STATE", payload: updates }),
		setReferenceCode: (code: string) => dispatch({ type: "SET_REFERENCE_CODE", payload: code }),
		resetApplication: () => dispatch({ type: "RESET_APPLICATION" })
	};

	return (
		<BirthRegistrationContext.Provider value={contextValue}>
			{children}
		</BirthRegistrationContext.Provider>
	);
}

// Custom hook
export function useBirthRegistration() {
	const context = useContext(BirthRegistrationContext);
	if (!context) {
		throw new Error("useBirthRegistration must be used within a BirthRegistrationProvider");
	}
	return context;
}
