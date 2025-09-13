// Main exports for ADK integration
import { ADKClient } from './client';
import { LocalStorageSessionManager, ADKSessionHook } from './session';

export { ADKClient } from './client';
export { LocalStorageSessionManager, ADKSessionHook } from './session';
export type {
  ADKSession,
  ADKEvent,
  ChatMessage,
  DocumentUpload,
  ADKStreamResponse,
  ADKInvokeRequest,
  ADKInvokeResponse,
  ADKClientConfig,
} from './types';
export { ADKError } from './types';

// AI SDK integration exports
export { createADKProvider } from './ai-sdk-provider';
export { ADKTransport } from './ai-sdk-transport';
export type { ADKProviderConfig } from './ai-sdk-provider';

// Utility functions
export const createADKClient = (userId: string, config?: { baseUrl?: string }) => {
  return new ADKClient(userId, config);
};

export const createSessionHook = (client: ADKClient) => {
  return new ADKSessionHook(client);
};
