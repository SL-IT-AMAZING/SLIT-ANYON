import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { FileEdit, FilePlus, Terminal } from "lucide-react";
import { BasicTool } from "./BasicTool";
import type { PermissionPromptProps } from "./PermissionPrompt";
import { PermissionPrompt } from "./PermissionPrompt";

const actions: PermissionPromptProps = {
  onAllowOnce: fn(),
  onAllowAlways: fn(),
  onDeny: fn(),
};

const meta: Meta<typeof PermissionPrompt> = {
  title: "chat-v2/PermissionPrompt",
  component: PermissionPrompt,
  args: actions,
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
/*  Default                                                           */
/* ------------------------------------------------------------------ */

export const Default: Story = {};

/* ------------------------------------------------------------------ */
/*  Composition with BasicTool                                        */
/* ------------------------------------------------------------------ */

export const WithToolContext: Story = {
  render: () => (
    <div>
      <BasicTool
        icon={Terminal}
        trigger={{ title: "Bash", subtitle: "rm -rf /tmp/old-cache" }}
        forceOpen
        locked
      >
        <pre className="text-xs text-muted-foreground font-mono">
          rm -rf /tmp/old-cache
        </pre>
      </BasicTool>
      <PermissionPrompt {...actions} />
    </div>
  ),
};

export const WithEditContext: Story = {
  render: () => (
    <div>
      <BasicTool
        icon={FileEdit}
        trigger={{
          title: "Edit",
          subtitle: "src/utils/config.ts",
          args: ["lines 12-18"],
        }}
        forceOpen
        locked
      >
        <pre className="rounded border border-border bg-muted/20 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
          {`- const API_URL = "http://localhost:3000";
+ const API_URL = process.env.API_URL ?? "http://localhost:3000";`}
        </pre>
      </BasicTool>
      <PermissionPrompt {...actions} />
    </div>
  ),
};

export const WithWriteContext: Story = {
  render: () => (
    <div>
      <BasicTool
        icon={FilePlus}
        trigger={{
          title: "Write",
          subtitle: "src/config/defaults.ts",
        }}
        forceOpen
        locked
      >
        <pre className="rounded border border-border bg-muted/20 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
          {`export const defaults = {
  timeout: 5000,
  retries: 3,
  verbose: false,
};`}
        </pre>
      </BasicTool>
      <PermissionPrompt {...actions} />
    </div>
  ),
};
