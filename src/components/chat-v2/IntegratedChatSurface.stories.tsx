import type { Meta, StoryObj } from "@storybook/react";
import { Cpu, Eye, FileEdit, Search, Terminal } from "lucide-react";
import { useMemo, useState } from "react";

import { Composer } from "./Composer";
import { QuestionPrompt } from "./QuestionPrompt";
import { SessionTurn, type StepItem } from "./SessionTurn";
import { TaskDelegationTool } from "./TaskDelegationTool";
import { Thread, ThreadFooter, ThreadMessages, ThreadViewport } from "./Thread";

interface DemoTurn {
  id: string;
  userMessage: string;
  steps: StepItem[];
  response?: string;
  duration?: string;
  statusText?: string;
  working?: boolean;
}

const DEMO_TURNS: DemoTurn[] = [
  {
    id: "turn-1",
    userMessage: "Find where chat list virtualization is implemented.",
    steps: [
      {
        id: "turn-1-step-1",
        type: "tool",
        toolName: "glob",
        toolIcon: Search,
        title: "Glob",
        subtitle: "src/components/**/MessagesList.tsx",
      },
      {
        id: "turn-1-step-2",
        type: "tool",
        toolName: "read",
        toolIcon: Eye,
        title: "Read",
        subtitle: "src/components/chat/MessagesList.tsx",
      },
    ],
    response:
      "Found the list rendering in `MessagesList.tsx`. It uses `react-virtuoso` and switches to a non-virtualized path in test mode.",
    duration: "16s",
  },
  {
    id: "turn-2",
    userMessage:
      "Update retry logic so grouped turns do not break when assistant emits multiple chunks.",
    steps: [
      {
        id: "turn-2-step-1",
        type: "tool",
        toolName: "edit",
        toolIcon: FileEdit,
        title: "Edit",
        subtitle: "src/components/chat/MessagesList.tsx",
      },
      {
        id: "turn-2-step-2",
        type: "tool",
        toolName: "bash",
        toolIcon: Terminal,
        title: "Bash",
        subtitle: "npm run ts",
      },
    ],
    response:
      "Switched from index-based lookup to role-based traversal (`last user`, `previous committed assistant`) so retry/undo remains correct for grouped assistant outputs.",
    duration: "41s",
  },
  {
    id: "turn-3",
    userMessage: "Continue with UI parity and summarize what changed.",
    steps: [
      {
        id: "turn-3-step-1",
        type: "reasoning",
        text: "I should verify open tasks and then delegate a focused review for regressions.",
      },
      {
        id: "turn-3-step-2",
        type: "tool",
        toolName: "task",
        toolIcon: Cpu,
        title: "Task",
        subtitle: "delegating regression scan",
      },
    ],
    working: true,
    statusText: "Delegating work",
    duration: "9s",
  },
];

const meta: Meta<typeof Thread> = {
  title: "chat-v2/Integrated Chat Surface",
  component: Thread,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", background: "var(--background)" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopReplica: Story = {
  render: function IntegratedChatSurfaceStory() {
    const [expandedTurnIds, setExpandedTurnIds] = useState<Set<string>>(
      () => new Set(["turn-3"]),
    );
    const [draft, setDraft] = useState(
      "After this, remove legacy chat-only components and keep storybook parity.",
    );
    const [questionAnswers, setQuestionAnswers] = useState<string[][] | null>(
      null,
    );
    const [showQuestionPrompt, setShowQuestionPrompt] = useState(true);

    const answerSummary = useMemo(() => {
      if (!questionAnswers) {
        return "";
      }
      return questionAnswers
        .map((answerSet, index) => `Q${index + 1}: ${answerSet.join(", ")}`)
        .join(" | ");
    }, [questionAnswers]);

    const toggleTurn = (turnId: string) => {
      setExpandedTurnIds((previous) => {
        const next = new Set(previous);
        if (next.has(turnId)) {
          next.delete(turnId);
        } else {
          next.add(turnId);
        }
        return next;
      });
    };

    return (
      <Thread>
        <ThreadViewport>
          <ThreadMessages className="pb-6">
            {DEMO_TURNS.map((turn) => (
              <div key={turn.id} className="px-4">
                <SessionTurn
                  userMessage={turn.userMessage}
                  steps={turn.steps}
                  response={turn.response}
                  duration={turn.duration}
                  working={turn.working}
                  statusText={turn.statusText}
                  stepsExpanded={expandedTurnIds.has(turn.id)}
                  onToggleSteps={() => toggleTurn(turn.id)}
                />
              </div>
            ))}

            <div className="px-4 pt-2">
              <TaskDelegationTool
                agentType="explore"
                description="Scanning the codebase for stale legacy chat imports"
                running
                childTools={[
                  {
                    id: "child-1",
                    toolName: "grep",
                    title: "Grep",
                    subtitle: "AnyonLegacy",
                    status: "completed",
                  },
                  {
                    id: "child-2",
                    toolName: "read",
                    title: "Read",
                    subtitle: "src/components/chat/MessagesList.tsx",
                    status: "completed",
                  },
                  {
                    id: "child-3",
                    toolName: "grep",
                    title: "Grep",
                    subtitle: "OpenCodeTool",
                    status: "running",
                  },
                ]}
              />
            </div>

            {showQuestionPrompt && (
              <div className="px-4 pt-2">
                <QuestionPrompt
                  questions={[
                    {
                      header: "Scope",
                      question: "Which visual fidelity level do you want for this migration?",
                      options: [
                        {
                          label: "Exact desktop parity",
                          description: "Prioritize behavior and structure parity.",
                        },
                        {
                          label: "Style parity only",
                          description: "Match visuals with looser behavior.",
                        },
                      ],
                    },
                  ]}
                  onSubmit={(answers) => {
                    setQuestionAnswers(answers);
                    setShowQuestionPrompt(false);
                  }}
                  onDismiss={() => setShowQuestionPrompt(false)}
                />
              </div>
            )}

            {questionAnswers && (
              <div className="px-6 pt-2 text-xs text-muted-foreground">
                Latest answer: {answerSummary}
              </div>
            )}
          </ThreadMessages>
        </ThreadViewport>

        <ThreadFooter className="px-4">
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => setDraft("")}
            placeholder="Ask Anyon to continue..."
          />
        </ThreadFooter>
      </Thread>
    );
  },
};
