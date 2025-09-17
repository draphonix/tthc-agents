# Document Extraction Completion Implementation Plan

## Overview
This document outlines the implementation plan for adding a document extraction completion callback mechanism similar to the assessment completion flow.

## Current Flow Analysis

### Assessment Flow (Reference):
1. `AssessmentWizardArtifact.tsx` calls `onAssessmentComplete` when assessment is complete
2. `AIPage.tsx` handles this with `handleAssessmentComplete` which:
   - Replaces wizard with results artifact
   - Sends a message with metadata to the chat system
3. Server route detects metadata and calls `handleAssessmentMessage`
4. Processes assessment and streams back response

### Document Upload Flow (Current):
1. `UploadDocumentation.tsx` calls `onUploadComplete` when upload is complete
2. `ChatPanel.tsx` handles this with `handleUploadComplete` which sends a message to chat
3. Document extraction happens at `/ai/extract` route
4. Results are displayed but no validation is triggered

## Implementation Plan

### 1. Add Extraction Data Types

#### File: `apps/web/src/lib/types/ai-artifacts.ts`
```typescript
// Structured payload that every completed extraction will emit
export interface DocumentExtractionData {
  documentId: string; // stable id so we can track multiple uploads
  fileName: string;
  rawText: string; // full streamed text from the extractor route
  extractedFields?: DocumentExtractionFields; // parsed JSON payload when available
  documentType?: string;
  confidence?: number;
  uploadedAt: string; // ISO timestamp
  source: "chat-panel" | "artifact"; // where the upload happened
}

// Update DocumentUploadState to include extraction status
export interface DocumentUploadState {
  files: File[];
  isUploading: boolean;
  error: string | null;
  messages: any[];
  extraction?: DocumentExtractionData; // newest extraction payload for this slot
}

export type DocumentExtractionFields = Record<string, string | Array<{ key: string; value: string }>>;

#### Shared Schema Utilities
Create a dedicated module (e.g. `apps/web/src/lib/schemas/document-extraction.ts`) to expose Zod schemas that both the client and server can import when they need to validate extraction payloads.

```typescript
import { z } from "zod";

export const DocumentExtractionFieldsSchema = z.record(
  z.union([
    z.string(),
    z.array(z.object({ key: z.string(), value: z.string() }))
  ])
);

export const DocumentExtractionPayloadSchema = z.object({
  documentId: z.string(),
  fileName: z.string(),
  rawText: z.string(),
  extractedFields: DocumentExtractionFieldsSchema.optional(),
  documentType: z.string().optional(),
  confidence: z.number().optional(),
  uploadedAt: z.string(),
  source: z.enum(["chat-panel", "artifact"]),
});

export type DocumentExtractionPayload = z.infer<typeof DocumentExtractionPayloadSchema>;
```
```

### 2. Update UploadDocumentation Component

#### File: `apps/web/src/components/UploadDocumentation.tsx`

#### Changes to Interface:
```typescript
interface UploadDocumentationProps {
  // ... existing props
  documentId?: string; // stable identifier supplied by parent
  source?: "chat-panel" | "artifact";
  onExtractionComplete?: (data: DocumentExtractionData) => void; // New prop
}
```

#### Changes to Extraction Completion Handler:
We keep the existing streaming upload implementation (manual `fetch`) but accumulate the streamed chunks so we can build the extraction payload once streaming ends.

