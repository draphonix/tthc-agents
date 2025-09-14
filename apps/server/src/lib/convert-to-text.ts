/**
 * File conversion utilities for the UploadDocumentation feature
 */

import { z } from 'zod';

// Define the schema for extracted document data
export const DocumentExtractionSchema = z.object({
  document_type: z.string().optional(),
  child_name: z.string().optional(),
  child_dob: z.string().optional(),
  child_gender: z.string().optional(),
  birth_place: z.string().optional(),
  father_name: z.string().optional(),
  father_dob: z.string().optional(),
  father_nationality: z.string().optional(),
  father_id: z.string().optional(),
  mother_name: z.string().optional(),
  mother_dob: z.string().optional(),
  mother_nationality: z.string().optional(),
  mother_id: z.string().optional(),
  parents_marital_status: z.string().optional(),
  issue_date: z.string().optional(),
  issuing_authority: z.string().optional(),
  document_number: z.string().optional(),
  key_information: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).optional(),
});

export type DocumentExtraction = z.infer<typeof DocumentExtractionSchema>;

/**
 * Convert a file to plain text based on its type
 */
export async function convertToPlainText(file: File): Promise<string> {
  const fileType = file.type;
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  try {
    // Handle text files directly
    if (fileType === 'text/plain' || fileType === 'text/markdown' || fileType === 'text/md' || fileExtension === 'txt' || fileExtension === 'md') {
      return await file.text();
    }

    // Handle PDF files
    if (fileType === 'application/pdf' || fileExtension === 'pdf') {
      return await convertPdfToText(file);
    }

    // Handle DOCX files
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileExtension === 'docx') {
      return await convertDocxToText(file);
    }

    // Handle image files
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension || '')) {
      return await convertImageToText(file);
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error) {
    console.error('Error converting file to text:', error);
    throw new Error(`Failed to convert file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert PDF to text
 */
async function convertPdfToText(file: File): Promise<string> {
  try {
    // For MVP, we'll simulate PDF extraction by reading the file as text
    // In a production environment, you would use a library like 'pdf-parse' or 'pdfjs-dist'
    
    // Convert the file to a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // For MVP, we'll extract some readable text from the PDF
    // This is a simplified approach that may not work for all PDFs
    const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
    
    // Filter out non-printable characters and PDF-specific syntax
    const cleanText = text
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\\[nrtf]/g, ' ')
      .replace(/\/[A-Za-z]+\s*/g, ' ')
      .trim();
    
    if (cleanText.length < 50) {
      return `[PDF Document: ${file.name}]\n\nThis PDF appears to contain binary data or complex formatting. For full text extraction, please install pdf-parse package.`;
    }
    
    return `[PDF Document: ${file.name}]\n\n${cleanText.substring(0, 5000)}${cleanText.length > 5000 ? '...' : ''}`;
  } catch (error) {
    console.error('Error converting PDF to text:', error);
    throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert DOCX to text
 */
async function convertDocxToText(file: File): Promise<string> {
  try {
    // For MVP, we'll simulate DOCX extraction by reading the file as text
    // In a production environment, you would use a library like 'mammoth'
    
    // Convert the file to a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // For MVP, we'll extract some readable text from the DOCX
    // This is a simplified approach that may not work for all DOCX files
    const text = buffer.toString('utf-8', 0, Math.min(buffer.length, 10000));
    
    // Filter out XML tags and extract readable text
    const cleanText = text
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanText.length < 50) {
      return `[DOCX Document: ${file.name}]\n\nThis DOCX appears to contain complex formatting. For full text extraction, please install mammoth package.`;
    }
    
    return `[DOCX Document: ${file.name}]\n\n${cleanText.substring(0, 5000)}${cleanText.length > 5000 ? '...' : ''}`;
  } catch (error) {
    console.error('Error converting DOCX to text:', error);
    throw new Error(`Failed to convert DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert image to text using gemini-2.5-pro's vision capabilities
 */
async function convertImageToText(file: File): Promise<string> {
  try {
    // Convert image to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    // Get the MIME type
    const mimeType = file.type || 'image/jpeg';
    
    // Create a data URL
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    // For now, we'll return a placeholder that indicates this is an image
    // The actual image processing will happen in the extract route
    return `[IMAGE:${file.name}:${dataUrl}]`;
  } catch (error) {
    console.error('Error converting image to text:', error);
    throw new Error(`Failed to convert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Check if text contains an image marker
 */
export function containsImage(text: string): boolean {
  return text.startsWith('[IMAGE:');
}

/**
 * Extract image data from text
 */
export function extractImageData(text: string): { fileName: string; dataUrl: string } | null {
  const imageMatch = text.match(/^\[IMAGE:([^:]+):(.+)\]$/);
  if (!imageMatch) return null;
  
  return {
    fileName: imageMatch[1],
    dataUrl: imageMatch[2],
  };
}

/**
 * Truncate text to fit within token limits
 */
export function truncateText(text: string, maxTokens: number = 80000): string {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  
  if (text.length <= maxChars) {
    return text;
  }
  
  return text.substring(0, maxChars) + '\n\n[Content truncated due to length limitations]';
}