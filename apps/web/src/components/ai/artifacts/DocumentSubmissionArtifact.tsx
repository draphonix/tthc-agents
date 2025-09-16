"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { UploadDocumentation } from "@/components/UploadDocumentation";
import type { AIAssistantArtifact, DocumentUploadState } from "@/lib/types/ai-artifacts";
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

  // State to track collapsed state for each document
  const [collapsedStates, setCollapsedStates] = useState<Record<number, boolean>>({});
  
  // State to track upload state for each document
  const [uploadStates, setUploadStates] = useState<Record<number, DocumentUploadState>>({});
  
  // Handle collapse state change for a document
  const handleCollapseChange = (index: number, collapsed: boolean) => {
    setCollapsedStates(prev => ({
      ...prev,
      [index]: collapsed
    }));
  };

  // Initialize upload state for a document
  const initUploadState = (index: number) => {
    if (!uploadStates[index]) {
      setUploadStates(prev => ({
        ...prev,
        [index]: {
          files: [],
          isUploading: false,
          error: null,
          messages: []
        }
      }));
    }
  };

  // Update files for a document
  const updateFiles = (index: number, files: File[]) => {
    setUploadStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        files
      }
    }));
  };

  // Update uploading status for a document
  const setUploading = (index: number, isUploading: boolean) => {
    setUploadStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        isUploading
      }
    }));
  };

  // Update error for a document
  const setError = (index: number, error: string | null) => {
    setUploadStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        error
      }
    }));
  };

  // Update messages for a document
  const setMessages = (index: number, messages: any[]) => {
    setUploadStates(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        messages
      }
    }));
  };

  // Reset upload state for a document
  const resetUploadState = (index: number) => {
    setUploadStates(prev => ({
      ...prev,
      [index]: {
        files: [],
        isUploading: false,
        error: null,
        messages: []
      }
    }));
  };

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
            <div className="space-y-3">
              {docs.map((doc, idx) => (
                <Collapsible
                  key={idx}
                  title={
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${doc.required ? "border-amber-400" : "border-border"}`}>
                        {doc.required ? <span className="text-[10px]">!</span> : null}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{doc.name}</div>
                        <div className="text-xs text-muted-foreground">{doc.nameVn}</div>
                      </div>
                    </div>
                  }
                  defaultOpen={false}
                  className={doc.required ? "border-amber-300 bg-amber-50" : ""}
                >
                  <UploadDocumentation
                    reason={`upload ${doc.name}`}
                    isInChat={true}
                    documentName={doc.name}
                    collapsed={collapsedStates[idx] || false}
                    onCollapseChange={(collapsed) => handleCollapseChange(idx, collapsed)}
                    // Pass state as props
                    files={uploadStates[idx]?.files || []}
                    isUploading={uploadStates[idx]?.isUploading || false}
                    error={uploadStates[idx]?.error || null}
                    messages={uploadStates[idx]?.messages || []}
                    // Pass state update handlers
                    onFilesChange={(files: File[]) => updateFiles(idx, files)}
                    onUploadingChange={(isUploading: boolean) => setUploading(idx, isUploading)}
                    onErrorChange={(error: string | null) => setError(idx, error)}
                    onMessagesChange={(messages: any[]) => setMessages(idx, messages)}
                    onReset={() => resetUploadState(idx)}
                  />
                </Collapsible>
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
