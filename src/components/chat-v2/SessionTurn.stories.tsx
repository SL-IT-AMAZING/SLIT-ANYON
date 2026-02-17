import type { Meta, StoryObj } from "@storybook/react";
import {
  Cpu,
  Eye,
  FileEdit,
  Globe,
  ListChecks,
  Search,
  Terminal,
} from "lucide-react";
import { useState } from "react";
import type { SessionTurnProps, StepItem } from "./SessionTurn";
import { SessionTurn } from "./SessionTurn";

function InteractiveSessionTurn(props: SessionTurnProps) {
  const [expanded, setExpanded] = useState(props.stepsExpanded ?? false);
  return (
    <SessionTurn
      {...props}
      stepsExpanded={expanded}
      onToggleSteps={() => setExpanded((e) => !e)}
    />
  );
}

const meta: Meta<typeof SessionTurn> = {
  title: "chat-v2/SessionTurn",
  component: SessionTurn,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof SessionTurn>;

const SAMPLE_STEPS: StepItem[] = [
  {
    id: "s1",
    type: "tool",
    toolName: "read",
    toolIcon: Eye,
    title: "Read",
    subtitle: "src/components/SessionTurn.tsx",
    args: ["file=src/components/SessionTurn.tsx"],
    content: (
      <pre className="text-xs text-muted-foreground font-mono">
        {"import React from 'react';\n// file contents..."}
      </pre>
    ),
  },
  {
    id: "s2",
    type: "tool",
    toolName: "grep",
    toolIcon: Search,
    title: "Grep",
    subtitle: 'pattern="useEffect"',
    args: ['pattern="useEffect"', "include=*.tsx"],
  },
  {
    id: "s3",
    type: "reasoning",
    text: "The component needs a controlled toggle for expanding steps. I should use a sticky header pattern.",
  },
  {
    id: "s4",
    type: "tool",
    toolName: "edit",
    toolIcon: FileEdit,
    title: "Edit",
    subtitle: "src/components/SessionTurn.tsx",
    args: ["file=src/components/SessionTurn.tsx"],
    content: (
      <pre className="text-xs text-muted-foreground font-mono">
        {
          "- const [open, setOpen] = useState(false);\n+ const [open, setOpen] = useState(true);"
        }
      </pre>
    ),
  },
];

const SAMPLE_DIFFS = [
  { file: "src/components/SessionTurn.tsx", additions: 42, deletions: 8 },
  {
    file: "src/components/SessionTurn.stories.tsx",
    additions: 120,
    deletions: 0,
  },
  { file: "src/lib/utils.ts", additions: 3, deletions: 1 },
];

const SAMPLE_RESPONSE = `## Changes Made

I've refactored the \`SessionTurn\` component to use a controlled toggle pattern:

- **Sticky headers** for both the user message and steps toggle
- **Filtered reasoning** steps that only show while the AI is working
- **Accordion-based** file diffs in the response section

### Key decisions

1. Used \`stepsExpanded\` as a controlled prop
2. Filtered reasoning steps on completion for a cleaner final view
3. Added \`tabular-nums\` for duration alignment`;

export const Working: Story = {
  render: () => (
    <InteractiveSessionTurn
      userMessage="Refactor the SessionTurn component to use sticky headers and a controlled expand/collapse pattern for the steps section."
      steps={SAMPLE_STEPS}
      working
      statusText="Making edits"
      duration="12s"
      stepsExpanded
    />
  ),
};

export const WorkingCollapsed: Story = {
  render: () => (
    <InteractiveSessionTurn
      userMessage="Add dark mode support to the settings panel with proper theme persistence."
      steps={SAMPLE_STEPS.slice(0, 2)}
      working
      statusText="Searching the codebase"
      duration="5s"
      stepsExpanded={false}
    />
  ),
};

export const CompletedWithResponse: Story = {
  render: () => (
    <InteractiveSessionTurn
      userMessage="Refactor the SessionTurn component to use sticky headers and a controlled expand/collapse pattern."
      steps={SAMPLE_STEPS}
      response={SAMPLE_RESPONSE}
      diffs={SAMPLE_DIFFS}
      duration="45s"
      stepsExpanded={false}
    />
  ),
};

export const StepsExpanded: Story = {
  render: () => (
    <InteractiveSessionTurn
      userMessage="Fix the layout bug where the steps section overlaps the response."
      steps={SAMPLE_STEPS}
      response="Fixed the z-index stacking issue by adjusting the sticky positioning values."
      diffs={[
        { file: "src/components/SessionTurn.tsx", additions: 4, deletions: 2 },
      ]}
      duration="23s"
      stepsExpanded
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <InteractiveSessionTurn
      userMessage="Deploy the application to production."
      steps={[
        {
          id: "e1",
          type: "tool",
          toolName: "bash",
          toolIcon: Terminal,
          title: "Bash",
          subtitle: "npm run build",
          args: ["command=npm run build"],
        },
      ]}
      error="Build failed: TypeScript error in src/index.ts — Cannot find module '@/missing-dep'. Please check your imports and try again."
      duration="8s"
      stepsExpanded={false}
    />
  ),
};

export const WithPermission: Story = {
  render: () => (
    <InteractiveSessionTurn
      userMessage="Delete all test fixtures from the project."
      steps={[
        {
          id: "p1",
          type: "tool",
          toolName: "bash",
          toolIcon: Terminal,
          title: "Bash",
          subtitle: "rm -rf test/fixtures",
        },
      ]}
      working
      statusText="Waiting for approval"
      duration="3s"
      stepsExpanded={false}
      permissions={[
        {
          id: "perm1",
          toolName: "bash",
          toolIcon: Terminal,
          title: "Run command",
          subtitle: "rm -rf test/fixtures",
          content: (
            <div className="text-xs text-muted-foreground p-2 font-mono">
              rm -rf test/fixtures
            </div>
          ),
        },
      ]}
    />
  ),
};

export const EmptyResponse: Story = {
  render: () => (
    <InteractiveSessionTurn
      userMessage="Update the config to enable strict TypeScript mode."
      steps={[
        {
          id: "er1",
          type: "tool",
          toolName: "edit",
          toolIcon: FileEdit,
          title: "Edit",
          subtitle: "tsconfig.json",
          args: ["file=tsconfig.json"],
        },
      ]}
      diffs={[{ file: "tsconfig.json", additions: 1, deletions: 1 }]}
      duration="6s"
      stepsExpanded={false}
    />
  ),
};

export const RealisticMultiStep: Story = {
  render: () => {
    const realisticSteps: StepItem[] = [
      {
        id: "r1",
        type: "tool",
        toolName: "read",
        toolIcon: Eye,
        title: "Read",
        subtitle: "src/components/chat-v2/SessionTurn.tsx",
        args: ["file=src/components/chat-v2/SessionTurn.tsx"],
        content: (
          <pre className="text-xs text-muted-foreground font-mono p-2 max-h-40 overflow-y-auto">
            {
              "import { cn } from '@/lib/utils';\nimport { ChevronsUpDown } from 'lucide-react';\n// ... 248 lines"
            }
          </pre>
        ),
      },
      {
        id: "r2",
        type: "reasoning",
        text: "I need to understand the existing component structure before making changes. Let me search for related components.",
      },
      {
        id: "r3",
        type: "tool",
        toolName: "grep",
        toolIcon: Search,
        title: "Grep",
        subtitle: 'pattern="SessionTurn"',
        args: ['pattern="SessionTurn"', "include=*.tsx"],
        content: (
          <pre className="text-xs text-muted-foreground font-mono p-2">
            {
              "src/components/chat-v2/Thread.tsx:  <SessionTurn key={turn.id} .../>\nsrc/pages/Chat.tsx:  import { SessionTurn } from ..."
            }
          </pre>
        ),
      },
      {
        id: "r4",
        type: "tool",
        toolName: "glob",
        toolIcon: Search,
        title: "Glob",
        subtitle: "src/components/chat-v2/*.tsx",
        args: ["pattern=src/components/chat-v2/*.tsx"],
      },
      {
        id: "r5",
        type: "tool",
        toolName: "read",
        toolIcon: Eye,
        title: "Read",
        subtitle: "src/components/ui/accordion.tsx",
        args: ["file=src/components/ui/accordion.tsx"],
      },
      {
        id: "r6",
        type: "reasoning",
        text: "The accordion uses Base UI primitives. I'll integrate it for the file diffs section in the response area.",
      },
      {
        id: "r7",
        type: "tool",
        toolName: "edit",
        toolIcon: FileEdit,
        title: "Edit",
        subtitle: "src/components/chat-v2/SessionTurn.tsx",
        args: ["file=src/components/chat-v2/SessionTurn.tsx"],
        content: (
          <pre className="text-xs text-muted-foreground font-mono p-2">
            {
              "@@ -45,6 +45,15 @@\n+ <Accordion>\n+   {diffs.map(diff => (\n+     <AccordionItem key={diff.file} value={diff.file}>\n+       ...\n+     </AccordionItem>\n+   ))}\n+ </Accordion>"
            }
          </pre>
        ),
      },
      {
        id: "r8",
        type: "tool",
        toolName: "webfetch",
        toolIcon: Globe,
        title: "WebFetch",
        subtitle: "base-ui.com/react/accordion",
        args: ["url=https://base-ui.com/react/accordion"],
      },
      {
        id: "r9",
        type: "tool",
        toolName: "bash",
        toolIcon: Terminal,
        title: "Bash",
        subtitle: "npx tsc --noEmit",
        args: ["command=npx tsc --noEmit"],
        content: (
          <pre className="text-xs text-muted-foreground font-mono p-2">
            0 errors found.
          </pre>
        ),
      },
      {
        id: "r10",
        type: "tool",
        toolName: "todowrite",
        toolIcon: ListChecks,
        title: "TodoWrite",
        subtitle: "Update task list",
      },
      {
        id: "r11",
        type: "tool",
        toolName: "task",
        toolIcon: Cpu,
        title: "Task",
        subtitle: "Run E2E tests in background",
        args: ["agent=sisyphus-junior"],
      },
      {
        id: "r12",
        type: "reasoning",
        text: "All type checks pass. The component is ready. Let me write the final response.",
      },
    ];

    return (
      <InteractiveSessionTurn
        userMessage="Refactor the SessionTurn component to add an accordion-based file diff viewer in the response section. Make sure the accordion uses our Base UI primitives and integrates cleanly with the existing layout. Run type checks when done."
        steps={realisticSteps}
        response={`## Refactoring Complete

I've updated \`SessionTurn\` to include an accordion-based file diff viewer:

### What changed

- **Accordion integration**: File diffs now use \`<Accordion>\` / \`<AccordionItem>\` from our Base UI primitives
- **Sticky headers**: Both user message and steps toggle remain pinned during scroll
- **Reasoning filter**: Reasoning steps are hidden once the AI finishes working
- **Type-safe**: All props use exported interfaces with strict typing

### Files modified

| File | Changes |
|------|---------|
| \`SessionTurn.tsx\` | Added accordion diffs, sticky positioning |
| \`SessionTurn.stories.tsx\` | Added 8 story variants |
| \`utils.ts\` | Added \`computeStatus\` helper |

\`\`\`typescript
// Usage
<SessionTurn
  userMessage="..."
  steps={steps}
  response={markdown}
  diffs={fileDiffs}
  stepsExpanded={expanded}
  onToggleSteps={() => setExpanded(e => !e)}
/>
\`\`\``}
        diffs={[
          {
            file: "src/components/chat-v2/SessionTurn.tsx",
            additions: 95,
            deletions: 22,
            content: (
              <pre className="text-xs text-muted-foreground font-mono p-2 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {`@@ -1,12 +1,18 @@
+import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
 import { cn } from "@/lib/utils";
 import { ChevronsUpDown, FileCode, Wrench } from "lucide-react";
+import type { LucideIcon } from "lucide-react";
 import { BasicTool } from "./BasicTool";
 import { LogoSpinner } from "./LogoSpinner";
 import { MarkdownContent } from "./MarkdownContent";

@@ -88,6 +94,32 @@
+      {hasResponse && (
+        <div className="pt-4 space-y-3">
+          <Accordion>
+            {diffs.map((diff) => (
+              <AccordionItem key={diff.file} value={diff.file}>
+                <AccordionTrigger>
+                  ...
+                </AccordionTrigger>
+              </AccordionItem>
+            ))}
+          </Accordion>
+        </div>
+      )}`}
              </pre>
            ),
          },
          {
            file: "src/components/chat-v2/SessionTurn.stories.tsx",
            additions: 280,
            deletions: 0,
          },
          {
            file: "src/lib/utils.ts",
            additions: 18,
            deletions: 0,
          },
        ]}
        duration="2m 14s"
        stepsExpanded
      />
    );
  },
};
