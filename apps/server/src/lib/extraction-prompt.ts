/**
 * Prompt template and utilities for document extraction
 */

import { z } from 'zod';
import { DocumentExtractionSchema } from './convert-to-text';

// System prompt for document extraction
export const extractionSystemPrompt = `You are an information-extraction assistant. Given raw document text, extract the following information:

1. title: The title of the document
2. authors: An array of author names (if available)
3. publication_date: The publication date in ISO-8601 format (if available)
4. summary: A concise summary of the document content (maximum 200 words)
5. key_value_pairs: An array of important key-value pairs extracted from the document

Return ONLY valid JSON that matches this schema:
{
  "title": "string",
  "authors": ["string"],
  "publication_date": "string (ISO-8601)",
  "summary": "string (max 200 words)",
  "key_value_pairs": [
    {
      "key": "string",
      "value": "string"
    }
  ]
}

If any field is not available in the document, omit it from the JSON object rather than using null or empty values.

Important: Do not include any explanations, apologies, or additional text outside of the JSON structure.`;

// Tool definition for displaying extraction results
export const displayExtractionTool = {
  description: 'Render extracted document information in a structured format',
  parameters: DocumentExtractionSchema,
  generate: async function* (data: z.infer<typeof DocumentExtractionSchema>) {
    // Initial placeholder
    yield {
      type: 'text',
      content: 'Processing document extraction...'
    };
    
    // Return the structured extraction component
    const resultParts = [];
    
    if (data.title) {
      resultParts.push({
        type: 'text',
        content: `## Title\n\n${data.title}`
      });
    }
    
    if (data.authors && data.authors.length > 0) {
      resultParts.push({
        type: 'text',
        content: `## Authors\n\n${data.authors.map(author => `- ${author}`).join('\n')}`
      });
    }
    
    if (data.publication_date) {
      resultParts.push({
        type: 'text',
        content: `## Publication Date\n\n${data.publication_date}`
      });
    }
    
    if (data.summary) {
      resultParts.push({
        type: 'text',
        content: `## Summary\n\n${data.summary}`
      });
    }
    
    if (data.key_value_pairs && data.key_value_pairs.length > 0) {
      resultParts.push({
        type: 'text',
        content: `## Key Information\n\n${data.key_value_pairs.map(pair => `**${pair.key}**: ${pair.value}`).join('\n\n')}`
      });
    }
    
    return {
      type: 'text',
      content: resultParts.map(part => part.content).join('\n\n')
    };
  },
};

// Tool definition for requesting document upload
export const requestDocumentUploadTool = {
  description: 'Ask the user to provide a document needed to continue the conversation',
  parameters: z.object({
    reason: z.string().describe('Why the document is required'),
  }),
  generate: async function* ({ reason }: { reason: string }) {
    // Initial placeholder
    yield {
      type: 'text',
      content: `I need to see your document to ${reason}. Please upload it below.`
    };
    
    // In a real implementation, this would return the UploadDocumentation component
    // For now, we'll return a placeholder
    return {
      type: 'text',
      content: 'Document upload component would be rendered here.'
    };
  },
};