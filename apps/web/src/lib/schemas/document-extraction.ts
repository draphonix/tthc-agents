import { z } from "zod";

export const DocumentExtractionFieldsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    ),
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
