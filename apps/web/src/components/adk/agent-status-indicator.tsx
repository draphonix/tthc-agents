"use client";

import { 
  Bot, 
  Search, 
  FileImage, 
  CheckCircle, 
  Database, 
  Mail,
  AlertCircle,
  Loader2
} from "lucide-react";

interface AgentStatusIndicatorProps {
  currentAgent: string | null;
  processingStage: string | null;
  isLoading: boolean;
}

export function AgentStatusIndicator({ 
  currentAgent, 
  processingStage, 
  isLoading 
}: AgentStatusIndicatorProps) {
  const getAgentIcon = (agent: string | null) => {
    switch (agent) {
      case "OrchestratorAgent":
        return <Bot size={16} className="text-blue-600" />;
      case "ClassificationAgent":
        return <Search size={16} className="text-purple-600" />;
      case "DocumentProcessorAgent":
        return <FileImage size={16} className="text-green-600" />;
      case "ValidatorAgent":
        return <CheckCircle size={16} className="text-orange-600" />;
      case "GroundTruthAgent":
        return <Database size={16} className="text-indigo-600" />;
      case "DeliveryAgent":
        return <Mail size={16} className="text-pink-600" />;
      case "System":
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Bot size={16} className="text-gray-600" />;
    }
  };

  const getAgentDisplayName = (agent: string | null) => {
    switch (agent) {
      case "OrchestratorAgent":
        return "Orchestrator";
      case "ClassificationAgent":
        return "Legal Research";
      case "DocumentProcessorAgent":
        return "Document Analysis";
      case "ValidatorAgent":
        return "Validation";
      case "GroundTruthAgent":
        return "Database Query";
      case "DeliveryAgent":
        return "Notification";
      case "System":
        return "System";
      default:
        return "Ready";
    }
  };

  const getAgentDescription = (agent: string | null) => {
    switch (agent) {
      case "OrchestratorAgent":
        return "Coordinating your request";
      case "ClassificationAgent":
        return "Researching legal requirements";
      case "DocumentProcessorAgent":
        return "Processing your documents";
      case "ValidatorAgent":
        return "Validating information";
      case "GroundTruthAgent":
        return "Checking database records";
      case "DeliveryAgent":
        return "Preparing notifications";
      case "System":
        return "System operation";
      default:
        return "Waiting for your message";
    }
  };

  if (!isLoading && !currentAgent) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-muted-foreground">
          Ready to help with birth certificate registration
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status indicator */}
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-primary" />
        ) : (
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        )}
        
        {currentAgent && getAgentIcon(currentAgent)}
      </div>

      {/* Agent info */}
      <div className="flex flex-col">
        <div className="text-sm font-medium">
          {getAgentDisplayName(currentAgent)}
        </div>
        <div className="text-xs text-muted-foreground">
          {processingStage || getAgentDescription(currentAgent)}
        </div>
      </div>
    </div>
  );
}
