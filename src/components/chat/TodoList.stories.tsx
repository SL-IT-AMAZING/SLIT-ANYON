import type { Meta, StoryObj } from "@storybook/react";
import { TodoList } from "./TodoList";
import type { AgentTodo } from "@/ipc/types";

const meta: Meta<typeof TodoList> = {
  title: "Chat/TodoList",
  component: TodoList,
};

export default meta;
type Story = StoryObj<typeof TodoList>;

const withInProgressTodos: AgentTodo[] = [
  { id: "1", content: "Set up database", status: "completed" },
  { id: "2", content: "Create API endpoints", status: "completed" },
  { id: "3", content: "Build UI components", status: "in_progress" },
  { id: "4", content: "Write tests", status: "pending" },
  { id: "5", content: "Deploy to production", status: "pending" },
];

const allCompletedTodos: AgentTodo[] = [
  { id: "1", content: "Complete project setup", status: "completed" },
  { id: "2", content: "Review code", status: "completed" },
  { id: "3", content: "Deploy application", status: "completed" },
];

const allPendingTodos: AgentTodo[] = [
  { id: "1", content: "Design database schema", status: "pending" },
  { id: "2", content: "Implement authentication", status: "pending" },
  { id: "3", content: "Create user dashboard", status: "pending" },
];

export const WithInProgress: Story = {
  args: {
    todos: withInProgressTodos,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};

export const AllCompleted: Story = {
  args: {
    todos: allCompletedTodos,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};

export const AllPending: Story = {
  args: {
    todos: allPendingTodos,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};

export const Empty: Story = {
  args: {
    todos: [],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, border: "1px solid #e5e7eb" }}>
        <Story />
      </div>
    ),
  ],
};
