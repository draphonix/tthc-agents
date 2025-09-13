import { google } from "@ai-sdk/google";
import { streamText, type UIMessage, convertToModelMessages, tool } from "ai";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();

	const result = streamText({
		model: google("gemini-2.5-pro"),
		messages: convertToModelMessages(messages),
		system: `You are an AI assistant that can help users with various tasks. When you need information from a document to provide a complete answer, use the requestDocumentUpload tool to ask the user to upload a document. Only request a document when it's absolutely necessary for providing a helpful response.`,
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
		},
	});

	return result.toUIMessageStreamResponse();
}
