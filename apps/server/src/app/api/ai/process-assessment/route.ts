import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { z } from "zod";
import { queryRAGEngine } from "../../../../lib/vertex-rag";

export const maxDuration = 60;

// Define the schema for assessment answers
const assessmentAnswersSchema = z.object({
  married: z.string().optional(),
  foreign: z.string().optional(),
  timing: z.string().optional(),
  paternity: z.string().optional(),
  father_present: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { assessmentAnswers } = await req.json();
    
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