# How-to Guide: Generative UI with Vercel AI SDK v5

## Introduction

Generative User Interfaces (Generative UI) is a powerful feature in the Vercel AI SDK that enables large language models (LLMs) to generate and stream React components dynamically, creating more engaging and AI-native user experiences. This guide will walk you through implementing Generative UI in your applications using the Vercel AI SDK v5.

## What is Generative UI?

Generative UI refers to the process where an LLM generates user interface elements beyond just text responses. With the Vercel AI SDK, you can:

- Stream React components directly from server actions
- Create dynamic UIs that adapt based on AI responses
- Handle tool calls and render appropriate UI components based on the results
- Provide loading states and smooth transitions during AI processing

## Core Concepts

### AI State vs. UI State

The Vercel AI SDK addresses the challenge of managing non-serializable React components by splitting application state into two parts:

1. **AI State**: A serializable, JSON-based representation of the UI state that can be passed to and from the language model.
2. **UI State**: The actual React elements and JavaScript values rendered on the client, similar to React's `useState`.

### Tools in Generative UI

Tools are functions provided to the LLM that enable it to perform specialized tasks, such as fetching external data. The LLM intelligently decides when and how to use these tools based on the conversation context.

## Getting Started

### Installation

First, install the necessary packages:

```bash
npm install ai @ai-sdk/openai @ai-sdk/react @ai-sdk/rsc
# or
bun add ai @ai-sdk/openai @ai-sdk/react @ai-sdk/rsc
```

### Basic Setup

There are two main approaches to implementing Generative UI with the Vercel AI SDK:

1. **AI SDK UI**: Client-side approach with server-side API routes
2. **AI SDK RSC**: Server Components approach with streaming from server actions

## Approach 1: AI SDK UI (Client-Side)

### 1. Create an API Route

Create an API route to handle AI requests:

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { weatherTool } from '@/lib/tools';

