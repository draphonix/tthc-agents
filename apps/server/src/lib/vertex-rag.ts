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

export interface RAGStructuredResponse extends RAGResponse {
  documents?: Array<{ name: string; nameVn: string; required: boolean } | string>;
  note?: string;
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
  * Query the RAG corpus and ask the model to return structured JSON (answer, documents, note)
  */
  async queryStructured(question: string): Promise<RAGStructuredResponse> {
    const startTime = Date.now();
    console.log('🔍 [RAG] Starting structured query:', { 
      question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString()
    });
    try {
      if (!question.trim()) throw new Error('Question cannot be empty');

      const generativeModel = this.vertex.getGenerativeModel({
        model: this.config.model || 'gemini-2.5-pro',
      });

      const ragCorpusPath = `projects/${this.config.project}/locations/${this.config.location}/ragCorpora/${this.config.ragCorpus}`;
      const retrievalTool: RetrievalTool = {
        retrieval: {
          vertexRagStore: {
            ragResources: [{ ragCorpus: ragCorpusPath }],
            similarityTopK: 10,
          },
          disableAttribution: false,
        },
      };

      const instruction = `Bạn là trợ lý pháp lý về đăng ký khai sinh Việt Nam. Dựa trên kiến thức được truy xuất, hãy trả lời ở định dạng JSON NGHIÊM NGẶT với các khóa sau:
{
  "answer": string,
  "documents": Array<{ "name": string, "nameVn": string, "required": boolean } | string>,
  "note": string | undefined
}
- Nếu không xác định được tên tiếng Anh, lặp lại tiếng Việt ở cả name và nameVn.
- Chỉ trả về JSON, KHÔNG kèm theo văn bản giải thích khác.`;

      const result = await generativeModel.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${instruction}

Câu hỏi:
${question}` }] },
        ],
        tools: [retrievalTool],
        generationConfig: {
          responseMimeType: 'application/json',
          // Cast to any to support JSON Schema union for items
          responseSchema: {
            type: 'object',
            properties: {
              answer: { type: 'string' },
              documents: {
                type: 'array',
                items: {
                  oneOf: [
                    { type: 'string' },
                    {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        nameVn: { type: 'string' },
                        required: { type: 'boolean' },
                      },
                      required: ['name', 'nameVn', 'required'],
                      additionalProperties: true,
                    },
                  ],
                },
              },
              note: { type: 'string' },
            },
            required: ['answer'],
            additionalProperties: false,
          } as any,
        } as any,
      });

      const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!rawText) throw new Error('No response generated from RAG corpus');

      // Helper: try to extract a JSON object from arbitrary LLM text (handles fenced code blocks)
      const extractJSON = (text: string): any | undefined => {
        // 1) Direct JSON
        try {
          return JSON.parse(text);
        } catch {}
        // 2) Fenced code block ```json ... ``` or ``` ... ```
        const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenceMatch && fenceMatch[1]) {
          const inside = fenceMatch[1].trim();
          try {
            return JSON.parse(inside);
          } catch {}
        }
        // 3) First '{' to last '}' substring fallback
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const candidate = text.slice(first, last + 1);
          try {
            return JSON.parse(candidate);
          } catch {}
        }
        return undefined;
      };

      const parsed = extractJSON(rawText) ?? { answer: rawText };

      const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;
      const citations = groundingMetadata?.groundingChunks?.map((chunk) => ({
        uri: chunk.retrievedContext?.uri || chunk.web?.uri,
        source: chunk.retrievedContext?.title || chunk.web?.title || 'Knowledge Base',
        title: chunk.retrievedContext?.title || chunk.web?.title || 'Unknown Source',
      })) || [];

      const answer = typeof parsed?.answer === 'string' ? parsed.answer : (rawText || '');
      // Sanitize documents: allow either strings or { name, nameVn, required }
      let documents: Array<{ name: string; nameVn: string; required: boolean } | string> = [];
      if (Array.isArray(parsed?.documents)) {
        documents = parsed.documents.slice(0, 20).map((d: any) => {
          if (typeof d === 'string') return d;
          if (d && typeof d === 'object') {
            const name = typeof d.name === 'string' ? d.name : (typeof d.nameVn === 'string' ? d.nameVn : 'Tài liệu');
            const nameVn = typeof d.nameVn === 'string' ? d.nameVn : name;
            const required = typeof d.required === 'boolean' ? d.required : true;
            return { name, nameVn, required };
          }
          return d;
        });
      }
      const note = typeof parsed?.note === 'string' ? parsed.note : undefined;

      const duration = Date.now() - startTime;
      console.log('🎉 [RAG] Structured query completed:', {
        answerLength: answer.length,
        documentsCount: documents.length,
        citationsCount: citations.length,
        duration: `${duration}ms`,
      });

      return {
        answer,
        source: 'Vietnamese Birth Registration Knowledge Base',
        citations,
        documents,
        note,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [RAG] Structured query failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
      });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        answer: 'Xin lỗi, đã gặp lỗi khi truy vấn cơ sở dữ liệu. Vui lòng thử lại.',
        source: 'Error',
        error: errorMessage,
        documents: [],
      };
    }
  }

  /**
    * Query the RAG corpus with a question using Vertex AI library
    */
  async query(question: string): Promise<RAGStructuredResponse> {
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
        model: this.config.model || 'gemini-2.5-pro',
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
      
      const instruction = `Bạn là trợ lý pháp lý về đăng ký khai sinh Việt Nam. Hãy truy xuất tri thức liên quan và tổng hợp dữ liệu dựa trên câu hỏi được đưa ra. Nên nhớ hãy thêm những văn bản cần thiết nằm trong tri thức được trích xuất vào trường documents. Ví dụ: ""Để đăng ký khai sinh cho trẻ có cha mẹ đã đăng ký kết hôn và là công dân Việt Nam, người có yêu cầu cần nộp Tờ khai đăng ký khai sinh và Giấy chứng sinh. Đồng thời, cần xuất trình giấy tờ tùy thân để chứng minh nhân thân và giấy tờ chứng minh nơi cư trú nếu thông tin này chưa được khai thác từ cơ sở dữ liệu quốc gia. Cơ quan đăng ký sẽ tự tra cứu thông tin về tình trạng hôn nhân của cha mẹ trên cơ sở dữ liệu nên không cần nộp Giấy chứng nhận kết hôn." thì phần documents sẽ bao gồm: ["Tờ khai đăng ký khai sinh", "Bản chính Giấy chứng sinh", "Bản chính Giấy chứng nhận kết hôn", "Căn cước công dân", "Giấy tờ chứng minh nơi cư trú"]`;

      const result = await generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `${instruction}\n\nCâu hỏi:\n${question}` }]
        }],
        tools: [retrievalTool],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              answer: { type: 'string' },
              documents: {
                type: 'array',
                items: {
                  oneOf: [
                    { type: 'string' },
                    {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        nameVn: { type: 'string' },
                        required: { type: 'boolean' },
                      },
                      required: ['name', 'nameVn', 'required'],
                      additionalProperties: true,
                    },
                  ],
                },
              },
              note: { type: 'string' },
            },
            required: ['answer'],
            additionalProperties: false,
          } as any,
        } as any,
      });
      
      console.log('✅ [RAG] Received response from Vertex AI');
      console.log('📊 [RAG] Response metadata:', {
        candidatesCount: result.response.candidates?.length || 0,
        hasGroundingMetadata: !!result.response.candidates?.[0]?.groundingMetadata,
        groundingChunksCount: result.response.candidates?.[0]?.groundingMetadata?.groundingChunks?.length || 0
      });

      const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log('RAW TEXT:', rawText);
      if (!rawText) {
        throw new Error('No response generated from RAG corpus');
      }
      // Parse structured JSON output safely
      const extractJSON = (text: string): any | undefined => {
        try { return JSON.parse(text); } catch {}
        const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenceMatch && fenceMatch[1]) {
          const inside = fenceMatch[1].trim();
          try { return JSON.parse(inside); } catch {}
        }
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const candidate = text.slice(first, last + 1);
          try { return JSON.parse(candidate); } catch {}
        }
        return undefined;
      };
      const parsed = extractJSON(rawText) ?? { answer: rawText };

      // Build answer and documents from structured output
      const answer = typeof parsed?.answer === 'string' ? parsed.answer : rawText;
      let documents: Array<{ name: string; nameVn: string; required: boolean } | string> = [];
      if (Array.isArray(parsed?.documents)) {
        documents = parsed.documents.slice(0, 20).map((d: any) => {
          if (typeof d === 'string') return d;
          if (d && typeof d === 'object') {
            const name = typeof d.name === 'string' ? d.name : (typeof d.nameVn === 'string' ? d.nameVn : 'Tài liệu');
            const nameVn = typeof d.nameVn === 'string' ? d.nameVn : name;
            const required = typeof d.required === 'boolean' ? d.required : true;
            return { name, nameVn, required };
          }
          return d;
        });
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
        documentsCount: documents.length,
        citationsCount: citations.length,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
      
      return {
        answer,
        source: 'Vietnamese Birth Registration Knowledge Base',
        citations,
        // Include documents for richer downstream usage; callers typed as RAGResponse can ignore
        documents,
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

export async function queryRAGEngineStructured(question: string): Promise<RAGStructuredResponse> {
  console.log('Querying RAG engine (structured) with question:', question);
  return ragClient.queryStructured(question);
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