"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useBirthRegistration } from "./context";
import { complexityColors } from "@/lib/data";
import { useState, useRef } from "react";
import type { Document, UploadedFile } from "@/lib/types";

export function DocumentSubmission() {
	const { state, navigateTo, addUploadedDocument, removeUploadedDocument } = useBirthRegistration();
	const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
	const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

	if (!state.selectedScenario) {
		return (
			<div className="p-8 text-center">
				<p>No scenario selected. Please go back to assessment.</p>
				<Button onClick={() => navigateTo("assessment")}>Back to Assessment</Button>
			</div>
		);
	}

	const handleFileSelect = (index: number, file: File) => {
		const uploadedDoc: UploadedFile = {
			name: file.name,
			file: file,
			documentIndex: index
		};
		addUploadedDocument(uploadedDoc);
	};

	const handleUploadClick = (index: number) => {
		const input = fileInputRefs.current[index];
		if (input) {
			input.click();
		}
	};

	const handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			setUploadingIndex(index);
			// Simulate upload delay
			setTimeout(() => {
				handleFileSelect(index, file);
				setUploadingIndex(null);
			}, 1500);
		}
	};

	const isDocumentUploaded = (index: number) => {
		return state.uploadedDocuments.some(doc => doc.documentIndex === index);
	};

	const getUploadedDocument = (index: number) => {
		return state.uploadedDocuments.find(doc => doc.documentIndex === index);
	};

	const allRequiredDocumentsUploaded = state.selectedScenario.documents
		.filter(doc => doc.required)
		.every((_, index) => isDocumentUploaded(index));

	const handleSubmitDocuments = () => {
		if (allRequiredDocumentsUploaded) {
			navigateTo("processing");
		}
	};

	const complexityClass = complexityColors[state.selectedScenario.complexity];

	return (
		<div className="animate-fade-in">
			{/* Header */}
			<header className="bg-card border-b-2 border-primary py-4">
				<div className="container mx-auto px-6">
					<div className="flex items-center justify-between flex-wrap gap-4">
						<Button 
							variant="outline" 
							onClick={() => navigateTo("assessment")}
							className="text-sm"
						>
							← Quay lại / Back
						</Button>
						<h1 className="text-2xl font-semibold vietnam-accent">
							Nộp tài liệu / Document Submission
						</h1>
						<div className="flex items-center gap-2">
							{Array.from({ length: 5 }, (_, i) => (
								<div
									key={i}
									className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
										i < 1 
											? "bg-green-500 text-white border-green-500" 
											: i === 1
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
				<div className="max-w-6xl mx-auto space-y-8">
					{/* Scenario Summary */}
					<Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
						<CardContent className="p-6">
							<div className="flex items-start justify-between mb-4">
								<div className="flex items-center gap-3">
									<span className="text-2xl">✅</span>
									<div>
										<h3 className="text-lg font-semibold vietnam-accent">
											{state.selectedScenario.name}
										</h3>
										<p className="text-muted-foreground">{state.selectedScenario.nameVn}</p>
									</div>
								</div>
								<span className={`px-3 py-1 text-xs font-medium rounded-full border ${complexityClass}`}>
									{state.selectedScenario.complexity}
								</span>
							</div>

							<div className="grid md:grid-cols-2 gap-4">
								<div className="flex items-center gap-3">
									<span className="text-lg">🏛️</span>
									<div>
										<div className="font-medium text-sm">Authority:</div>
										<div className="text-sm text-muted-foreground">{state.selectedScenario.authority}</div>
									</div>
								</div>
								
								<div className="flex items-center gap-3">
									<span className="text-lg">⏱️</span>
									<div>
										<div className="font-medium text-sm">Timeline:</div>
										<div className="text-sm text-muted-foreground">{state.selectedScenario.timeline}</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid lg:grid-cols-2 gap-8">
						{/* Document Requirements */}
						<Card>
							<CardHeader>
								<CardTitle className="vietnam-accent">
									Tài liệu cần thiết / Required Documents
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{state.selectedScenario.documents.map((document, index) => (
										<DocumentRequirement
											key={index}
											document={document}
											index={index}
											isUploaded={isDocumentUploaded(index)}
										/>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Upload Panel */}
						<Card>
							<CardHeader>
								<CardTitle className="vietnam-accent">
									Tải lên tài liệu / Upload Documents
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{state.selectedScenario.documents.map((document, index) => (
										<UploadArea
											key={index}
											document={document}
											index={index}
											isUploaded={isDocumentUploaded(index)}
											uploadedDocument={getUploadedDocument(index)}
											isUploading={uploadingIndex === index}
											onUploadClick={() => handleUploadClick(index)}
											fileInputRef={(el) => (fileInputRefs.current[index] = el)}
											onFileChange={(e) => handleFileChange(index, e)}
										/>
									))}
								</div>

								{/* Submit Button */}
								<div className="mt-8 pt-6 border-t">
									<Button 
										className={`w-full py-4 text-lg ${
											allRequiredDocumentsUploaded 
												? "vietnam-primary" 
												: "bg-gray-400 cursor-not-allowed"
										}`}
										onClick={handleSubmitDocuments}
										disabled={!allRequiredDocumentsUploaded}
									>
										Nộp tài liệu / Submit Documents
									</Button>
									<p className="text-sm text-muted-foreground text-center mt-2">
										{allRequiredDocumentsUploaded 
											? "Tất cả tài liệu bắt buộc đã được tải lên / All required documents uploaded"
											: "Vui lòng tải lên tất cả tài liệu bắt buộc / Please upload all required documents"
										}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}

interface DocumentRequirementProps {
	document: Document;
	index: number;
	isUploaded: boolean;
}

function DocumentRequirement({ document, index, isUploaded }: DocumentRequirementProps) {
	return (
		<div className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
			isUploaded 
				? "border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-700" 
				: "border-border"
		}`}>
			<div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all ${
				isUploaded 
					? "bg-green-500 border-green-500 text-white" 
					: "border-border"
			}`}>
				{isUploaded && <span className="text-xs">✓</span>}
			</div>
			<div className="flex-1">
				<h4 className="font-medium text-foreground">
					{document.name}
					{document.required && <span className="text-red-500 ml-1">*</span>}
				</h4>
				<p className="text-sm text-muted-foreground">{document.nameVn}</p>
			</div>
		</div>
	);
}

interface UploadAreaProps {
	document: Document;
	index: number;
	isUploaded: boolean;
	uploadedDocument?: UploadedFile;
	isUploading: boolean;
	onUploadClick: () => void;
	fileInputRef: (el: HTMLInputElement | null) => void;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function UploadArea({ 
	document, 
	index, 
	isUploaded, 
	uploadedDocument, 
	isUploading, 
	onUploadClick, 
	fileInputRef, 
	onFileChange 
}: UploadAreaProps) {
	return (
		<div className="relative">
			<input
				type="file"
				ref={fileInputRef}
				onChange={onFileChange}
				className="hidden"
				accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
			/>
			
			<div 
				className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
					isUploading 
						? "border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700"
						: isUploaded 
						? "border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-700"
						: "border-border hover:border-primary/50 hover:bg-primary/5"
				}`}
				onClick={onUploadClick}
			>
				{isUploading ? (
					<div className="space-y-2">
						<div className="text-3xl">⏳</div>
						<div className="font-medium">Đang tải lên... / Uploading...</div>
						<div className="w-full bg-secondary rounded-full h-2">
							<div className="bg-primary h-2 rounded-full animate-pulse w-3/4"></div>
						</div>
					</div>
				) : isUploaded && uploadedDocument ? (
					<div className="space-y-2">
						<div className="text-3xl text-green-500">✅</div>
						<div className="font-medium text-green-700 dark:text-green-300">
							Đã tải lên / Uploaded
						</div>
						<div className="text-sm text-muted-foreground">
							{uploadedDocument.name}
						</div>
					</div>
				) : (
					<div className="space-y-2">
						<div className="text-3xl">📁</div>
						<div className="font-medium">{document.nameVn}</div>
						<div className="text-sm text-muted-foreground">
							Nhấn để chọn tệp / Click to select file
						</div>
						<div className="text-xs text-muted-foreground">
							PDF, JPG, PNG, DOC (Max 10MB)
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
