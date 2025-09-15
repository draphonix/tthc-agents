"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import type { AssessmentAnswers } from "@/lib/types";
import { determineScenario } from "@/lib/utils/scenario";
import { scenarios } from "@/lib/data";

interface AssessmentResultsProps {
  assessmentAnswers: AssessmentAnswers;
  onBackToChat: () => void;
}

interface ProcessingStep {
  id: string;
  name: string;
  nameVn: string;
  status: "pending" | "processing" | "completed" | "error";
  description?: string;
}

export function AssessmentResults({ assessmentAnswers, onBackToChat }: AssessmentResultsProps) {
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    {
      id: "analyze",
      name: "Analyzing Assessment",
      nameVn: "Phân tích đánh giá",
      status: "pending",
      description: "Processing your assessment answers to determine the scenario"
    },
    {
      id: "rag",
      name: "Querying Knowledge Base",
      nameVn: "Truy vấn cơ sở dữ liệu",
      status: "pending",
      description: "Retrieving relevant information from Vietnamese birth registration database"
    },
    {
      id: "generate",
      name: "Generating Analysis",
      nameVn: "Tạo phân tích",
      status: "pending",
      description: "Creating personalized analysis and document requirements"
    },
    {
      id: "complete",
      name: "Complete",
      nameVn: "Hoàn thành",
      status: "pending",
      description: "Analysis ready for review"
    }
  ]);

  const determinedScenario = determineScenario(assessmentAnswers);

  // Simulate processing steps
  useEffect(() => {
    if (!isProcessing) return;

    const stepTimings = [1000, 2000, 3000, 4000]; // Timing for each step
    
    processingSteps.forEach((step, index) => {
      setTimeout(() => {
        setProcessingSteps(prev => 
          prev.map(s => 
            s.id === step.id 
              ? { ...s, status: index === processingSteps.length - 1 ? "completed" : "processing" }
              : s.status === "processing" ? { ...s, status: "completed" } : s
          )
        );

        // If this is the last step, complete the process
        if (index === processingSteps.length - 1) {
          setTimeout(() => {
            setIsProcessing(false);
            // Generate a sample analysis result
            setAnalysisResult(generateSampleAnalysis(determinedScenario, assessmentAnswers));
          }, 1000);
        }
      }, stepTimings[index]);
    });
  }, [isProcessing, processingSteps, determinedScenario, assessmentAnswers]);

  const getStepIcon = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "processing":
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStepBorderColor = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800";
      case "processing":
        return "border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800";
      case "error":
        return "border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800";
      default:
        return "border-gray-200 bg-gray-50 dark:bg-gray-800";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="bg-card border-b-2 border-primary py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button variant="outline" onClick={onBackToChat}>
              ← Quay lại / Back
            </Button>
            <h1 className="text-2xl font-semibold vietnam-accent">
              Kết quả phân tích / Analysis Results
            </h1>
            <div></div> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Processing Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="vietnam-accent">
                Tiến trình xử lý / Processing Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processingSteps.map((step) => (
                  <div key={step.id} className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${getStepBorderColor(step.status)}`}>
                    {getStepIcon(step.status)}
                    <div className="flex-1">
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-muted-foreground">{step.nameVn}</div>
                      {step.description && (
                        <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        step.status === "completed"
                          ? "bg-green-500 text-white"
                          : step.status === "processing"
                          ? "bg-blue-500 text-white"
                          : step.status === "error"
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {step.status === "completed" ? "Hoàn thành" :
                       step.status === "processing" ? "Đang xử lý" :
                       step.status === "error" ? "Lỗi" : "Chờ"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Results Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Assessment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="vietnam-accent">
                  Tóm tắt đánh giá / Assessment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Scenario Information */}
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold mb-2 vietnam-accent">
                      Tình huống xác định / Determined Scenario
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">{determinedScenario.nameVn}</span>
                        <div className="text-sm text-muted-foreground">{determinedScenario.name}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Cơ quan / Authority</div>
                          <div className="text-sm">{determinedScenario.authorityVn}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Thời gian / Timeline</div>
                          <div className="text-sm">{determinedScenario.timelineVn}</div>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <div className="text-sm font-medium text-muted-foreground">Độ phức tạp / Complexity</div>
                        <span className={`mt-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(determinedScenario.complexity)}`}>
                          {determinedScenario.complexityVn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assessment Answers */}
                  <div>
                    <h3 className="font-semibold mb-2 vietnam-accent">
                      Câu trả lời đánh giá / Assessment Answers
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(assessmentAnswers).map(([key, value]) => {
                        const question = getQuestionText(key);
                        const answer = getAnswerText(key, value);
                        return (
                          <div key={key} className="flex justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm font-medium">{question}</span>
                            <span className="text-sm">{answer}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Required Documents */}
                  <div>
                    <h3 className="font-semibold mb-2 vietnam-accent">
                      Tài liệu cần thiết / Required Documents
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {determinedScenario.documents.map((doc, index) => (
                        <span key={index} className="inline-block px-2 py-1 rounded-full text-xs border border-gray-300">
                          {doc.nameVn}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LLM Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="vietnam-accent">
                  Phân tích chi tiết / Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isProcessing ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                      <p className="text-muted-foreground">
                        Đang phân tích tình huống của bạn...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Analyzing your situation...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {analysisResult}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" onClick={onBackToChat}>
              Tiếp tục trò chuyện / Continue Chat
            </Button>
            <Button>
              Lưu kết quả / Save Results
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Helper functions
function getQuestionText(key: string): string {
  const questionMap: Record<string, string> = {
    married: "Tình trạng hôn nhân / Marital Status",
    foreign: "Quốc tịch cha mẹ / Parent Nationality",
    timing: "Thời gian đăng ký / Registration Timing",
    paternity: "Xác nhận cha con / Paternity Recognition",
    father_present: "Tình trạng cha / Father Status"
  };
  return questionMap[key] || key;
}

function getAnswerText(key: string, value: string): string {
  const answerMap: Record<string, Record<string, string>> = {
    married: {
      yes: "Đã kết hôn / Married",
      no: "Chưa kết hôn / Unmarried"
    },
    foreign: {
      yes: "Có người nước ngoài / Has foreign parent",
      no: "Cả hai đều là người Việt / Both Vietnamese"
    },
    timing: {
      yes: "Trong 60 ngày / Within 60 days",
      no: "Quá 60 ngày / Over 60 days"
    },
    paternity: {
      yes: "Cần xác nhận / Required",
      no: "Không cần / Not required",
      na: "Không áp dụng / Not applicable"
    },
    father_present: {
      yes: "Có mặt / Present",
      no: "Vắng mặt / Absent"
    }
  };
  return answerMap[key]?.[value] || value;
}

function generateSampleAnalysis(scenario: any, answers: AssessmentAnswers): string {
  return `Dựa trên câu trả lời đánh giá của bạn, chúng tôi đã xác định bạn thuộc tình huống: ${scenario.nameVn}

## Phân tích chi tiết

### 1. Tình huống của bạn
${scenario.nameVn} là một trong các tình huống phổ biến khi đăng ký khai sinh tại Việt Nam. Dựa trên thông tin bạn cung cấp:

${answers.married === 'yes' ? '- Cha mẹ đã đăng ký kết hôn hợp pháp' : '- Cha mẹ chưa đăng ký kết hôn'}
${answers.foreign === 'yes' ? '- Có ít nhất một cha/mẹ là người nước ngoài' : '- Cả cha mẹ đều là công dân Việt Nam'}
${answers.timing === 'yes' ? '- Đăng ký trong thời hạn quy định (60 ngày)' : '- Đăng ký quá thời hạn quy định'}

### 2. Giấy tờ cần thiết

Để hoàn tất thủ tục đăng ký khai sinh, bạn cần chuẩn bị các giấy tờ sau:

${scenario.documents.map((doc: any) => `- ${doc.nameVn}`).join('\n')}

### 3. Quy trình thực hiện

1. **Chuẩn bị hồ sơ**: Thu thập đầy đủ các giấy tờ nêu trên
2. **Nộp hồ sơ**: Nộp tại ${scenario.authorityVn}
3. **Thời gian xử lý**: ${scenario.timelineVn}
4. **Nhận kết quả**: Nhận giấy khai sinh sau khi hồ sơ được duyệt

### 4. Lưu ý quan trọng

- Đảm bảo tất cả giấy tờ đều còn hiệu lực và bản sao công chứng
- Nếu có giấy tờ bằng tiếng nước ngoài, cần dịch thuật công chứng sang tiếng Việt
- Kiểm tra kỹ thông tin trước khi nộp để tránh sai sót không đáng có
- Giữ biên lai nộp hồ sơ để theo dõi tiến trình

### 5. Các bước tiếp theo

1. Chuẩn bị đầy đủ giấy tờ theo danh sách trên
2. Đến đúng cơ quan có thẩm quyền để nộp hồ sơ
3. Theo dõi tiến trình xử lý hồ sơ
4. Nhận giấy khai sinh khi hoàn tất

Nếu bạn có bất kỳ câu hỏi nào trong quá trình thực hiện, đừng ngần ngại hỏi chúng tôi để được hướng dẫn chi tiết.`;
}