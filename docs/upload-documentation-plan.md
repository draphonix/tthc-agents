# UploadDocumentation Feature – Implementation Plan

> **Location**: `docs/upload-documentation-plan.md`
> **Last updated**: 2025-09-13

---

## 1. Objective
Provide an end-to-end workflow that lets users upload a document (PDF, DOCX, TXT, MD) and receive extracted, structured information in real time. Extraction is powered by the **Gemini-2.5-pro** model running behind **vLLM** and streamed to the UI using **Vercel AI SDK v5 Generative UI**.

---

## 2. User Experience Flow
1. **Navigate** to *AI Assistant* page.
2. **Click** “Upload Documentation”. A modal (or inline panel) with a drag-and-drop zone appears.
3. **Select / drop** one or more files.
4. **Submit** → UI shows an “Uploading…” spinner.
5. **Server** streams extraction chunks (JSON → text/UI) back to the client.
6. **UI** renders incremental results (key-value cards, tables, etc.).
7. **User** may download JSON, copy to clipboard, or start a follow-up chat about the document.

---

## 3. High-Level Architecture
```text path=null start=null
   +-------------+           multipart/form-data            +--------------------+
   |  Browser    |  ───────────────────────────────────────► |  Next.js API Route |
   |  (Upload    |                                         |   /ai/extract      |
   |  Component) |  ◄───────── streamed UI response ─────── |    (server)        |
   +-------------+                                         +---------+----------+
                                                                │
                                                   Plain text   │ prompt
                                                                ▼
                                                        +-------------+
                                                        |  vLLM +     |
                                                        | Gemini-2.5- | 
                                                        |     pro     |
                                                        +-------------+
```

---

## 4. Agent-Driven Generative UI Flow (Conditional Upload)
This feature empowers the **LLM itself** to decide whether a document is required. We expose an `requestDocumentUpload` tool; when Gemini calls it, the Upload UI is streamed to the client.

### 4.1 Tool Definition (server / RSC)
```ts path=null start=null
import { z } from 'zod';
import { tool as createTool } from 'ai';
import { UploadDocumentation } from '@/components/UploadDocumentation';

export const requestDocumentUpload = createTool({
  description: 'Ask the user to provide a document needed to continue the conversation',
  inputSchema: z.object({
    reason: z.string().describe('Why the document is required'),
  }),
  generate: async function* ({ reason }) {
    // Initial placeholder
    yield (
      <div className="mb-2 italic text-sm text-muted-foreground">
        I need to see your document to {reason}. Please upload it below.
      </div>
    );
    // Final UI: the upload component
    return <UploadDocumentation />;
  },
});
```

### 4.2 Conversation Lifecycle
1. User asks a question.
2. Gemini determines extra context is needed and invokes `requestDocumentUpload`.
3. Client renders streamed placeholder → `<UploadDocumentation />`.
4. User uploads file; component POSTs to `/ai/extract`.
5. Server streams extraction; UI updates live.
6. Extracted JSON is added to AI state for subsequent answers.

### 4.3 AI vs UI State
| Layer | Content |
|-------|---------|
| AI State | Serializable JSON: chat history, extraction JSON, tool calls |
| UI State | React elements: UploadDocumentation component, streamed extraction UI |

---

## 5. File & Directory Additions
| Path | Purpose |
|------|---------|
| `apps/web/src/components/UploadDocumentation.tsx` | New client component (drag-and-drop + streaming display) |
| `apps/server/src/app/ai/extract/route.ts` | Server route that accepts file uploads and streams extraction |
| `apps/web/src/lib/file-utils.ts` | Helpers for MIME checks, base64, etc. |
| `apps/server/src/lib/convert-to-text.ts` | Node utilities to convert PDF/DOCX to plain text (MVP: pass through TXT/MD) |
| `prompt/extract-schema.md` | Prompt template & JSON schema description |
| `docs/upload-documentation-plan.md` | (this file) detailed implementation plan |

