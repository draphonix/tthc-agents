"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scenarios, routingBenefits, complexityColors } from "@/lib/data";
import { Scenario } from "@/lib/types";
import Image from "next/image";

interface LandingPageProps {
	onStartAssessment: () => void;
}

export function LandingPage({ onStartAssessment }: LandingPageProps) {
	return (
		<div className="animate-fade-in">
			{/* Vietnam Government Header */}
			<header className="vietnam-header shadow-lg">
				<div className="container mx-auto px-6 py-8">
					<div className="flex items-center gap-4">
						<div className="text-5xl">🇻🇳</div>
						<div>
							<h1 className="text-2xl font-bold mb-1">Chính phủ Việt Nam</h1>
							<p className="text-white/90">Government of Vietnam</p>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="container mx-auto px-6 py-8">
				{/* Hero Section */}
				<section className="grid lg:grid-cols-2 gap-12 items-center mb-16">
					<div>
						<h1 className="text-4xl font-bold vietnam-accent mb-4">
							Hệ thống Đăng ký Khai sinh AI
						</h1>
						<h2 className="text-2xl text-muted-foreground mb-6">
							AI-Powered Birth Registration System
						</h2>
						<p className="text-lg mb-4 text-foreground">
							Hệ thống AI thông minh tự động xác định quy trình phù hợp cho từng trường hợp cụ thể.
							Không còn bối rối về thủ tục - AI sẽ hướng dẫn bạn đến đúng con đường.
						</p>
						<p className="text-muted-foreground mb-8 italic">
							Smart AI system automatically determines the appropriate process for each specific case.
							No more confusion about procedures - AI will guide you to the right path.
						</p>
						<Button 
							size="lg" 
							className="vietnam-primary px-8 py-4 text-lg"
							onClick={onStartAssessment}
						>
							Bắt đầu đánh giá / Start Assessment
						</Button>
					</div>
					<div className="relative">
						<div className="bg-card rounded-xl p-8 shadow-lg border">
							<img 
								src="https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/306377b7ac5ce9425b7b5b7170e4be14/817e59ec-882f-4e34-99f3-2234ffe61d1a/94ac73b4.png"
								alt="Intelligent Multi-Path Birth Registration System"
								className="w-full h-auto rounded-lg"
							/>
						</div>
					</div>
				</section>

				{/* Routing Benefits Section */}
				<section className="mb-16">
					<h3 className="text-2xl font-semibold vietnam-accent text-center mb-8">
						Lợi ích của hệ thống định tuyến thông minh / Intelligent Routing Benefits
					</h3>
					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
						{routingBenefits.map((benefit, index) => (
							<Card key={index} className="text-center hover:shadow-md transition-all hover:-translate-y-1">
								<CardContent className="p-6">
									<div className="text-4xl mb-4">{benefit.icon}</div>
									<h4 className="font-semibold vietnam-accent mb-2">{benefit.title}</h4>
									<p className="text-sm text-muted-foreground mb-2">{benefit.titleEn}</p>
									<p className="text-sm">{benefit.description}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</section>

				{/* Scenarios Overview */}
				<section>
					<h3 className="text-2xl font-semibold vietnam-accent text-center mb-8">
						Các trường hợp được hỗ trợ / Supported Scenarios
					</h3>
					<div className="grid lg:grid-cols-2 gap-6">
						{scenarios.map((scenario) => (
							<ScenarioCard key={scenario.id} scenario={scenario} />
						))}
					</div>
				</section>
			</main>
		</div>
	);
}

interface ScenarioCardProps {
	scenario: Scenario;
}

function ScenarioCard({ scenario }: ScenarioCardProps) {
	const complexityClass = complexityColors[scenario.complexity];
	
	return (
		<Card className="hover:shadow-md transition-all hover:-translate-y-1">
			<CardHeader>
				<div className="flex items-start justify-between mb-3">
					<CardTitle className="vietnam-accent text-lg">{scenario.name}</CardTitle>
					<span className={`px-3 py-1 text-xs font-medium rounded-full border ${complexityClass}`}>
						{scenario.complexity}
					</span>
				</div>
				<p className="text-muted-foreground text-base">{scenario.nameVn}</p>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<span className="text-lg">🏛️</span>
						<div>
							<div className="font-medium text-sm">Authority:</div>
							<div className="text-sm text-muted-foreground">{scenario.authority}</div>
							<div className="text-sm text-muted-foreground">{scenario.authorityVn}</div>
						</div>
					</div>
					
					<div className="flex items-center gap-3">
						<span className="text-lg">⏱️</span>
						<div>
							<div className="font-medium text-sm">Timeline:</div>
							<div className="text-sm text-muted-foreground">{scenario.timeline}</div>
							<div className="text-sm text-muted-foreground">{scenario.timelineVn}</div>
						</div>
					</div>
					
					<div>
						<div className="font-medium text-sm mb-2">Documents Required:</div>
						<div className="flex flex-wrap gap-1">
							{scenario.documents.slice(0, 3).map((doc, index) => (
								<span key={index} className="px-2 py-1 bg-secondary text-xs rounded text-muted-foreground">
									{doc.nameVn}
								</span>
							))}
							{scenario.documents.length > 3 && (
								<span className="px-2 py-1 bg-secondary text-xs rounded text-muted-foreground">
									+{scenario.documents.length - 3} more
								</span>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
