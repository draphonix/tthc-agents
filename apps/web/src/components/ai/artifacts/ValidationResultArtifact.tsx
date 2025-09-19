"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIAssistantArtifact, ValidationResultData } from "@/lib/types/ai-artifacts";

interface ValidationResultArtifactProps {
  artifact: AIAssistantArtifact;
}

export function ValidationResultArtifact({ artifact }: ValidationResultArtifactProps) {
  const data = artifact.data as ValidationResultData;

  return (
    <div className="space-y-4">
      {/* Success Message */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 text-center">
        <CardContent className="p-8">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold vietnam-accent mb-2">
            Tài liệu đã được xác thực!
          </h2>
          <h3 className="text-lg text-muted-foreground mb-4">
            Documents Successfully Validated!
          </h3>
          <p className="text-base mb-2">
            {data.fileNames.length === 1
              ? `Tài liệu "${data.fileNames[0]}" đã được kiểm tra và hợp lệ.`
              : `Tất cả ${data.fileNames.length} tài liệu đã được kiểm tra và hợp lệ.`}
          </p>
          <p className="text-muted-foreground">
            {data.fileNames.length === 1
              ? `Document "${data.fileNames[0]}" has been verified and is valid.`
              : `All ${data.fileNames.length} documents have been verified and are valid.`}
          </p>
        </CardContent>
      </Card>

      {/* Document Details */}
      <Card>
        <CardHeader>
          <CardTitle className="vietnam-accent flex items-center gap-2">
            <span>📋</span>
            Chi tiết tài liệu / Document Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.fileNames.map((fileName, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="font-medium">{fileName}</div>
                  <div className="text-sm text-muted-foreground">
                    ID: {data.documentIds[index]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Information */}
      <Card>
        <CardHeader>
          <CardTitle className="vietnam-accent">
            Thông tin xác thực / Validation Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="space-y-2">
              <p>
                <strong>Thời gian xác thực:</strong>{" "}
                {new Date(data.validatedAt).toLocaleString("vi-VN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p>
                <strong>Validation Time:</strong>{" "}
                {new Date(data.validatedAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Tài liệu đã được hệ thống kiểm tra và xác nhận hợp lệ. Bạn có thể tiếp tục với các bước tiếp theo.
              </p>
              <p className="text-sm text-muted-foreground">
                Documents have been verified by the system and confirmed as valid. You can proceed with the next steps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="vietnam-accent">
            Bước tiếp theo / Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-medium">✅ Tải lên tài liệu - Document Upload</p>
            <p className="font-medium">✅ Xác thực thông tin - Information Validation</p>
            <p className="font-medium text-muted-foreground">⏳ Chờ phê duyệt - Pending Approval</p>
            <p className="font-medium text-muted-foreground">⏳ Hoàn thành đăng ký - Complete Registration</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
