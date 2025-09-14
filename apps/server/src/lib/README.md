# Library Utilities

This directory contains reusable utility functions and modules for the server application.

## vertex-rag.ts

Vertex AI RAG (Retrieval-Augmented Generation) Corpus integration for querying the Vietnamese birth registration knowledge base using the official Vertex AI library.

### Features

- **Native Vertex AI integration** using the official @google-cloud/vertexai library
- **Type-safe RAG queries** with proper TypeScript interfaces
- **Grounding and citations** from RAG corpus responses
- **Error handling** with fallback responses
- **Environment-based configuration** 
- **Singleton client** for efficient resource usage

### Usage

```typescript
import { queryRAGEngine, ragClient } from './vertex-rag';

// Simple query
const result = await queryRAGEngine("What documents are needed for birth registration?");
console.log(result.answer);
console.log(result.citations);

// Direct client usage
const response = await ragClient.query("How long does birth registration take?");
```

### Environment Variables

Required:
- `GOOGLE_CLOUD_PROJECT` - Your Google Cloud Project ID
- `RAG_CORPUS_NAME` - Name of your RAG Corpus in Vertex AI
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account key file

Optional:
- `VERTEX_REGION` - Region for Vertex AI (default: us-central1)
- `VERTEX_MODEL` - Model to use for generation (default: gemini-1.5-pro)

### Authentication Setup

For automatic authentication without manual login flows:

1. **Create a service account:**
   ```bash
   gcloud iam service-accounts create tthc-rag-service \
     --display-name "TTHC RAG Application Service Account"
   ```

2. **Grant necessary permissions:**
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member "serviceAccount:tthc-rag-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role "roles/aiplatform.user"
   ```

3. **Create and download service account key:**
   ```bash
   gcloud iam service-accounts keys create credentials/tthc-rag-service-key.json \
     --iam-account tthc-rag-service@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

4. **Set environment variable:**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=./credentials/tthc-rag-service-key.json
   ```

### AI SDK Integration

The module exports a `ragToolConfig` that can be used with the AI SDK tool system:

```typescript
import { tool } from 'ai';
import { queryRAGEngine, ragToolConfig } from './vertex-rag';

const knowledgeBaseTool = tool({
  description: ragToolConfig.description,
  inputSchema: z.object(ragToolConfig.inputSchema.properties),
  execute: async ({ question }) => {
    return await queryRAGEngine(question);
  }
});
```