import { google } from "@ai-sdk/google";
import { streamText, type UIMessage, convertToModelMessages, tool } from "ai";
import { z } from "zod";
import { queryRAGEngineStructured, queryRAGEngine } from "../../lib/vertex-rag";

// Define the schema for assessment answers
const assessmentAnswersSchema = z.object({
  married: z.string().optional(),
  foreign: z.string().optional(),
  timing: z.string().optional(),
  paternity: z.string().optional(),
  father_present: z.string().optional(),
});

export const maxDuration = 30;



export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();
	
	// Check if the last message is an assessment completion
	const lastMessage = messages[messages.length - 1];
	if (lastMessage?.metadata && 
		typeof lastMessage.metadata === 'object' && 
		'type' in lastMessage.metadata && 
		lastMessage.metadata.type === 'assessmentAnswers' &&
		'answers' in lastMessage.metadata) {
		return handleAssessmentMessage(lastMessage.metadata.answers);
	}

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

// Handle assessment messages with specialized assessment processing
async function handleAssessmentMessage(assessmentAnswers: any) {
	try {
		// Validate the assessment answers
		const validatedAnswers = assessmentAnswersSchema.parse(assessmentAnswers);
		
		// Create a summary of the assessment answers for the LLM
		const assessmentSummary = createAssessmentSummary(validatedAnswers);
		
		// Use streamText to generate a response with RAG
		const result = streamText({
			model: google("gemini-2.5-pro"),
			messages: [
				{
					role: "user",
					content: `Dựa trên câu hỏi đánh giá tình huống đăng ký khai sinh, hãy phân tích và cung cấp thông tin chi tiết về các giấy tờ cần thiết và quy trình đăng ký khai sinh cho trường hợp này.

Thông tin đánh giá:
${assessmentSummary}

Vui lòng phân tích tình huống và cung cấp:
1. Phân tích chi tiết về trường hợp đăng ký khai sinh
2. Danh sách đầy đủ các giấy tờ cần thiết
3. Quy trình thực hiện từng bước
4. Thời gian xử lý dự kiến
5. Cơ quan có thẩm quyền giải quyết
6. Các lưu ý quan trọng

Tất cả thông tin phải bằng tiếng Việt và dựa trên cơ sở dữ liệu pháp luật Việt Nam về đăng ký khai sinh.`
				}
			],
			system: `Bạn là trợ lý chuyên về đăng ký khai sinh tại Việt Nam. Nhiệm vụ của bạn là phân tích tình huống của người dùng và cung cấp thông tin chính xác, đầy đủ về các giấy tờ cần thiết và quy trình đăng ký khai sinh.

Bạn phải luôn sử dụng công cụ queryKnowledgeBase để lấy thông tin từ cơ sở dữ liệu pháp luật Việt Nam về đăng ký khai sinh trước khi cung cấp bất kỳ thông tin chi tiết nào.

Hãy trả lời bằng tiếng Việt và đảm bảo thông tin:
- Chính xác theo quy định pháp luật Việt Nam
- Đầy đủ và chi tiết
- Dễ hiểu đối với người dân
- Bao gồm các giấy tờ cần thiết, quy trình, thời gian, và cơ quan có thẩm quyền

Luôn trích dẫn nguồn thông tin khi có thể.`,
			tools: {
				queryKnowledgeBase: tool({
					description: 'CÔNG CỤ BẮT BUỘC: Truy vấn cơ sở dữ liệu kiến thức về đăng ký khai sinh Việt Nam để lấy thông tin pháp lý chính xác, cập nhật về yêu cầu giấy tờ, quy trình, thời gian, chi phí và hướng dẫn cụ thể. Cơ sở dữ liệu này chứa thông tin chính thức từ chính phủ và phải được sử dụng cho MỌI câu hỏi về quy trình, yêu cầu hoặc thủ tục đăng ký khai sinh tại Việt Nam.',
					inputSchema: z.object({
						question: z.string().describe('Câu hỏi cụ thể, chi tiết để hỏi cơ sở dữ liệu về đăng ký khai sinh Việt Nam. Hãy cụ thể về tình huống, yêu cầu hoặc quy trình bạn cần thông tin. Ví dụ: "Những giấy tờ cần thiết cho cha mẹ chưa kết hôn đăng ký khai sinh?", "Thời hạn đăng ký khai sinh tại Việt Nam là bao lâu?", "Các khoản phí đăng ký khai sinh là gì?"'),
					}),
					execute: async ({ question }: { question: string }) => {
						console.log('🤖 [AGENT] Agent đang gọi công cụ RAG với câu hỏi:', {
							question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
							timestamp: new Date().toISOString()
						});
						
						const result = await queryRAGEngine(question);
						
						console.log('💬 [AGENT] Hoàn thành thực thi công cụ RAG:', {
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
	} catch (error) {
		console.error('Error processing assessment:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Đã xảy ra lỗi khi xử lý đánh giá. Vui lòng thử lại.' 
			}),
			{ 
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

// Helper function to create a summary of assessment answers
function createAssessmentSummary(answers: z.infer<typeof assessmentAnswersSchema>): string {
	const summaryParts: string[] = [];
	
	if (answers.married === 'yes') {
		summaryParts.push('Cha mẹ đã đăng ký kết hôn');
	} else if (answers.married === 'no') {
		summaryParts.push('Cha mẹ chưa đăng ký kết hôn');
	}
	
	if (answers.foreign === 'yes') {
		summaryParts.push('Có ít nhất một cha/mẹ là người nước ngoài');
	} else if (answers.foreign === 'no') {
		summaryParts.push('Cả cha mẹ đều là người Việt Nam');
	}
	
	if (answers.timing === 'yes') {
		summaryParts.push('Đăng ký trong vòng 60 ngày sau sinh');
	} else if (answers.timing === 'no') {
		summaryParts.push('Đăng ký quá 60 ngày sau sinh');
	}
	
	if (answers.paternity === 'yes') {
		summaryParts.push('Cần xác nhận quan hệ cha con');
	} else if (answers.paternity === 'no') {
		summaryParts.push('Không cần xác nhận quan hệ cha con');
	}
	
	if (answers.father_present === 'yes') {
		summaryParts.push('Cha có mặt và sẵn sàng ghi tên trên giấy khai sinh');
	} else if (answers.father_present === 'no') {
		summaryParts.push('Cha không có mặt hoặc không sẵn sàng ghi tên trên giấy khai sinh');
	}
	
	return summaryParts.join(', ');
}
