/**
 * File utility functions for the UploadDocumentation feature
 */

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
  'text/markdown',
  'text/md',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export type AllowedFileType = typeof ALLOWED_FILE_TYPES[number];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Check if a file type is allowed
 */
export function isFileTypeAllowed(fileType: string): fileType is AllowedFileType {
  return ALLOWED_FILE_TYPES.includes(fileType as AllowedFileType);
}

/**
 * Check if a file size is within the allowed limit
 */
export function isFileSizeAllowed(fileSize: number): boolean {
  return fileSize <= MAX_FILE_SIZE;
}

/**
 * Get file extension from a file name
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Format file size to human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Convert a file to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Remove the data URL prefix to get just the base64 content
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validate a file for upload
 */
export function validateFile(file: File): { isValid: boolean; error?: string } {
  if (!isFileTypeAllowed(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Please upload PDF, DOCX, TXT, MD, or image files (JPEG, PNG, WebP).`,
    };
  }
  
  if (!isFileSizeAllowed(file.size)) {
    return {
      isValid: false,
      error: `File size exceeds the maximum limit of ${formatFileSize(MAX_FILE_SIZE)}.`,
    };
  }
  
  return { isValid: true };
}