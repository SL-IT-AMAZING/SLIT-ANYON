import type { Meta, StoryObj } from "@storybook/react";
import { ThinkTool } from "./ThinkTool";
import { StatusTool } from "./StatusTool";
import { OutputTool } from "./OutputTool";
import { ProblemSummaryTool } from "./ProblemSummaryTool";
import { LogsTool } from "./LogsTool";
import { CodebaseContextTool } from "./CodebaseContextTool";

const meta: Meta = {
  title: "chat-v2/tools/SystemTools",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const ThinkRunning: StoryObj = {
  render: () => (
    <ThinkTool status="running">
      I need to analyze the user&apos;s request carefully. They want to refactor
      the authentication module to use JWT tokens instead of session-based auth.
      Let me consider the implications for the existing middleware chain and how
      this affects the route guards...
    </ThinkTool>
  ),
};

export const ThinkTokenSavings: StoryObj = {
  render: () => (
    <ThinkTool status="completed">
      anyon-token-savings?original-tokens=15230&smart-context-tokens=4891
    </ThinkTool>
  ),
};

export const StatusInProgress: StoryObj = {
  render: () => (
    <StatusTool title="Installing dependencies..." status="running">
      {`added 142 packages in 8.3s
23 packages are looking for funding
  run \`npm fund\` for details`}
    </StatusTool>
  ),
};

export const StatusCompleted: StoryObj = {
  render: () => (
    <StatusTool title="Build completed" status="completed">
      {`✓ 847 modules transformed
✓ built in 3.21s`}
    </StatusTool>
  ),
};

export const OutputError: StoryObj = {
  render: () => (
    <OutputTool
      type="error"
      message="TypeError: Cannot read properties of undefined (reading 'map'). This error occurred in the UserList component when attempting to render the list of users fetched from the API endpoint /api/v2/users."
    />
  ),
};

export const OutputWarning: StoryObj = {
  render: () => (
    <OutputTool
      type="warning"
      message="Deprecated API usage: fetch() with synchronous callback is deprecated and will be removed in v3.0"
    />
  ),
};

export const ProblemSummaryWithProblems: StoryObj = {
  render: () => (
    <ProblemSummaryTool summary="3 problems found">
      {`<problem file="src/components/App.tsx" line="42" column="8" code="2322" message="Type 'string' is not assignable to type 'number'" />
<problem file="src/hooks/useAuth.ts" line="15" column="3" code="7006" message="Parameter 'token' implicitly has an 'any' type" />
<problem file="src/utils/format.ts" line="88" column="12" code="2551" message="Property 'toFixed' does not exist on type 'string'" />`}
    </ProblemSummaryTool>
  ),
};

export const LogsReading: StoryObj = {
  render: () => (
    <LogsTool
      node={{
        properties: { count: "50", type: "application", level: "error" },
      }}
      status="running"
    >
      {`[2025-01-15 10:32:01] ERROR Failed to connect to database
[2025-01-15 10:32:02] ERROR Retry attempt 1/3
[2025-01-15 10:32:05] ERROR Retry attempt 2/3
[2025-01-15 10:32:08] ERROR Connection established after retry`}
    </LogsTool>
  ),
};

export const CodebaseContextWithFiles: StoryObj = {
  render: () => (
    <CodebaseContextTool
      node={{
        properties: {
          files:
            "src/components/App.tsx,src/hooks/useAuth.ts,src/lib/api.ts,src/utils/format.ts,src/routes/home.tsx,src/config.ts",
        },
      }}
      status="running"
    />
  ),
};

export const CodebaseContextCompleted: StoryObj = {
  render: () => (
    <CodebaseContextTool
      node={{
        properties: {
          files: "src/index.ts,src/server.ts,src/middleware/auth.ts",
        },
      }}
      status="completed"
    />
  ),
};
