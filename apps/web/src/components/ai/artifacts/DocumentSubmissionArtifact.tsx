"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AIAssistantArtifact } from "@/lib/types/ai-artifacts";
import type { Document } from "@/lib/types";

interface DocumentSubmissionArtifactProps {
  artifact: AIAssistantArtifact;
}

export function DocumentSubmissionArtifact({ artifact }: DocumentSubmissionArtifactProps) {
  const data = artifact.data as { documents?: Array<Document | string>; note?: string };
  const docs: Document[] = (data.documents || []).map((d) => {
    if (typeof d === "string") {
      return { name: d, nameVn: d, required: true };
    }
    return d;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="vietnam-accent text-base">
            Tài liệu cần nộp / Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Chưa có danh sách tài liệu từ kết quả tra cứu. Hãy thử lại hoặc yêu cầu AI liệt kê rõ các tài liệu cần nộp.
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-md border ${doc.required ? "border-amber-300 bg-amber-50" : "border-border"}`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${doc.required ? "border-amber-400" : "border-border"}`}>
                    {doc.required ? <span className="text-[10px]">!</span> : null}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{doc.name}</div>
                    <div className="text-xs text-muted-foreground">{doc.nameVn}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data.note && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ghi chú / Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{data.note}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
