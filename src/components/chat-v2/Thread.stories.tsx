import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";

import { AssistantMessage } from "./AssistantMessage";
import { Composer } from "./Composer";
import { LogoSpinner } from "./LogoSpinner";
import { MarkdownContent } from "./MarkdownContent";
import {
  Thread,
  ThreadFooter,
  ThreadMessages,
  ThreadViewport,
  ThreadWelcome,
} from "./Thread";
import { ToolCall } from "./ToolCall";
import { UserMessage } from "./UserMessage";

const meta: Meta<typeof Thread> = {
  title: "chat-v2/Thread",
  component: Thread,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", background: "var(--background)" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyThread: Story = {
  render: () => (
    <Thread>
      <ThreadViewport>
        <ThreadWelcome subtitle="Ask me anything about code, debugging, or building features." />
      </ThreadViewport>
      <ThreadFooter>
        <Composer placeholder="Send a message..." />
      </ThreadFooter>
    </Thread>
  ),
};

export const SimpleConversation: Story = {
  render: () => (
    <Thread>
      <ThreadViewport>
        <ThreadMessages>
          <UserMessage content="What is TypeScript?" />
          <AssistantMessage content="TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale. It adds optional static types, classes, and modules to JavaScript, making it easier to write and maintain large codebases." />
          <UserMessage content="Can you show me a quick example?" />
          <AssistantMessage
            content={`Here's a simple TypeScript example:\n\ninterface User {\n  name: string;\n  age: number;\n}\n\nfunction greet(user: User): string {\n  return \`Hello, \${user.name}!\`;\n}\n\nconst user: User = { name: "Alice", age: 30 };\nconsole.log(greet(user));`}
          />
        </ThreadMessages>
      </ThreadViewport>
      <ThreadFooter>
        <Composer placeholder="Send a message..." />
      </ThreadFooter>
    </Thread>
  ),
};

export const WithMarkdown: Story = {
  render: () => (
    <Thread>
      <ThreadViewport>
        <ThreadMessages>
          <UserMessage content="Show me how to set up React Router" />
          <div className="group animate-in fade-in slide-in-from-bottom-1 relative w-full py-3 duration-150">
            <div className="break-words px-2">
              <MarkdownContent
                content={`## Setting up React Router

First, install the package:

\`\`\`bash
npm install react-router-dom
\`\`\`

Then create your routes:

\`\`\`tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
\`\`\`

Key concepts:
- **BrowserRouter** wraps your app for client-side routing
- **Routes** groups route definitions
- **Route** maps a path to a component
- Use \`useNavigate()\` hook for programmatic navigation`}
              />
            </div>
          </div>
        </ThreadMessages>
      </ThreadViewport>
      <ThreadFooter>
        <Composer placeholder="Send a message..." />
      </ThreadFooter>
    </Thread>
  ),
};

export const StreamingState: Story = {
  render: () => (
    <Thread>
      <ThreadViewport>
        <ThreadMessages>
          <UserMessage content="Explain async/await in JavaScript" />
          <AssistantMessage
            content="Async/await is syntactic sugar built on top of Promises that makes asynchronous code look and behave more like synchronous code. The `async` keyword is placed before a function declaration to"
            isStreaming
          />
        </ThreadMessages>
      </ThreadViewport>
      <ThreadFooter>
        <Composer isStreaming placeholder="Send a message..." />
      </ThreadFooter>
    </Thread>
  ),
};

export const WithToolCalls: Story = {
  render: () => (
    <Thread>
      <ThreadViewport>
        <ThreadMessages>
          <UserMessage content="Read my package.json and tell me what dependencies I have" />
          <div className="group animate-in fade-in slide-in-from-bottom-1 relative w-full py-3 duration-150">
            <div className="flex flex-col gap-3 px-2">
              <ToolCall
                toolName="read"
                args={{ file: "package.json" }}
                status="completed"
              />
              <ToolCall
                toolName="grep"
                args={{ pattern: "dependencies", path: "package.json" }}
                status="completed"
              />
              <div className="break-words text-sm leading-relaxed text-foreground">
                <MarkdownContent
                  content={`Based on your \`package.json\`, here are your main dependencies:

- **react** v18.3.1 — UI framework
- **react-router-dom** v6.28.0 — Client-side routing
- **tailwindcss** v4.0.0 — Utility-first CSS
- **typescript** v5.7.0 — Type safety

You have **12 dependencies** and **24 dev dependencies** total.`}
                />
              </div>
            </div>
          </div>
        </ThreadMessages>
      </ThreadViewport>
      <ThreadFooter>
        <Composer placeholder="Send a message..." />
      </ThreadFooter>
    </Thread>
  ),
};

export const LoadingState: Story = {
  render: () => (
    <Thread>
      <ThreadViewport>
        <ThreadMessages>
          <UserMessage content="Fix the bug in my auth middleware" />
          <div className="flex items-center gap-3 px-2 py-6">
            <LogoSpinner variant="strokeLoop" size={28} />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        </ThreadMessages>
      </ThreadViewport>
      <ThreadFooter>
        <Composer isStreaming placeholder="Send a message..." />
      </ThreadFooter>
    </Thread>
  ),
};

export const Interactive: Story = {
  render: function InteractiveThread() {
    const [messages, setMessages] = useState<
      Array<{ role: "user" | "assistant"; content: string }>
    >([]);
    const [input, setInput] = useState("");

    const handleSend = () => {
      if (!input.trim()) return;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: input },
        {
          role: "assistant",
          content: `You said: "${input}". This is a mock response for the Storybook demo.`,
        },
      ]);
      setInput("");
    };

    return (
      <Thread>
        <ThreadViewport>
          {messages.length === 0 ? (
            <ThreadWelcome subtitle="Type a message below to see the interactive demo." />
          ) : (
            <ThreadMessages>
              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <UserMessage key={i} content={msg.content} />
                ) : (
                  <AssistantMessage key={i} content={msg.content} />
                ),
              )}
            </ThreadMessages>
          )}
        </ThreadViewport>
        <ThreadFooter>
          <Composer
            value={input}
            onChange={setInput}
            onSend={handleSend}
            placeholder="Type something..."
          />
        </ThreadFooter>
      </Thread>
    );
  },
};
