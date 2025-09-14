import { VertexAI, RetrievalTool } from '@google-cloud/vertexai';

/**
 * Configuration for Vertex AI RAG Engine
 */
interface RAGConfig {
  project: string;
  location: string;
  ragCorpus: string;
  model?: string;
}

/**
 * Response from RAG query
 */
export interface RAGResponse {
  answer: string;
  source: string;
  citations?: Array<{
    uri?: string;
    source?: string;
    title?: string;
  }>;
  error?: string;
}

/**
 * RAG Engine client wrapper
 */
class VertexRAGClient {
  private vertex: VertexAI;
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;
    
    // Configure authentication
    const authOptions: any = {
      project: config.project,
      location: config.location,
    };

    // Use service account key if provided
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      authOptions.googleAuthOptions = {
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      };
    }

    this.vertex = new VertexAI(authOptions);
  }

  /**
   * Query the RAG corpus with a question using Vertex AI library
   */
  async query(question: string): Promise<RAGResponse> {
    const startTime = Date.now();
    console.log('🔍 [RAG] Starting query:', { 
      question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    
    try {
      if (!question.trim()) {
        throw new Error('Question cannot be empty');
      }

      const generativeModel = this.vertex.getGenerativeModel({
        model: this.config.model || 'gemini-1.5-pro',
      });

      // Configure retrieval tool for RAG
      const ragCorpusPath = `projects/${this.config.project}/locations/${this.config.location}/ragCorpora/${this.config.ragCorpus}`;
      console.log('⚙️ [RAG] Configuring retrieval tool:', {
        ragCorpus: ragCorpusPath,
        similarityTopK: 10,
        project: this.config.project,
        location: this.config.location
      });
      
      const retrievalTool: RetrievalTool = {
        retrieval: {
          vertexRagStore: {
            ragResources: [{
              ragCorpus: ragCorpusPath
            }],
            similarityTopK: 10, // You can make this configurable
          },
          disableAttribution: false // Enable attribution for citations
        }
      };

      console.log('🚀 [RAG] Making API call to Vertex AI...');
      
      const result = await generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: question }]
        }],
        tools: [retrievalTool]
      });
      
      console.log('✅ [RAG] Received response from Vertex AI');
      console.log('📊 [RAG] Response metadata:', {
        candidatesCount: result.response.candidates?.length || 0,
        hasGroundingMetadata: !!result.response.candidates?.[0]?.groundingMetadata,
        groundingChunksCount: result.response.candidates?.[0]?.groundingMetadata?.groundingChunks?.length || 0
      });

      const answer = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!answer) {
        throw new Error('No response generated from RAG corpus');
      }

      // Extract grounding metadata for citations
      const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
      const citations = groundingMetadata?.groundingChunks?.map(chunk => ({
        uri: chunk.retrievedContext?.uri || chunk.web?.uri,
        source: chunk.retrievedContext?.title || chunk.web?.title || 'Knowledge Base',
        title: chunk.retrievedContext?.title || chunk.web?.title || 'Unknown Source'
      })) || [];

      const duration = Date.now() - startTime;
      console.log('🎉 [RAG] Query completed successfully:', {
        answerLength: answer.length,
        citationsCount: citations.length,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      return {
        answer,
        source: 'Vietnamese Birth Registration Knowledge Base',
        citations
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [RAG] Query failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return {
        answer: 'Sorry, I encountered an error accessing the knowledge base. Please ensure your RAG corpus is properly configured and accessible.',
        source: 'Error',
        error: errorMessage
      };
    }
  }
}

/**
 * Initialize RAG client from environment variables
 */
function createRAGClient(): VertexRAGClient {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.VERTEX_REGION || 'us-central1';
  const ragCorpus = process.env.RAG_CORPUS_NAME;
  const model = process.env.VERTEX_MODEL;

  if (!project) {
    throw new Error('GOOGLE_CLOUD_PROJECT environment variable is required');
  }

  if (!ragCorpus) {
    throw new Error('RAG_CORPUS_NAME environment variable is required');
  }

  return new VertexRAGClient({
    project,
    location,
    ragCorpus,
    model
  });
}

// Export singleton instance
export const ragClient = createRAGClient();

/**
 * Query the RAG engine - convenience function
 */
export async function queryRAGEngine(question: string): Promise<RAGResponse> {
  console.log('Querying RAG engine with question:', question);
  return ragClient.query(question);
}

/**
 * Tool definition for the AI SDK
 */
export const ragToolConfig = {
  description: 'Query the Vietnamese birth registration knowledge base for detailed legal information, requirements, procedures, and specific guidance. Use this when you need authoritative information about Vietnamese birth registration processes that goes beyond your general knowledge.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      question: {
        type: 'string' as const,
        description: 'The specific question to ask the knowledge base about Vietnamese birth registration'
      }
    },
    required: ['question']
  }
};