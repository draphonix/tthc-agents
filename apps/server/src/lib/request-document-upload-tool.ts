import { z } from 'zod';

/**
 * Tool definition for requesting document upload from the user
 * This allows the AI to determine when a document is needed and request it
 */
export const requestDocumentUpload = {
  description: 'Ask the user to provide a document needed to continue the conversation',
  parameters: {
    type: 'object',
    properties: {
      reason: {
        type: 'string',
        description: 'Why the document is required'
      }
    },
    required: ['reason']
  }
};