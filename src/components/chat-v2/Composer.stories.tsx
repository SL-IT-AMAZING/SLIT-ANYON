import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Composer } from "./Composer";

const meta: Meta<typeof Composer> = {
  title: "chat-v2/Composer",
  component: Composer,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState("");
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Composer
          value={value}
          onChange={setValue}
          onSend={() => {
            setValue("");
          }}
        />
      </div>
    );
  },
};

export const WithText: Story = {
  render: () => {
    const [value, setValue] = useState("How do I implement a binary search?");
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Composer
          value={value}
          onChange={setValue}
          onSend={() => {
            setValue("");
          }}
        />
      </div>
    );
  },
};

export const Streaming: Story = {
  render: () => {
    const [value, setValue] = useState("");
    const [streaming, setStreaming] = useState(true);
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        <Composer
          value={value}
          onChange={setValue}
          isStreaming={streaming}
          onStop={() => setStreaming(false)}
          onSend={() => {
            setValue("");
            setStreaming(true);
          }}
        />
        <p className="text-center text-xs text-muted-foreground">
          {streaming
            ? "Streaming... click stop to cancel"
            : "Stopped. Type and send to restart."}
        </p>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="mx-auto max-w-2xl p-4">
      <Composer value="" disabled placeholder="Connecting..." />
    </div>
  ),
};

export const WithLongText: Story = {
  render: () => {
    const [value, setValue] = useState(
      "This is a long message that demonstrates the auto-grow behavior of the textarea.\n\nIt spans multiple lines to show how the composer expands vertically.\n\nLine 3: The textarea will grow up to a maximum height of 200px.\n\nLine 4: After that, it becomes scrollable.\n\nLine 5: This ensures the composer doesn't take over the entire screen.\n\nLine 6: But still gives enough room for longer messages.",
    );
    return (
      <div className="mx-auto max-w-2xl p-4">
        <Composer
          value={value}
          onChange={setValue}
          onSend={() => {
            setValue("");
          }}
        />
      </div>
    );
  },
};
