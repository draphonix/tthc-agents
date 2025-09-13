import { google } from "@ai-sdk/google";
import { streamText, tool } from "ai";
import { convertToPlainText, truncateText } from "@/lib/convert-to-text";
import { extractionSystemPrompt } from "@/lib/extraction-prompt";
import { z } from "zod";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Parse form data to get the uploaded file
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Convert file to plain text
    const text = await convertToPlainText(file);
    
    // Truncate text to fit within token limits
    const truncatedText = truncateText(text);

    // Stream the extraction process
    const result = streamText({
      model: google("gemini-2.5-pro"),
      system: extractionSystemPrompt,
      messages: [
        {
          role: "user",
          content: truncatedText,
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in document extraction:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}