export async function POST(request: Request) {
  const { messages } = await request.json();

  const result = streamText({
    model: openai('gpt-4o'),
    system: 'you are a friendly assistant!',
    messages,
    tools: {
      displayWeather: weatherTool,
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### 2. Define Tools

Create tools that the AI can use:

```typescript
// lib/tools.ts
import { tool as createTool } from 'ai';
import { z } from 'zod';

export const weatherTool = createTool({
  description: 'Display the weather for a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  execute: async function ({ location }) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { weather: 'Sunny', temperature: 75, location };
  },
});
```

### 3. Create React Components

Create components to display the tool results:

```typescript
// components/Weather.tsx
type WeatherProps = {
  weather: string;
  temperature: number;
  location: string;
};

export const Weather = ({ weather, temperature, location }: WeatherProps) => {
  return (
    <div className="border border-neutral-200 p-4 rounded-lg max-w-fit">
      <h2>Weather in {location}</h2>
      <p>Condition: {weather}</p>
      <p>Temperature: {temperature}°F</p>
    </div>
  );
};
```

### 4. Implement the Client Component

Create a client component to handle the chat interface:

```typescript
// app/page.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Weather } from '@/components/Weather';

export default function Page() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage({ text: input });
    setInput('');
  };

  return (
    <div>
      {messages.map(message => (
        <div key={message.id}>
          <div>{message.role === 'user' ? 'User: ' : 'AI: '}</div>
          <div>
            {message.parts.map((part, index) => {
              if (part.type === 'text') {
                return <span key={index}>{part.text}</span>;
              }

              if (part.type === 'tool-displayWeather') {
                switch (part.state) {
                  case 'input-available':
                    return <div key={index}>Loading weather...</div>;
                  case 'output-available':
                    return (
                      <div key={index}>
                        <Weather {...part.output} />
                      </div>
                    );
                  case 'output-error':
                    return <div key={index}>Error: {part.errorText}</div>;
                  default:
                    return null;
                }
              }

              return null;
            })}
          </div>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## Approach 2: AI SDK RSC (Server Components)

### 1. Create a Server Action

Create a server action to stream UI components:

```typescript
// app/actions.ts
'use server';

import { streamUI } from '@ai-sdk/rsc';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { getWeather } from '@/lib/weather-api';

const LoadingComponent = () => (
  <div className="animate-pulse p-4">Getting weather...</div>
);

interface WeatherProps {
  location: string;
  weather: string;
  temperature: number;
}

const WeatherComponent = (props: WeatherProps) => (
  <div className="border border-neutral-200 p-4 rounded-lg max-w-fit">
    The weather in {props.location} is {props.weather} with a temperature of {props.temperature}°F
  </div>
);

export async function streamComponent(userInput: string) {
  const result = await streamUI({
    model: openai('gpt-4o'),
    prompt: userInput,
    text: ({ content }) => <div>{content}</div>,
    tools: {
      getWeather: {
        description: 'Get the weather for a location',
        inputSchema: z.object({
          location: z.string(),
        }),
        generate: async function* ({ location }) {
          yield <LoadingComponent />;
          const weatherData = await getWeather(location);
          return <WeatherComponent {...weatherData} location={location} />;
        },
      },
    },
  });

  return result.value;
}
```

### 2. Create the Client Component

Create a client component to interact with the server action:

```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { useActions, useUIState } from '@ai-sdk/rsc';
import { streamComponent } from './actions';

export default function Page() {
  const [input, setInput] = useState<string>('');
  const [conversation, setConversation] = useUIState();
  const { submitUserMessage } = useActions();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInput('');
    
    // Add user message to conversation
    setConversation(currentConversation => [
      ...currentConversation,
      <div key={Date.now()}>User: {input}</div>,
    ]);
    
    // Get AI response
    const message = await submitUserMessage(input);
    
    // Add AI response to conversation
    setConversation(currentConversation => [...currentConversation, message]);
  };

  return (
    <div>
      <div>
        {conversation.map((message, i) => (
          <div key={i}>{message}</div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about the weather..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

### 3. Set up the AI Context

Create an AI context to manage the actions:

```typescript
// app/ai.tsx
import { createAI } from 'ai/rsc';
import { streamComponent } from './actions';

export const AI = createAI({
  actions: {
    submitUserMessage: streamComponent,
  },
  initialUIState: [],
  initialAIState: {},
});
```

### 4. Wrap Your App with the AI Provider

Update your layout to include the AI provider:

```typescript
// app/layout.tsx
import { AI } from './ai';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AI>{children}</AI>
      </body>
    </html>
  );
}
```

## Advanced Techniques

### Handling Loading States

You can provide immediate feedback to users during AI operations:

```typescript
const { value: stream } = await streamUI({
  model: openai('gpt-4o'),
  system: 'you are a friendly assistant!',
  messages,
  initial: <div>Loading...</div>, // Initial loading state
  text: async function* ({ content, done }) {
    // Process text
  },
  tools: {
    // Tool definitions
  },
});
```

### Nested Streamable UIs

Create complex interfaces with nested streamable components:

```typescript
async function getStockHistoryChart({ symbol }: { symbol: string }) {
  'use server';

  const ui = createStreamableUI(<Spinner />);

  (async () => {
    const price = await getStockPrice({ symbol });
    
    // Create a nested streamable UI for the history chart
    const historyChart = createStreamableUI(<Spinner />);
    ui.done(<StockCard historyChart={historyChart.value} price={price} />);
    
    // Update the history chart when data is available
    const historyData = await fetch('https://my-stock-data-api.com');
    historyChart.done(<HistoryChart data={historyData} />);
  })();

  return ui;
}
```

### Image Generation

Generate images using compatible models:

```typescript
import { google } from '@ai-sdk/google';
import { experimental_generateImage as generateImage } from 'ai';

const { image } = await generateImage({
  model: google.image('imagen-3.0-generate-002'),
  prompt: 'A futuristic cityscape at sunset',
  aspectRatio: '16:9',
});
```

## Best Practices

1. **Keep Tools Focused**: Each tool should have a single, well-defined purpose.
2. **Provide Clear Descriptions**: Help the AI understand when and how to use each tool.
3. **Handle Errors Gracefully**: Always provide fallback UI for error states.
4. **Use Loading States**: Improve user experience with loading indicators during async operations.
5. **Validate Input**: Use schemas (like Zod) to validate tool inputs.
6. **Optimize for Streaming**: Design components to work well with streaming updates.

## Troubleshooting

### Common Issues

1. **Components Not Rendering**: Ensure you're properly handling different tool states (`input-available`, `output-available`, `output-error`).
2. **Streaming Not Working**: Check that you're using the correct return types (`toUIMessageStreamResponse()` for API routes, `result.value` for server actions).
3. **Type Errors**: Make sure you're using TypeScript with proper type definitions for all components and tools.

### Debugging Tips

1. Use console logs to track tool calls and responses.
2. Test tools individually before integrating them into the AI flow.
3. Start with simple UI components and gradually add complexity.
4. Use browser dev tools to inspect the streaming response.

## Conclusion

Generative UI with the Vercel AI SDK opens up new possibilities for creating dynamic, AI-powered user interfaces. By leveraging tools and streaming React components, you can build applications that respond intelligently to user input and provide rich, interactive experiences.

Whether you choose the client-side AI SDK UI approach or the server-side AI SDK RSC approach, the key is to design your tools and components to work seamlessly together, creating a cohesive user experience that feels natural and responsive.

## Additional Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [AI SDK UI Examples](https://sdk.vercel.ai/examples/ui)
- [AI SDK RSC Examples](https://sdk.vercel.ai/examples/rsc)
- [React Server Components Documentation](https://react.dev/reference/rsc)