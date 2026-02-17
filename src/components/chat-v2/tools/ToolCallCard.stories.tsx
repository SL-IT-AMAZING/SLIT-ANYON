import type { Meta, StoryObj } from "@storybook/react";
import { Eye, FileEdit, Search, Terminal, Wrench } from "lucide-react";
import { ToolCallCard } from "./ToolCallCard";

const meta: Meta<typeof ToolCallCard> = {
  title: "chat-v2/tools/ToolCallCard",
  component: ToolCallCard,
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

export const Running: Story = {
  args: {
    icon: Eye,
    title: "Read",
    subtitle: "src/index.ts",
    status: "running",
  },
};

export const Completed: Story = {
  args: {
    icon: FileEdit,
    title: "Edit",
    subtitle: "src/app.tsx",
    status: "completed",
    metadata: [{ label: "description", value: "Updated imports" }],
    children: (
      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
        {`- import { useState } from "react";
+ import { useState, useEffect } from "react";`}
      </pre>
    ),
  },
};

export const Error: Story = {
  args: {
    icon: Terminal,
    title: "Bash",
    subtitle: "npm test",
    status: "error",
    children: (
      <span className="text-xs text-muted-foreground">
        Process exited with code 1: FAIL src/utils.test.ts
      </span>
    ),
  },
};

export const Expandable: Story = {
  args: {
    icon: Eye,
    title: "Read",
    subtitle: "src/components/Header.tsx",
    status: "completed",
    children: (
      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
        {`export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Logo />
      <Nav />
    </header>
  );
}`}
      </pre>
    ),
  },
};

export const DefaultExpanded: Story = {
  args: {
    icon: Eye,
    title: "Read",
    subtitle: "src/components/Header.tsx",
    status: "completed",
    defaultExpanded: true,
    children: (
      <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
        {`export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Logo />
      <Nav />
    </header>
  );
}`}
      </pre>
    ),
  },
};

export const WithMetadata: Story = {
  args: {
    icon: Search,
    title: "Grep",
    subtitle: "src/",
    status: "completed",
    metadata: [
      { label: "pattern", value: "TODO" },
      { label: "include", value: "*.ts" },
      { label: "matches", value: "12" },
    ],
  },
};

export const NoChildren: Story = {
  args: {
    icon: Wrench,
    title: "ToolUse",
    subtitle: "get_weather",
    status: "completed",
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <ToolCallCard
        icon={Eye}
        title="Read"
        subtitle="src/index.ts"
        status="running"
      />
      <ToolCallCard
        icon={FileEdit}
        title="Edit"
        subtitle="src/app.tsx"
        status="completed"
      />
      <ToolCallCard
        icon={Terminal}
        title="Bash"
        subtitle="npm test"
        status="error"
      />
    </div>
  ),
};