```typescript
const handleUpload = async () => {
  if (currentFiles.length === 0) {
    setCurrentError("Please select a file to upload");
    return;
  }

  setCurrentIsUploading(true);
  setCurrentError(null);
  setCurrentMessages([]);

  const file = currentFiles[0];

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/ai/extract`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let rawText = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        rawText += decoder.decode(value, { stream: true });
        setCurrentMessages(buildStreamingMessage(rawText));
      }
    }

    rawText = rawText.trim();
    setCurrentMessages(buildCompletedMessage(rawText));

    const extraction: DocumentExtractionData = {
      documentId: documentId ?? file.name,
      fileName: file.name,
      rawText,
      extractedFields: parseExtractionResult(rawText),
      documentType: detectDocumentType(rawText),
      confidence: 0.8,
      uploadedAt: new Date().toISOString(),
      source: source ?? "chat-panel",
    };

    onExtractionComplete?.(extraction);
    onUploadComplete?.(extraction);

    if (onCollapseChange) {
      onCollapseChange(true);
    }

    setCurrentIsUploading(false);
  } catch (error) {
    setCurrentIsUploading(false);
    setCurrentError(error instanceof Error ? error.message : "Failed to upload file");
  }
};
```

#### Helper Functions:
```typescript
function parseExtractionResult(rawText: string): DocumentExtractionFields | undefined {
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return undefined;

  try {
    return DocumentExtractionFieldsSchema.parse(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.warn("Failed to parse extraction JSON", error);
    return undefined;
  }
}

function detectDocumentType(rawText: string): string | undefined {
  const lowered = rawText.toLowerCase();
  if (lowered.includes("giay khai sinh") || lowered.includes("birth certificate")) {
    return "birthCertificate";
  }
  if (lowered.includes("marriage certificate") || lowered.includes("đăng ký kết hôn")) {
    return "marriageCertificate";
  }
  return undefined;
}
```

> Implement lightweight helpers like `buildStreamingMessage`/`buildCompletedMessage` that wrap the raw extraction text into the `UIMessage` structure expected by the existing rendering logic. They can reuse the previous message-building behavior while keeping the code focused on the new extraction callback.

> Import `DocumentExtractionFieldsSchema` from the new shared schema module so the parsing logic stays aligned with the server-side validation.

### 3. Update AIPage Component

#### File: `apps/web/src/app/ai/page.tsx`

#### Manage Extraction State and Notifications:
```typescript
const [pendingDocumentIds, setPendingDocumentIds] = useState<string[]>([]);
const [extractions, setExtractions] = useState<Record<string, DocumentExtractionData>>({});
const notifiedDocumentIdsRef = useRef(new Set<string>());

const handleExtractionComplete = (payload: DocumentExtractionData) => {
  setExtractions((prev) => {
    const next = { ...prev, [payload.documentId]: payload };
    maybeNotifyValidation(next, payload.documentId);
    return next;
  });
};

const maybeNotifyValidation = (
  dataset: Record<string, DocumentExtractionData>,
  lastUpdatedId?: string
) => {
  if (pendingDocumentIds.length === 0) {
    const latest = lastUpdatedId ? dataset[lastUpdatedId] : undefined;
    if (!latest || notifiedDocumentIdsRef.current.has(latest.documentId)) return;
    sendMessage({
      text: 'Tôi đã tải tài liệu lên. Xin xác nhận giúp tôi rằng tài liệu đã được xác thực.',
      metadata: {
        type: 'documentExtractionSingle',
        document: latest,
      },
    });
    notifiedDocumentIdsRef.current.add(latest.documentId);
    return;
  }

  const allCompleted = pendingDocumentIds.every((id) => dataset[id]);
  if (!allCompleted) return;

  const documents = pendingDocumentIds
    .map((id) => dataset[id]!)
    .filter((doc) => !notifiedDocumentIdsRef.current.has(doc.documentId));
  if (documents.length === 0) {
    return;
  }
  sendMessage({
    text: 'Tôi đã tải lên toàn bộ tài liệu được yêu cầu. Vui lòng xác thực thông tin giúp tôi.',
    metadata: {
      type: 'documentExtractionBatch',
      documents,
    },
  });
  documents.forEach((doc) => notifiedDocumentIdsRef.current.add(doc.documentId));
  setPendingDocumentIds([]);
};

const handleRequestDocumentSubmission = (documents: DocumentSubmissionData["documents"], note?: string) => {
  addArtifact({
    id: `document-submission-${Date.now()}`,
    kind: "document-submission",
    data: { documents, note },
  });

  const requiredIds = documents.map((doc, index) => {
    const displayName = typeof doc === 'string' ? doc : doc.name;
    return `${displayName}-${index}`;
  });
  setPendingDocumentIds(requiredIds);
};
```

> Remember to import `useRef` in `AIPage.tsx` because the new notification guard relies on it.

#### Pass Handler to Components:
```typescript
<ChatPanel
  className="col-start-1"
  messages={messages}
  onUploadComplete={handleUploadComplete}
  onRequestDocumentSubmission={handleRequestDocumentSubmission}
  onExtractionComplete={handleExtractionComplete}
/>

<ArtifactsPanel
  artifacts={artifacts}
  className="col-start-2"
  onAssessmentComplete={handleAssessmentComplete}
  onDocumentExtractionComplete={handleExtractionComplete}
/>
```

### 4. Update ChatPanel Component

#### File: `apps/web/src/components/ai/layout/ChatPanel.tsx`

#### Update Interface:
```typescript
interface ChatPanelProps {
  className?: string;
  messages: UIMessage[];
  onUploadComplete?: (data: DocumentExtractionData) => void;
  onRequestDocumentSubmission?: (
    documents: Array<{ name: string; nameVn: string; required: boolean } | string>,
    note?: string
  ) => void;
  onExtractionComplete?: (data: DocumentExtractionData) => void;
}

const handleUploadComplete = (data: DocumentExtractionData) => {
  onUploadComplete?.(data);
  onExtractionComplete?.(data);
};
```

#### Update UploadDocumentation Usage:
```typescript
<UploadDocumentation
  reason={output.reason}
  isInChat={true}
  documentId={`${message.id}-requested-doc`}
  source="chat-panel"
  onUploadComplete={handleUploadComplete}
  onExtractionComplete={onExtractionComplete}
/>
```

### 5. Update ArtifactsPanel and DocumentSubmissionArtifact

#### File: `apps/web/src/components/ai/layout/ArtifactsPanel.tsx`

```typescript
interface ArtifactsPanelProps {
  artifacts: AIAssistantArtifact[];
  className?: string;
  onAssessmentComplete?: (answers: AssessmentAnswers) => void;
  onDocumentExtractionComplete?: (data: DocumentExtractionData) => void;
}

case "document-submission":
  return (
    <DocumentSubmissionArtifact
      artifact={artifact}
      onDocumentExtractionComplete={onDocumentExtractionComplete}
    />
  );
```

#### File: `apps/web/src/components/ai/artifacts/DocumentSubmissionArtifact.tsx`

```typescript
interface DocumentSubmissionArtifactProps {
  artifact: AIAssistantArtifact;
  onDocumentExtractionComplete?: (data: DocumentExtractionData) => void;
}

const documentId = `${artifact.id}-${idx}`;

const handleExtractionComplete = (data: DocumentExtractionData) => {
  const payload = { ...data, documentId, source: "artifact" as const };
  setUploadStates((prev) => {
    const current = prev[idx] ?? createEmptyUploadState();
    return {
      ...prev,
      [idx]: {
        ...current,
        extraction: payload,
      },
    };
  });
  onDocumentExtractionComplete?.(payload);
};

<UploadDocumentation
  reason={`upload ${doc.name}`}
  isInChat={true}
  documentId={documentId}
  source="artifact"
  onExtractionComplete={handleExtractionComplete}
  onUploadComplete={handleExtractionComplete}
  // existing props remain
/>

const completedDocumentIds = useMemo(
  () => docs.map((_, index) => `${artifact.id}-${index}`),
  [docs, artifact.id]
);
const allRequiredUploaded = completedDocumentIds.every((_, index) => uploadStates[index]?.extraction);

useEffect(() => {
  if (!allRequiredUploaded || completedDocumentIds.length === 0) {
    return;
  }

  completedDocumentIds.forEach((id, index) => {
    const extraction = uploadStates[index]?.extraction;
    if (extraction) {
      onDocumentExtractionComplete?.(extraction);
    }
  });
}, [allRequiredUploaded, completedDocumentIds, uploadStates, onDocumentExtractionComplete]);
```

> The `useEffect` ensures any uploads that finished before the callback was registered still notify the parent. The `AIPage` logic will deduplicate based on `documentId` before deciding when to notify the chat.

> Introduce a helper (`createEmptyUploadState`) that returns the default `DocumentUploadState` so the updater can safely spread from it when a slot hasn't been initialized yet. Reuse it in `initUploadState`/`resetUploadState` to avoid duplicated literals.

> Update the artifact's helper functions (`initUploadState`, `resetUploadState`, etc.) so the default `DocumentUploadState` also initializes an `extraction` field with `undefined`. This keeps the state shape consistent across fresh and completed uploads.

> Remember to pull `useMemo` into the component's React imports since the new snippet relies on it.

### 6. Update Server Route

#### File: `apps/server/src/app/ai/route.ts`

#### Add Detection for Extraction Completion:
```typescript
const lastMessage = messages[messages.length - 1];

if (lastMessage?.metadata && typeof lastMessage.metadata === "object") {
  if (lastMessage.metadata.type === "documentExtractionSingle" && lastMessage.metadata.document) {
    return handleDocumentExtractionMessage([lastMessage.metadata.document]);
  }

  if (lastMessage.metadata.type === "documentExtractionBatch" && Array.isArray(lastMessage.metadata.documents)) {
    return handleDocumentExtractionMessage(lastMessage.metadata.documents);
  }
}
```

#### Add Handler Function:
```typescript
async function handleDocumentExtractionMessage(rawDocuments: unknown[]) {
  try {
    const documents = z.array(DocumentExtractionPayloadSchema).parse(rawDocuments);

    const summary = documents
      .map((doc, index) => `Tài liệu ${index + 1}: ${doc.fileName}`)
      .join("\n");

    const result = streamText({
      model: google("gemini-2.5-pro"),
      messages: [
        {
          role: "user",
          content: `Các tài liệu đã được tải lên và trích xuất thành công. Hãy xác nhận với người dùng rằng toàn bộ tài liệu đã được kiểm tra và hợp lệ.\n\n${summary}`,
        },
      ],
      system: `Bạn là trợ lý đăng ký khai sinh. Tất cả tài liệu người dùng vừa gửi đều hợp lệ. Hãy phản hồi ngắn gọn bằng tiếng Việt với các yêu cầu sau:\n- Khẳng định tài liệu đã được xác thực ("Tài liệu đã được xác thực" phải xuất hiện).\n- Nêu một vài thông tin quan trọng (nếu available) hoặc cảm ơn người dùng.\n- Gợi ý bước tiếp theo trong quy trình đăng ký khai sinh.\nKhông hỏi thêm thông tin, không yêu cầu tải lại tài liệu.`,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error processing document extraction:", error);
    return new Response(
      JSON.stringify({
        error: "Đã xảy ra lỗi khi xác nhận tài liệu. Vui lòng thử lại.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
```

> Reuse the shared `DocumentExtractionPayloadSchema` instead of the deprecated `DocumentExtractionSchema` utility.
> Ensure the route imports the schema from the shared module (`@/lib/schemas/document-extraction`).

### 7. Refresh Extraction Prompt Utilities

#### File: `apps/server/src/lib/extraction-prompt.ts`

- Remove the deprecated `DocumentExtractionSchema` import.
- Update any tooling helpers (like `displayExtractionTool`) to accept the new `DocumentExtractionFields` shape or remove them if they are no longer needed once the chat flow handles validation directly.
- Ensure all references to the old schema are deleted to avoid confusion when multi-document support lands.

## Implementation Order

1. Add the shared extraction payload schema/types (`apps/web/src/lib/types/ai-artifacts.ts` + new schema module).
2. Update `UploadDocumentation.tsx` to emit structured extraction payloads after streaming finishes.
3. Update `ChatPanel.tsx` so chat-initiated uploads forward extraction payloads to the shared handler.
4. Update `AIPage.tsx` to track pending documents and notify the chat when uploads complete.
5. Update `ArtifactsPanel`/`DocumentSubmissionArtifact` to tag each upload with a stable id and bubble completions up.
6. Update the server route `apps/server/src/app/ai/route.ts` to detect the new metadata and respond with validation confirmation.
7. Remove the deprecated extraction schema usage in `apps/server/src/lib/extraction-prompt.ts`.

## Testing Plan

1. Upload a document from the chat panel and ensure `handleExtractionComplete` receives the structured payload and the chat displays the "đã được xác thực" confirmation.
2. Upload each document in a multi-document request and verify the chat waits until all uploads finish before sending the batch validation message.
3. Confirm the metadata `type` values (`documentExtractionSingle`/`documentExtractionBatch`) reach the server and that the server response includes "Tài liệu đã được xác thực".
4. Validate error handling by simulating an invalid payload and confirming the server returns the structured error response.
5. Ensure UI state (collapsed cards, stored messages) persists correctly after upload resets.
