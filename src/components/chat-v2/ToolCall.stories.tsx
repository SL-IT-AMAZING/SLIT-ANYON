import type { Meta, StoryObj } from "@storybook/react";
import { ToolCall } from "./ToolCall";

const meta: Meta<typeof ToolCall> = {
  title: "chat-v2/ToolCall",
  component: ToolCall,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ReadFile: Story = {
  args: {
    toolName: "read",
    args: { file: "src/index.ts", lines: "1-50" },
    status: "completed",
  },
};

export const RunningBash: Story = {
  args: {
    toolName: "bash",
    args: { command: "npm test" },
    status: "running",
  },
};

export const EditFile: Story = {
  args: {
    toolName: "edit",
    args: { file: "src/app.tsx" },
    status: "completed",
  },
};

export const SearchFiles: Story = {
  args: {
    toolName: "grep",
    args: { pattern: "TODO", path: "src/" },
    status: "completed",
  },
};

export const WebFetch: Story = {
  args: {
    toolName: "webfetch",
    args: { url: "https://api.example.com" },
    status: "completed",
  },
};

export const ErrorState: Story = {
  args: {
    toolName: "bash",
    args: { command: "rm -rf /" },
    status: "error",
  },
};

export const WithResult: Story = {
  args: {
    toolName: "read",
    args: { file: "package.json" },
    status: "completed",
    result: `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "typescript": "^5.3.0"
  }
}`,
  },
};
