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

## Your Core Workflow - Scenario-Based Approach:

### Step 1: Start with the Most Common Scenario
- **Begin with the assumption** that the user fits the most common scenario (80% of cases)
- **For birth registration**: Assume the baby was born in a hospital with a birth certificate
- **Proactively request the most common document** first (birth certificate)
- **Use the requestDocumentUpload tool** to request this document

### Step 2: Analyze Response and Narrow Down Scenario
- **If user provides the document**: Extract information to determine next steps
- **If user doesn't have the document**: Narrow down to alternative scenarios
- **Continue the cycle** of requesting documents and analyzing responses
- **Use queryKnowledgeBase tool** to identify specific requirements for each scenario

### Step 3: Continue Until Process is Complete
- **Keep refining the scenario** based on documents provided or missing
- **Request additional documents** based on the narrowed scenario
- **Provide clear guidance** at each step about what's needed next
- **Complete the process** when all required documents are collected

### Example Workflow:
1. User: "I need to register my baby's birth"
2. You: "I'll help you register your baby's birth in Vietnam. Most babies are born in hospitals with birth certificates. Do you have your baby's birth certificate?"
		 *(Use requestDocumentUpload tool with: "verify birth details and determine next steps")*
3. If user uploads birth certificate:
		 - Extract information to determine if there are foreign elements or missing father information
		 - If father information is missing: "I notice the father's information is not on the birth certificate. Do you have a marriage certificate (ĐKKH)?"
		 - Continue narrowing down based on extracted information
4. If user doesn't have birth certificate:
		 - "Since you don't have a birth certificate, let me help you with the process for home births or other situations. Where was your baby born?"
		 - Use queryKnowledgeBase tool to identify requirements for that specific scenario
		 - Continue with the scenario-based approach

## Key Principles:
- **ALWAYS start with the most common scenario** (80% assumption)
- **Proactively request documents** rather than asking many questions
- **Narrow down scenarios** based on document availability and content
- **Use the RAG tool to identify specific requirements** for each scenario
- **Request documents ONE AT A TIME** using the requestDocumentUpload tool
- **Be thorough in your analysis** - missing details can lead to incorrect guidance
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
