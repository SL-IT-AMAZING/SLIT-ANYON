import type { Meta, StoryObj } from "@storybook/react";
import { GrepTool } from "./GrepTool";
import { CodeSearchTool } from "./CodeSearchTool";
import { CodeSearchResultTool } from "./CodeSearchResultTool";

const meta: Meta = {
  title: "chat-v2/tools/SearchTools",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const GrepRunning: StoryObj = {
  render: () => <GrepTool query="useState" include="*.tsx" status="running" />,
};

export const GrepCompletedWithMatches: StoryObj = {
  render: () => (
    <GrepTool
      query="TODO"
      include="*.ts"
      exclude="node_modules"
      caseSensitive={true}
      count="7"
      status="completed"
    >
      {`src/app.ts:12: // TODO: refactor this
src/utils.ts:45: // TODO: add error handling
src/lib/api.ts:8: // TODO: implement retry logic
src/hooks/useAuth.ts:23: // TODO: token refresh
src/components/Nav.tsx:67: // TODO: mobile menu
src/routes/home.ts:3: // TODO: lazy load
src/config.ts:19: // TODO: env validation`}
    </GrepTool>
  ),
};

export const CodeSearchRunning: StoryObj = {
  render: () => (
    <CodeSearchTool query="authentication middleware" status="running" />
  ),
};

export const CodeSearchResultWithFiles: StoryObj = {
  render: () => (
    <CodeSearchResultTool status="completed">
      {`src/middleware/auth.ts
src/lib/jwt.ts
src/hooks/useAuth.ts
src/routes/login.tsx
src/routes/register.tsx
src/components/ProtectedRoute.tsx
src/utils/token.ts`}
    </CodeSearchResultTool>
  ),
};
