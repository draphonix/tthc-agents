# Upload Documentation Fix Plan

## Problem Analysis
The `UploadDocumentation.tsx` component is not correctly handling the streaming response from the server because it's mixing two approaches:
1. Using the `useChat` hook with `DefaultChatTransport`
2. Making a direct `fetch` request that bypasses the hook's streaming handling

## Solution Design
We'll use `TextStreamChatTransport` instead of `DefaultChatTransport` since the server is returning a text stream (`result.toTextStreamResponse()`).

## Implementation Steps

### 1. Update Imports
Add the import for `TextStreamChatTransport`:

```typescript
import { TextStreamChatTransport } from "ai";
```

### 2. Replace DefaultChatTransport with TextStreamChatTransport
Replace the transport configuration in the `useChat` hook:

```typescript
const { messages, setMessages, sendMessage } = useChat({
  transport: new TextStreamChatTransport({
    api: `${process.env.NEXT_PUBLIC_SERVER_URL}/ai/extract`,
  }),
  onFinish: (message) => {
    setIsUploading(false);
    if (onUploadComplete) {
      onUploadComplete(message);
    }
  },
  onError: (error) => {
    setIsUploading(false);
    setError(error.message || "Failed to process document");
  },
});
```

### 3. Update handleUpload Function
Replace the direct fetch request with a proper use of the `sendMessage` function:

```typescript
const handleUpload = async () => {
  if (files.length === 0) {
    setError("Please select a file to upload");
    return;
  }

  setIsUploading(true);
  setError(null);
  
  // Clear previous messages
  setMessages([]);
  
  // Create a custom message with file data
  const file = files[0];
  
  try {
    // Send the file using sendMessage
    await sendMessage({
      role: "user",
      parts: [
        {
          type: "file",
          data: file,
          mimeType: file.type,
          filename: file.name,
        },
        {
          type: "text",
          text: "Please extract information from this document relevant to Vietnamese birth registration.",
        },
      ],
    });
  } catch (error) {
    setIsUploading(false);
    setError(error instanceof Error ? error.message : "Failed to upload file");
  }
};
```

### 4. Update the Server Route (Optional)
If the above doesn't work, we might need to modify the server to handle the message format correctly. The server would need to extract the file from the message parts instead of using form data.

## Expected Outcome
After these changes:
1. The file upload will be properly handled through the `useChat` hook
2. The streaming response from the server will be correctly processed and displayed
3. The extracted data will be displayed from the assistant as expected

## Testing
After implementation, test with:
1. PDF files
2. DOCX files
3. Image files (JPG, PNG)
4. Text files

Ensure that the extracted information is displayed correctly in the UI.