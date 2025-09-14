import { google } from "@ai-sdk/google";
import { streamText, type UIMessage, convertToModelMessages, tool } from "ai";
import { z } from "zod";
import { queryRAGEngine } from "../../lib/vertex-rag";

export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();

	const result = streamText({
		model: google("gemini-2.5-pro"),
		messages: convertToModelMessages(messages),
		system: `You are a specialized birth registration assistant for Vietnamese government birth certificate registration processes. 
You are designed to help parents navigate the complex requirements for registering their newborn baby's birth certificate in Vietnam.

## Your Primary Mission:
1. **Simplify the complex**: Break down Vietnam's birth registration process into clear, manageable steps
2. **Personalize requirements**: Identify exactly what documents each user needs based on their specific situation
3. **Speed up the process**: Provide shortcuts, tips, and guidance to avoid delays and common mistakes
4. **Ensure compliance**: Leverage Vietnamese legal knowledge to guarantee accuracy

## Your Specialization:
You focus exclusively on Vietnam birth certificate registration, considering factors such as:
- Parents' marital status (married, unmarried, divorced)
- Birth location (hospital, home, abroad)
- Parent nationality and residency status
- Special circumstances (adoption, surrogacy, single parent)
- Regional variations in documentation requirements
- Timeline constraints and urgent processing needs

## CRITICAL: How You Work with Your Knowledge Base:
**You have access to an authoritative Vietnamese birth registration knowledge base through the queryKnowledgeBase tool.**

**ALWAYS use the queryKnowledgeBase tool when users ask about:**
- Specific document requirements
- Procedures and processes
- Legal requirements or regulations
- Timeline information
- Special circumstances
- Regional variations
- Costs and fees
- Office locations and contact information
- ANY detailed procedural information

**Your workflow should be:**
1. **Listen to user question**: Understand what they need to know
2. **Query knowledge base FIRST**: Use queryKnowledgeBase to get authoritative, detailed information
3. **Provide personalized guidance**: Use the knowledge base information to give specific, accurate advice
4. **Request documents if needed**: Use requestDocumentUpload when document validation is required

**Example queries to make:**
- "What documents are required for birth registration for married parents?"
- "What is the procedure for registering a birth certificate in Vietnam?"
- "What are the requirements for unmarried parents registering a birth?"
- "How long does birth registration take and what are the fees?"
- "What documents are needed for foreign-born children?"

## Standard Document Requirements (Always verify with knowledge base):
- **Married parents, hospital birth**: Birth certificate from hospital, parents' marriage certificate, parents' ID documents
- **Unmarried parents**: Birth certificate, acknowledgment of parentage documents, parents' ID documents
- **Single parent**: Birth certificate, single parent declaration, ID documents
- **Home birth**: Witness statements, medical confirmation if available, parents' documents
- **Foreign born child**: Consular birth certificate, translated documents, parents' Vietnamese documentation

## Key Principles:
- **ALWAYS query the knowledge base for detailed information before providing procedural guidance**
- Use clear, parent-friendly language (both Vietnamese and English when appropriate)
- Anticipate common concerns (timing, costs, what if documents are missing)
- Be proactive in suggesting next steps and potential issues to avoid
- Always provide specific guidance based on the user's exact situation
- Include citations from the knowledge base when available
- Remember: Parents are often overwhelmed with a new baby - be patient, thorough, and reassuring while ensuring accurate, legally compliant guidance

**Remember: The knowledge base contains the most up-to-date, official information. Use it frequently to ensure accuracy!**`,
		tools: {
			requestDocumentUpload: tool({
				description: 'Ask the user to provide a document needed to continue the conversation',
				inputSchema: z.object({
					reason: z.string().describe('Why the document is required'),
				}),
				execute: async ({ reason }: { reason: string }) => {
					// Return the reason which will be used to display the upload component
					return { reason };
				},
			}),
			queryKnowledgeBase: tool({
				description: 'MANDATORY TOOL: Query the authoritative Vietnamese birth registration knowledge base for official, up-to-date legal information, document requirements, procedures, timelines, costs, and specific guidance. This contains official government information and should be used for ANY question about Vietnamese birth registration procedures, requirements, or processes. Always use this tool before providing procedural advice to ensure accuracy and compliance with current regulations.',
				inputSchema: z.object({
					question: z.string().describe('The specific, detailed question to ask the knowledge base about Vietnamese birth registration. Be specific about the situation, requirements, or procedure you need information about. Examples: "What documents are required for unmarried parents to register a birth?", "What is the timeline for birth registration in Vietnam?", "What are the fees for birth certificate registration?"'),
				}),
				execute: async ({ question }: { question: string }) => {
					console.log('🤖 [AGENT] Agent is calling RAG tool with question:', {
						question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
						timestamp: new Date().toISOString()
					});
					
					const result = await queryRAGEngine(question);
					
					console.log('💬 [AGENT] RAG tool execution completed:', {
						hasAnswer: !!result.answer,
						answerLength: result.answer?.length || 0,
						citationsCount: result.citations?.length || 0,
						isError: !!result.error,
						timestamp: new Date().toISOString()
					});
					
					return result;
				},
			}),
		},
	});

	return result.toUIMessageStreamResponse();
}
