import type { Meta, StoryObj } from "@storybook/react";
import { StreamingLoadingAnimation } from "./StreamingLoadingAnimation";

const meta: Meta<typeof StreamingLoadingAnimation> = {
  title: "Chat/StreamingLoadingAnimation",
  component: StreamingLoadingAnimation,
  argTypes: {
    variant: {
      control: "select",
      options: ["initial", "streaming"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof StreamingLoadingAnimation>;

export const Initial: Story = {
  args: {
    variant: "initial",
  },
};

export const Streaming: Story = {
  args: {
    variant: "streaming",
  },
};
