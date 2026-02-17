import type { Meta, StoryObj } from "@storybook/react";

import { UserMessage } from "./UserMessage";

const meta: Meta<typeof UserMessage> = {
  title: "chat-v2/UserMessage",
  component: UserMessage,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "44rem" }} className="mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ShortMessage: Story = {
  args: {
    content: "What is TypeScript?",
  },
};

export const LongMessage: Story = {
  args: {
    content:
      "Can you explain the difference between TypeScript interfaces and type aliases? I've been using them interchangeably but I heard there are some subtle differences in how they handle declaration merging and extends vs intersection types. Also, which one is generally recommended for defining object shapes?",
  },
};

export const WithTimestamp: Story = {
  args: {
    content: "Hello, how can I help you today?",
    timestamp: "2:34 PM",
  },
};

export const MultiLine: Story = {
  args: {
    content: `I have a few questions:

1. How do I set up a React project with Vite?
2. What's the best way to manage state?
3. How should I structure my components?

Thanks in advance!`,
  },
};

export const CodeSnippet: Story = {
  args: {
    content: `Can you fix this code?

const result = items.filter(item => item.active).map(item => item.name)

It's returning undefined for some items.`,
  },
};
