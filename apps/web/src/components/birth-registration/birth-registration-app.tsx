"use client";

import { BirthRegistrationProvider, useBirthRegistration } from "./context";
import { LandingPage } from "./landing-page";
import { SmartAssessment } from "./smart-assessment";
import { DocumentSubmission } from "./document-submission";
import { ProcessingDashboard } from "./processing-dashboard";
import { CertificateDelivery } from "./certificate-delivery";


// We'll import these components as we create them
// import { StatusTracking } from "./status-tracking";

function BirthRegistrationContent() {
	const { state, navigateTo } = useBirthRegistration();

	const renderCurrentView = () => {
		switch (state.currentView) {
			case "landing":
				return <LandingPage onStartAssessment={() => navigateTo("assessment")} />;
			case "assessment":
				return <SmartAssessment />;
			case "documents":
				return <DocumentSubmission />;
			case "processing":
				return <ProcessingDashboard />;
			case "tracking":
				// return <StatusTracking />;
				return <div className="p-8 text-center">Status Tracking - Coming Soon</div>;
			case "completion":
				return <CertificateDelivery />;
			default:
				return <LandingPage onStartAssessment={() => navigateTo("assessment")} />;
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{renderCurrentView()}
		</div>
	);
}

export function BirthRegistrationApp() {
	return (
		<BirthRegistrationProvider>
			<BirthRegistrationContent />
		</BirthRegistrationProvider>
	);
}
