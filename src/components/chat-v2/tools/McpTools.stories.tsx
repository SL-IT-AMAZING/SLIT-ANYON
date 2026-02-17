import type { Meta, StoryObj } from "@storybook/react";
import { McpToolCallTool } from "./McpToolCallTool";
import { McpToolResultTool } from "./McpToolResultTool";
import { OpenCodeToolTool } from "./OpenCodeToolTool";

const meta: Meta = {
  title: "chat-v2/tools/McpTools",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const McpToolCall: StoryObj = {
  render: () => (
    <McpToolCallTool
      serverName="filesystem"
      toolName="readFile"
      status="completed"
    >
      {JSON.stringify({ path: "/src/index.ts", encoding: "utf-8" })}
    </McpToolCallTool>
  ),
};

export const McpToolResult: StoryObj = {
  render: () => (
    <McpToolResultTool
      serverName="database"
      toolName="query"
      status="completed"
    >
      {JSON.stringify({
        rows: [
          { id: 1, name: "Alice", role: "admin" },
          { id: 2, name: "Bob", role: "user" },
        ],
        rowCount: 2,
      })}
    </McpToolResultTool>
  ),
};

export const OpenCodeReadRunning: StoryObj = {
  render: () => (
    <OpenCodeToolTool
      name="read"
      status="running"
      title="src/components/App.tsx"
    >
      {JSON.stringify({
        path: "src/components/App.tsx",
        offset: 1,
        limit: 100,
      })}
    </OpenCodeToolTool>
  ),
};

export const OpenCodeEditCompleted: StoryObj = {
  render: () => (
    <OpenCodeToolTool name="edit" status="completed" title="src/utils.ts">
      {JSON.stringify({
        file: "src/utils.ts",
        old_string: "const x = 1;",
        new_string: "const x = 2;",
      })}
    </OpenCodeToolTool>
  ),
};

export const OpenCodeBashError: StoryObj = {
  render: () => (
    <OpenCodeToolTool name="bash" status="error" title="npm test">
      {JSON.stringify({
        command: "npm test",
        exitCode: 1,
        stderr: "FAIL src/utils.test.ts\nTest suite failed to run",
      })}
    </OpenCodeToolTool>
  ),
};

export const AllMcpStates: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-2">
      <McpToolCallTool
        serverName="mcp-server"
        toolName="search"
        status="running"
      >
        {JSON.stringify({ query: "hello world" })}
      </McpToolCallTool>
      <McpToolResultTool toolName="search" status="completed">
        {JSON.stringify({ results: ["result1", "result2"] })}
      </McpToolResultTool>
      <OpenCodeToolTool name="read" status="running" title="package.json">
        {JSON.stringify({ path: "package.json" })}
      </OpenCodeToolTool>
      <OpenCodeToolTool name="edit" status="completed" title="src/app.tsx">
        {JSON.stringify({ file: "src/app.tsx" })}
      </OpenCodeToolTool>
      <OpenCodeToolTool name="bash" status="error" title="npm run build">
        {JSON.stringify({ command: "npm run build", exitCode: 1 })}
      </OpenCodeToolTool>
    </div>
  ),
};
