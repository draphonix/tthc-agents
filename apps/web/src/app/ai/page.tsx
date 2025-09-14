"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Response } from "@/components/response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadDocumentation } from "@/components/UploadDocumentation";

export default function AIPage() {
	const [input, setInput] = useState("");
	const { messages, sendMessage } = useChat({
		transport: new DefaultChatTransport({
			api: `${process.env.NEXT_PUBLIC_SERVER_URL}/ai`,
		}),
	});

	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const text = input.trim();
		if (!text) return;
		sendMessage({ text });
		setInput("");
	};

	const handleUploadComplete = (data: any) => {
		// After upload is complete, we can add a message to the chat
		// The extracted data will be available in the conversation context
		console.log("Upload complete:", data);
		
		// Send a message to continue the workflow based on the extracted data
		// This will trigger the AI to analyze the extracted information and continue the scenario-based approach
		sendMessage({
			text: "I've uploaded the document. Please analyze the information and let me know what's needed next."
		});
	};

	return (
		<div className="grid grid-rows-[auto_1fr_auto] overflow-hidden w-full mx-auto p-4">
			{/* Content Area */}
			<div className="overflow-y-auto space-y-4 pb-4">
				{messages.length === 0 ? (
					<div className="text-center text-muted-foreground mt-8">
						Welcome! I'll help you register your baby's birth in Vietnam. Most babies are born in hospitals with birth certificates. Do you have your baby's birth certificate?
					</div>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className={`p-3 rounded-lg ${
								message.role === "user"
									? "bg-primary/10 ml-8"
									: "bg-secondary/20 mr-8"
							}`}
						>
							<p className="text-sm font-semibold mb-1">
								{message.role === "user" ? "You" : "AI Assistant"}
							</p>
							{message.parts?.map((part, index) => {
								if (part.type === "text") {
									return <Response key={index}>{part.text}</Response>;
								}

								if (part.type === "tool-requestDocumentUpload") {
									switch (part.state) {
										case "input-available":
											return <div key={index}>Loading document upload...</div>;
										case "output-available":
											const output = part.output as { reason: string };
											return (
												<div key={index}>
													<UploadDocumentation
														reason={output.reason}
														isInChat={true}
														onUploadComplete={handleUploadComplete}
													/>
												</div>
											);
										case "output-error":
											return <div key={index}>Error: {part.errorText}</div>;
										default:
											return null;
									}
								}

								return null;
							})}
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Input Area */}
			<form
				onSubmit={handleSubmit}
				className="w-full flex items-center space-x-2 pt-2 border-t"
			>
				<Input
					name="prompt"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					className="flex-1"
					autoComplete="off"
					autoFocus
				/>
				<Button type="submit" size="icon">
					<Send size={18} />
				</Button>
			</form>
		</div>
	);
}
