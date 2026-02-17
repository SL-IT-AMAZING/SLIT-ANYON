import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { ChatErrorBox } from "./ChatErrorBox";
import { AI_STREAMING_ERROR_MESSAGE_PREFIX } from "@/shared/texts";

const meta: Meta<typeof ChatErrorBox> = {
  title: "Chat/ChatErrorBox",
  component: ChatErrorBox,
};

export default meta;
type Story = StoryObj<typeof ChatErrorBox>;

const containerDecorator = (Story: React.ComponentType) => (
  <div style={{ maxWidth: 600 }}>
    <Story />
  </div>
);

export const GenericError: Story = {
  args: {
    error: "Something went wrong while processing your request.",
    isAnyonProEnabled: false,
    onDismiss: fn(),
    onStartNewChat: fn(),
  },
  decorators: [containerDecorator],
};

export const RateLimitError: Story = {
  args: {
    error: "Resource has been exhausted (429). Please try again later.",
    isAnyonProEnabled: false,
    onDismiss: fn(),
  },
  decorators: [containerDecorator],
};

export const RateLimitErrorWithPro: Story = {
  args: {
    error: "Resource has been exhausted (429). Please try again later.",
    isAnyonProEnabled: true,
    onDismiss: fn(),
    onStartNewChat: fn(),
  },
  decorators: [containerDecorator],
};

export const FreeQuotaError: Story = {
  args: {
    error: "This model doesn't have a free quota tier. Please upgrade.",
    isAnyonProEnabled: false,
    onDismiss: fn(),
  },
  decorators: [containerDecorator],
};

export const StreamingError: Story = {
  args: {
    error: `${AI_STREAMING_ERROR_MESSAGE_PREFIX}The model returned an unexpected response. Please try again.`,
    isAnyonProEnabled: true,
    onDismiss: fn(),
    onStartNewChat: fn(),
  },
  decorators: [containerDecorator],
};
