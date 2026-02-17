import type { Meta, StoryObj } from "@storybook/react";

import { AssistantMessage } from "./AssistantMessage";

const meta: Meta<typeof AssistantMessage> = {
  title: "chat-v2/AssistantMessage",
  component: AssistantMessage,
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

export const SimpleResponse: Story = {
  args: {
    content:
      "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
  },
};

export const StreamingResponse: Story = {
  args: {
    content: "TypeScript is a strongly typed programming language that",
    isStreaming: true,
  },
};

export const LongResponse: Story = {
  args: {
    content: `TypeScript interfaces and type aliases are similar but have key differences:

Interfaces support declaration merging — you can define the same interface multiple times and they'll be merged. Type aliases don't support this.

Interfaces use "extends" for inheritance while type aliases use intersection (&) types. Both achieve similar results but extends is slightly more performant for the compiler.

For object shapes, the general recommendation is to use interfaces. They produce better error messages and are more performant. Use type aliases when you need union types, mapped types, or conditional types.

Here's a quick example:

interface User {
  name: string;
  age: number;
}

type Status = "active" | "inactive";

type UserWithStatus = User & { status: Status };`,
  },
};

export const WithCodeBlock: Story = {
  args: {
    content: `To set up a React project with Vite, run:

npm create vite@latest my-app -- --template react-ts

Then install dependencies:

cd my-app
npm install

And start the dev server:

npm run dev

This will scaffold a new React + TypeScript project with hot module replacement enabled.`,
  },
};

export const WithActionBar: Story = {
  name: "With Action Bar (hover to see)",
  args: {
    content:
      "Hover over this message to see the action bar with copy and regenerate buttons.",
    timestamp: "2:35 PM",
  },
};
