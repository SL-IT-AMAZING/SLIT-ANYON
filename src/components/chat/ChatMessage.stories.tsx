import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Message } from "@/ipc/types";
import type { Meta, StoryObj } from "@storybook/react";
import { format, formatDistanceToNow } from "date-fns";
import { Bot, CheckCircle, Clock, Copy, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { StreamingLoadingAnimation } from "./StreamingLoadingAnimation";

/**
 * Presentational wrapper component that mirrors ChatMessage visual structure
 * without requiring hooks. Used for Storybook stories.
 */
const ChatMessageDisplay = ({
  message,
  isLastMessage,
  isStreaming = false,
}: {
  message: Message;
  isLastMessage: boolean;
  isStreaming?: boolean;
}) => {
  const formatTimestamp = (timestamp: string | Date) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours =
      (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    if (diffInHours < 24) {
      return formatDistanceToNow(messageTime, { addSuffix: true });
    } else {
      return format(messageTime, "MMM d, yyyy 'at' h:mm a");
    }
  };

  return (
    <div
      className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
    >
      <div
        className={`mt-2 group ${
          message.role === "assistant"
            ? "w-full max-w-3xl mx-auto"
            : "max-w-[85%] mr-4"
        }`}
      >
        <div
          className={`rounded-lg p-2 ${
            message.role === "assistant" ? "" : "bg-(--sidebar-accent)"
          }`}
        >
          {message.role === "assistant" &&
          !message.content &&
          isStreaming &&
          isLastMessage ? (
            <StreamingLoadingAnimation variant="initial" />
          ) : (
            <div
              className="prose dark:prose-invert prose-headings:mb-2 prose-p:my-1 prose-pre:my-0 max-w-none break-words"
              suppressHydrationWarning
            >
              {message.role === "assistant" ? (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                  {isLastMessage && isStreaming && (
                    <StreamingLoadingAnimation variant="streaming" />
                  )}
                </>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
          {(message.role === "assistant" && message.content && !isStreaming) ||
          message.approvalState ? (
            <div
              className={`mt-2 flex items-center ${
                message.role === "assistant" && message.content && !isStreaming
                  ? "justify-between"
                  : ""
              } text-xs`}
            >
              {message.role === "assistant" &&
                message.content &&
                !isStreaming && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          data-testid="copy-message-button"
                          aria-label="Copy"
                          className="flex items-center space-x-1 px-2 py-1 text-xs text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded transition-colors duration-200 cursor-pointer"
                        />
                      }
                    >
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline"></span>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>
                )}
              <div className="flex flex-wrap gap-2">
                {message.approvalState && (
                  <div className="flex items-center space-x-1">
                    {message.approvalState === "approved" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Approved</span>
                      </>
                    ) : message.approvalState === "rejected" ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Rejected</span>
                      </>
                    ) : null}
                  </div>
                )}
                {message.role === "assistant" && message.model && (
                  <div className="flex items-center gap-1 text-muted-foreground w-full sm:w-auto">
                    <Bot className="h-4 w-4 flex-shrink-0" />
                    <span>{message.model}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        {message.role === "assistant" && message.createdAt && (
          <div className="mt-1 flex flex-wrap items-center justify-start space-x-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatTimestamp(message.createdAt)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const meta: Meta<typeof ChatMessageDisplay> = {
  title: "Chat/ChatMessage",
  component: ChatMessageDisplay,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ChatMessageDisplay>;

const assistantMarkdownContent = `## Login Page Implementation

I'll create a clean login page with the following:

- Email input with validation
- Password input with show/hide toggle
- Remember me checkbox

\`\`\`tsx
export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form className="w-full max-w-md space-y-4 p-8">
        <h1>Sign In</h1>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
}
\`\`\``;

export const UserMessage: Story = {
  args: {
    message: {
      id: 1,
      role: "user",
      content:
        "Can you help me create a login page with email and password fields?",
      createdAt: new Date().toISOString(),
    } as Message,
    isLastMessage: false,
    isStreaming: false,
  },
};

export const AssistantMessage: Story = {
  args: {
    message: {
      id: 2,
      role: "assistant",
      content: assistantMarkdownContent,
      createdAt: new Date().toISOString(),
      model: "claude-sonnet-4-20250514",
    } as Message,
    isLastMessage: false,
    isStreaming: false,
  },
};

export const AssistantMessageStreaming: Story = {
  args: {
    message: {
      id: 3,
      role: "assistant",
      content:
        "Here's what I'll do:\n\n1. Create a login component\n2. Add form validation",
      createdAt: new Date().toISOString(),
      model: "claude-sonnet-4-20250514",
    } as Message,
    isLastMessage: true,
    isStreaming: true,
  },
};

export const AssistantMessageEmpty: Story = {
  args: {
    message: {
      id: 4,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      model: "claude-sonnet-4-20250514",
    } as Message,
    isLastMessage: true,
    isStreaming: true,
  },
};

export const ApprovedMessage: Story = {
  args: {
    message: {
      id: 5,
      role: "assistant",
      content:
        "I've created the login page with email validation, password strength requirements, and a remember me checkbox. The component is fully responsive and accessible.",
      createdAt: new Date().toISOString(),
      model: "claude-sonnet-4-20250514",
      approvalState: "approved",
    } as Message,
    isLastMessage: false,
    isStreaming: false,
  },
};

export const RejectedMessage: Story = {
  args: {
    message: {
      id: 6,
      role: "assistant",
      content:
        "I've created the login page with email validation, password strength requirements, and a remember me checkbox. The component is fully responsive and accessible.",
      createdAt: new Date().toISOString(),
      model: "claude-sonnet-4-20250514",
      approvalState: "rejected",
    } as Message,
    isLastMessage: false,
    isStreaming: false,
  },
};
