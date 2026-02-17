import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { PermissionPrompt } from "./PermissionPrompt";
import {
  type ChildToolSummary,
  TaskDelegationTool,
} from "./TaskDelegationTool";

const meta: Meta<typeof TaskDelegationTool> = {
  title: "chat-v2/TaskDelegationTool",
  component: TaskDelegationTool,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ */
/*  Test data                                                         */
/* ------------------------------------------------------------------ */

const exploreTools: ChildToolSummary[] = [
  {
    id: "1",
    toolName: "grep",
    title: "Grep",
    subtitle: "useAuth",
    status: "completed",
  },
  {
    id: "2",
    toolName: "grep",
    title: "Grep",
    subtitle: "loginHandler",
    status: "completed",
  },
  {
    id: "3",
    toolName: "read",
    title: "Read",
    subtitle: "src/auth/middleware.ts",
    status: "running",
  },
];

const oracleTools: ChildToolSummary[] = [
  {
    id: "1",
    toolName: "read",
    title: "Read",
    subtitle: "src/components/App.tsx",
    status: "completed",
  },
  {
    id: "2",
    toolName: "read",
    title: "Read",
    subtitle: "src/hooks/useAuth.ts",
    status: "completed",
  },
  {
    id: "3",
    toolName: "grep",
    title: "Grep",
    subtitle: "SessionProvider",
    status: "completed",
  },
  {
    id: "4",
    toolName: "read",
    title: "Read",
    subtitle: "src/lib/session.ts",
    status: "completed",
  },
  {
    id: "5",
    toolName: "write",
    title: "Write",
    subtitle: "src/lib/auth.ts",
    status: "completed",
  },
];

const sisyphusTools: ChildToolSummary[] = [
  {
    id: "1",
    toolName: "read",
    title: "Read",
    subtitle: "src/components/Layout.tsx",
    status: "completed",
  },
  {
    id: "2",
    toolName: "edit",
    title: "Edit",
    subtitle: "src/components/Layout.tsx",
    status: "completed",
  },
  {
    id: "3",
    toolName: "bash",
    title: "Bash",
    subtitle: "npm run lint",
    status: "completed",
  },
  {
    id: "4",
    toolName: "write",
    title: "Write",
    subtitle: "src/components/Sidebar.tsx",
    status: "running",
  },
];

const manyTools: ChildToolSummary[] = [
  {
    id: "1",
    toolName: "read",
    title: "Read",
    subtitle: "package.json",
    status: "completed",
  },
  {
    id: "2",
    toolName: "read",
    title: "Read",
    subtitle: "tsconfig.json",
    status: "completed",
  },
  {
    id: "3",
    toolName: "grep",
    title: "Grep",
    subtitle: "import.*react",
    status: "completed",
  },
  {
    id: "4",
    toolName: "read",
    title: "Read",
    subtitle: "src/index.ts",
    status: "completed",
  },
  {
    id: "5",
    toolName: "read",
    title: "Read",
    subtitle: "src/App.tsx",
    status: "completed",
  },
  {
    id: "6",
    toolName: "glob",
    title: "Glob",
    subtitle: "src/**/*.test.ts",
    status: "completed",
  },
  {
    id: "7",
    toolName: "read",
    title: "Read",
    subtitle: "src/utils/helpers.ts",
    status: "completed",
  },
  {
    id: "8",
    toolName: "read",
    title: "Read",
    subtitle: "src/hooks/useData.ts",
    status: "completed",
  },
  {
    id: "9",
    toolName: "grep",
    title: "Grep",
    subtitle: "export default",
    status: "completed",
  },
  {
    id: "10",
    toolName: "read",
    title: "Read",
    subtitle: "src/lib/api.ts",
    status: "completed",
  },
  {
    id: "11",
    toolName: "read",
    title: "Read",
    subtitle: "src/lib/config.ts",
    status: "completed",
  },
  {
    id: "12",
    toolName: "bash",
    title: "Bash",
    subtitle: "npm run test",
    status: "running",
  },
  {
    id: "13",
    toolName: "write",
    title: "Write",
    subtitle: "src/lib/newModule.ts",
    status: "running",
  },
];

/* ------------------------------------------------------------------ */
/*  Stories                                                            */
/* ------------------------------------------------------------------ */

export const Running: Story = {
  args: {
    agentType: "explore",
    description: "Searching codebase for auth patterns",
    childTools: exploreTools,
    running: true,
  },
};

export const Completed: Story = {
  args: {
    agentType: "oracle",
    description: "Analyzing authentication architecture",
    childTools: oracleTools,
    running: false,
  },
};

export const WithPermission: Story = {
  args: {
    agentType: "Sisyphus-Junior",
    description: "Implementing sidebar component refactor",
    childTools: sisyphusTools,
    running: true,
    permissionContent: (
      <PermissionPrompt
        onAllowOnce={fn()}
        onAllowAlways={fn()}
        onDeny={fn()}
      />
    ),
  },
};

export const ManyChildTools: Story = {
  args: {
    agentType: "librarian",
    description: "Cataloging project structure and dependencies",
    childTools: manyTools,
    running: true,
  },
};

export const NoChildTools: Story = {
  args: {
    agentType: "explore",
    description: "Starting codebase exploration...",
    childTools: [],
    running: true,
  },
};

export const ClickableDescription: Story = {
  args: {
    agentType: "explore",
    description: "Searching codebase for auth patterns",
    childTools: exploreTools,
    running: true,
    onDescriptionClick: fn(),
  },
};
