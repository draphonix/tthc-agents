import { AssessmentAnswers, Scenario } from "../types";
import { scenarios } from "../data";

/**
 * Determines the appropriate scenario based on assessment answers
 */
export function determineScenario(answers: AssessmentAnswers): Scenario {
	const { married, foreign, timing, father_present } = answers;
	
	// Late registration overrides other scenarios
	if (timing === 'no') {
		return scenarios.find(s => s.id === 'late_registration')!;
	}
	
	// Single parent case
	if (father_present === 'no') {
		return scenarios.find(s => s.id === 'single_parent')!;
	}
	
	// Married parents
	if (married === 'yes') {
		if (foreign === 'yes') {
			return scenarios.find(s => s.id === 'married_vn_foreign')!;
		} else {
			return scenarios.find(s => s.id === 'married_vn_vn')!;
		}
	}
	
	// Unmarried parents
	if (married === 'no') {
		if (foreign === 'yes') {
			return scenarios.find(s => s.id === 'unmarried_vn_foreign')!;
		} else {
			return scenarios.find(s => s.id === 'unmarried_vn_vn')!;
		}
	}
	
	// Default to simplest case
	return scenarios.find(s => s.id === 'married_vn_vn')!;
}

/**
 * Checks if all required assessment questions have been answered
 */
export function isAssessmentComplete(answers: AssessmentAnswers): boolean {
	const requiredQuestions = ['married', 'foreign', 'timing', 'father_present'];
	return requiredQuestions.every(q => answers[q as keyof AssessmentAnswers]);
}

/**
 * Formats time duration in Vietnamese and English
 */
export function formatTime(minutes: number): string {
	if (minutes < 60) {
		return `${minutes} phút / ${minutes} minutes`;
	}
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	return `${hours}:${mins.toString().padStart(2, '0')} giờ / ${hours}:${mins.toString().padStart(2, '0')} hours`;
}

/**
 * Generates a reference code for the birth registration
 */
export function generateReferenceCode(): string {
	const date = new Date();
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
	return `VN-BR-${year}-${month}-${day}-${random}`;
}
