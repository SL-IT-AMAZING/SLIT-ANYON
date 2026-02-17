import type { Meta, StoryObj } from "@storybook/react";
import { Cpu, Eye, FileEdit, ListChecks, Search, Terminal } from "lucide-react";
import { BasicTool, GenericTool } from "./BasicTool";

const meta: Meta<typeof BasicTool> = {
  title: "chat-v2/BasicTool",
  component: BasicTool,
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
/*  Individual tool stories                                           */
/* ------------------------------------------------------------------ */

export const ReadTool: Story = {
  args: {
    icon: Eye,
    trigger: {
      title: "Read",
      subtitle: "src/components/App.tsx",
    },
  },
};

export const EditTool: Story = {
  args: {
    icon: FileEdit,
    trigger: {
      title: "Edit",
      subtitle: "src/utils/helpers.ts",
      args: ["lines 42-58"],
    },
    children: (
      <pre className="rounded border border-border bg-muted/20 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
        {`- function formatDate(d: Date) {
-   return d.toISOString();
- }
+ function formatDate(d: Date, locale = "en-US") {
+   return new Intl.DateTimeFormat(locale).format(d);
+ }`}
      </pre>
    ),
  },
};

export const BashTool: Story = {
  args: {
    icon: Terminal,
    trigger: {
      title: "Bash",
      subtitle: "npm run build",
      action: (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-foreground/40" />
          done
        </span>
      ),
    },
    children: (
      <pre className="rounded border border-border bg-muted/20 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
        {`> anyon@0.1.0 build
> tsc && vite build

vite v5.4.0 building for production...
✓ 1024 modules transformed.
dist/index.html          0.46 kB │ gzip:  0.30 kB
dist/assets/index.js   312.18 kB │ gzip: 98.42 kB
✓ built in 4.21s`}
      </pre>
    ),
  },
};

export const GrepTool: Story = {
  args: {
    icon: Search,
    trigger: {
      title: "Grep",
      args: ["pattern: useState", "path: src/"],
    },
    hideDetails: true,
  },
};

export const TaskTool: Story = {
  args: {
    icon: Cpu,
    trigger: {
      title: "Task",
      subtitle: "explore \u00B7 Searching codebase",
    },
    children: (
      <div className="flex flex-col gap-0.5">
        <BasicTool
          icon={Search}
          trigger={{ title: "Grep", args: ["pattern: useEffect"] }}
          hideDetails
        />
        <BasicTool
          icon={Eye}
          trigger={{ title: "Read", subtitle: "src/hooks/useData.ts" }}
        />
        <BasicTool
          icon={Eye}
          trigger={{ title: "Read", subtitle: "src/hooks/useAuth.ts" }}
        />
      </div>
    ),
  },
};

/* ------------------------------------------------------------------ */
/*  Behavior variants                                                 */
/* ------------------------------------------------------------------ */

export const ForceOpen: Story = {
  args: {
    icon: FileEdit,
    trigger: {
      title: "Edit",
      subtitle: "src/utils/helpers.ts",
      args: ["lines 42-58"],
    },
    forceOpen: true,
    children: (
      <pre className="rounded border border-border bg-muted/20 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
        {`+ const result = compute(input);`}
      </pre>
    ),
  },
};

export const Locked: Story = {
  args: {
    icon: Eye,
    trigger: {
      title: "Read",
      subtitle: "package.json",
    },
    locked: true,
    defaultOpen: true,
    children: (
      <pre className="rounded border border-border bg-muted/20 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
        {`{
  "name": "anyon",
  "version": "0.1.0"
}`}
      </pre>
    ),
  },
};

export const CustomTrigger: Story = {
  args: {
    icon: ListChecks,
    trigger: (
      <span className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">Custom trigger</span>
        <span className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
          3 results
        </span>
      </span>
    ),
    children: (
      <p className="text-xs text-muted-foreground">
        This uses a ReactNode trigger instead of a TriggerTitle object.
      </p>
    ),
  },
};

/* ------------------------------------------------------------------ */
/*  Composite: how multiple tools look stacked together               */
/* ------------------------------------------------------------------ */

export const MultipleTools: Story = {
  render: () => (
    <div className="flex flex-col gap-0.5">
      <BasicTool
        icon={Eye}
        trigger={{ title: "Read", subtitle: "src/components/App.tsx" }}
      />
      <BasicTool
        icon={Search}
        trigger={{
          title: "Grep",
          args: ["pattern: useState", "path: src/"],
        }}
        hideDetails
      />
      <BasicTool
        icon={FileEdit}
        trigger={{
          title: "Edit",
          subtitle: "src/utils/helpers.ts",
          args: ["lines 42-58"],
        }}
      >
        <pre className="rounded border border-border bg-muted/20 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
          {`- const old = true;
+ const old = false;`}
        </pre>
      </BasicTool>
      <BasicTool
        icon={Terminal}
        trigger={{
          title: "Bash",
          subtitle: "npm run lint",
          action: (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-foreground/40" />
              done
            </span>
          ),
        }}
      >
        <pre className="rounded border border-border bg-muted/20 p-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">
          {`All files pass linting.`}
        </pre>
      </BasicTool>
      <BasicTool
        icon={Eye}
        trigger={{ title: "Read", subtitle: "tsconfig.json" }}
      />
      <GenericTool tool="unknown_tool" />
      <BasicTool
        icon={Cpu}
        trigger={{
          title: "Task",
          subtitle: "explore \u00B7 Finding references",
        }}
      >
        <div className="flex flex-col gap-0.5">
          <BasicTool
            icon={Search}
            trigger={{ title: "Grep", args: ["pattern: formatDate"] }}
            hideDetails
          />
          <BasicTool
            icon={Eye}
            trigger={{
              title: "Read",
              subtitle: "src/utils/date.ts",
            }}
          />
        </div>
      </BasicTool>
    </div>
  ),
};