---

## 5. Component Design
### 5.1 UploadDocumentation.tsx (client)
- **State**
  - `files: File[]`
  - `messages` from `useChat`
- **Transport**
  ```ts
  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({ api: `${process.env.NEXT_PUBLIC_SERVER_URL}/ai/extract` }),
  });
  ```
- **UI States**
  1. Idle – show drop zone
  2. Uploading – spinner with progress (optional)
  3. Streaming – map `messages` → render <Response> / custom cards
  4. Error – red banner with retry
- **Validation**: max 10 MB/file, allowed types array.

### 5.2 Response rendering
Use the same `Response` component already in `AIPage` but extend to detect special JSON keys (e.g., `tool-displayExtraction`) similar to weather example from how-to.

---

## 6. Server Route – /ai/extract/route.ts
```ts
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get('file') as File; // MVP: single file
  const text = await convertToPlainText(file);

  const result = streamText({
    model: google('gemini-2.5-pro'),
    system: extractionSystemPrompt,
    messages: [{ role: 'user', content: text.substring(0, 80_000) }], // truncate for token limits
    text: ({ content }) => <div>{content}</div>,
  });

  return result.toUIMessageStreamResponse();
}
```

### 6.1 `convertToPlainText`
- TXT / MD → read as UTF-8 string.
- PDF → use `pdf-parse` (Node) or `pdfjs-dist`.
- DOCX → use `mammoth`.
- Add file-type guards; if unsupported, return 400.

### 6.2 Prompt (extractionSystemPrompt)
```
You are an information-extraction assistant. Given raw document text, extract:
- title
- authors (array)
- publication_date (ISO-8601)
- summary (<= 200 words)
- key_value_pairs (array of { key, value })
Return ONLY valid JSON.
```
Validate JSON with Zod before streaming back; on schema failure, send `output-error` part.

---

## 7. Streaming Generative UI Mapping
- For each `text` chunk from Gemini, wrap in `<Response>`.
- Optionally define a tool `displayExtraction` so the AI can decide when extraction is complete and output final structured component (card, table). Pattern:
  ```ts
  tools: {
    displayExtraction: {
      description: 'Render extracted JSON',
      inputSchema: z.object({ ... }),
      generate: async ({ ...data }) => <ExtractionCard {...data} />,
    },
  }
  ```

---

## 8. Error Handling & Edge Cases
- **Oversized file** → immediate error toast.
- **Unsupported type** → suggest converting to PDF or TXT.
- **Gemini quota/timeouts** → show retry CTA.
- **Partial stream** → keep incremental results; allow user to “download raw JSON so far”.

---

## 9. Milestones & Estimates
| # | Milestone | Owner | ETA |
|---|-----------|-------|-----|
| 1 | File converters util | BE dev | 0.5 d |
| 2 | `/ai/extract` route (MVP) | BE dev | 0.5 d |
| 3 | Client Upload component | FE dev | 1 d |
| 4 | Streaming integration & UI states | FE dev | 0.5 d |
| 5 | Prompt + Zod validation | BE dev | 0.5 d |
| 6 | QA & polish | QA | 0.5 d |
| **Total** | **~3 dev-days** |

---

## 10. Acceptance Criteria
- [ ] User can upload TXT/MD/PDF/DOCX ≤10 MB.
- [ ] Extraction stream begins within 2 s (network permitting).
- [ ] Final JSON passes Zod schema and is rendered nicely.
- [ ] Errors show helpful messages and never break the chat UI.
- [ ] Feature covered by cypress E2E test (upload → JSON rendered).

---

## 11. Future Enhancements
1. Chunked extraction for large docs (>128 k tokens) using embeddings + RAG.
2. Multi-file uploads with individual progress.
3. Persist extracted data to Supabase or local DB.
4. Allow follow-up questions that reference the uploaded doc.
