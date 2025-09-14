/**
 * Prompt template and utilities for document extraction
 */

import { z } from 'zod';
import { DocumentExtractionSchema } from './convert-to-text';

// System prompt for document extraction
export const extractionSystemPrompt = `You are a specialized birth registration document extraction assistant with advanced vision capabilities. You can process both text documents and images to extract information relevant to Vietnamese birth registration.

When processing images:
- Carefully examine all text content in the image
- Pay attention to document structure, headers, and form fields
- Extract handwritten text when present and legible
- Note any stamps, seals, or official markings
- Consider the document layout and formatting to understand context

When processing text documents:
- Parse structured data from forms and tables
- Identify key sections and headings
- Extract relevant dates, names, and identification numbers

Extract the following information relevant to Vietnamese birth registration:

1. document_type: The type of document (e.g., "Birth Certificate", "Marriage Certificate", "ID Card", "Passport", "Household Registration", etc.)
2. child_name: The child's full name if available
3. child_dob: The child's date of birth in ISO-8601 format if available
4. child_gender: The child's gender if available
5. birth_place: The place where the child was born if available
6. father_name: The father's full name if available
7. father_dob: The father's date of birth in ISO-8601 format if available
8. father_nationality: The father's nationality if available
9. father_id: The father's ID number or passport number if available
10. mother_name: The mother's full name if available
11. mother_dob: The mother's date of birth in ISO-8601 format if available
12. mother_nationality: The mother's nationality if available
13. mother_id: The mother's ID number or passport number if available
14. parents_marital_status: The parents' marital status if available (e.g., "Married", "Unmarried", "Divorced")
15. issue_date: The date the document was issued in ISO-8601 format if available
16. issuing_authority: The authority that issued the document if available
17. document_number: The document's unique identifier if available
18. key_information: An array of important key-value pairs extracted from the document that are relevant to birth registration

Return ONLY valid JSON that matches this schema:
{
  "document_type": "string",
  "child_name": "string",
  "child_dob": "string (ISO-8601)",
  "child_gender": "string",
  "birth_place": "string",
  "father_name": "string",
  "father_dob": "string (ISO-8601)",
  "father_nationality": "string",
  "father_id": "string",
  "mother_name": "string",
  "mother_dob": "string (ISO-8601)",
  "mother_nationality": "string",
  "mother_id": "string",
  "parents_marital_status": "string",
  "issue_date": "string (ISO-8601)",
  "issuing_authority": "string",
  "document_number": "string",
  "key_information": [
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
    
    if (data.document_type) {
      resultParts.push({
        type: 'text',
        content: `## Document Type\n\n${data.document_type}`
      });
    }
    
    // Child information
    const childInfo = [];
    if (data.child_name) childInfo.push(`**Name**: ${data.child_name}`);
    if (data.child_dob) childInfo.push(`**Date of Birth**: ${data.child_dob}`);
    if (data.child_gender) childInfo.push(`**Gender**: ${data.child_gender}`);
    if (data.birth_place) childInfo.push(`**Place of Birth**: ${data.birth_place}`);
    
    if (childInfo.length > 0) {
      resultParts.push({
        type: 'text',
        content: `## Child Information\n\n${childInfo.join('\n')}`
      });
    }
    
    // Father information
    const fatherInfo = [];
    if (data.father_name) fatherInfo.push(`**Name**: ${data.father_name}`);
    if (data.father_dob) fatherInfo.push(`**Date of Birth**: ${data.father_dob}`);
    if (data.father_nationality) fatherInfo.push(`**Nationality**: ${data.father_nationality}`);
    if (data.father_id) fatherInfo.push(`**ID Number**: ${data.father_id}`);
    
    if (fatherInfo.length > 0) {
      resultParts.push({
        type: 'text',
        content: `## Father Information\n\n${fatherInfo.join('\n')}`
      });
    }
    
    // Mother information
    const motherInfo = [];
    if (data.mother_name) motherInfo.push(`**Name**: ${data.mother_name}`);
    if (data.mother_dob) motherInfo.push(`**Date of Birth**: ${data.mother_dob}`);
    if (data.mother_nationality) motherInfo.push(`**Nationality**: ${data.mother_nationality}`);
    if (data.mother_id) motherInfo.push(`**ID Number**: ${data.mother_id}`);
    
    if (motherInfo.length > 0) {
      resultParts.push({
        type: 'text',
        content: `## Mother Information\n\n${motherInfo.join('\n')}`
      });
    }
    
    // Additional information
    const additionalInfo = [];
    if (data.parents_marital_status) additionalInfo.push(`**Parents' Marital Status**: ${data.parents_marital_status}`);
    if (data.issue_date) additionalInfo.push(`**Issue Date**: ${data.issue_date}`);
    if (data.issuing_authority) additionalInfo.push(`**Issuing Authority**: ${data.issuing_authority}`);
    if (data.document_number) additionalInfo.push(`**Document Number**: ${data.document_number}`);
    
    if (additionalInfo.length > 0) {
      resultParts.push({
        type: 'text',
        content: `## Additional Information\n\n${additionalInfo.join('\n')}`
      });
    }
    
    if (data.key_information && data.key_information.length > 0) {
      resultParts.push({
        type: 'text',
        content: `## Key Information\n\n${data.key_information.map(pair => `**${pair.key}**: ${pair.value}`).join('\n\n')}`
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