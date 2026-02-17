import type { Meta, StoryObj } from "@storybook/react";
import { WritePlanTool } from "./WritePlanTool";
import { ExitPlanTool } from "./ExitPlanTool";

const meta: Meta = {
  title: "chat-v2/tools/PlanningTools",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const WritePlanRunning: StoryObj = {
  render: () => (
    <WritePlanTool
      title="Authentication System Refactor"
      complete="false"
      status="running"
    />
  ),
};

export const WritePlanCompleted: StoryObj = {
  render: () => (
    <WritePlanTool
      title="Authentication System Refactor"
      summary="Migrate from session-based auth to JWT tokens across all API routes, update middleware, and add refresh token rotation."
      complete="true"
      status="completed"
    />
  ),
};

export const ExitPlanWithNotes: StoryObj = {
  render: () => (
    <ExitPlanTool notes="Plan approved. Starting implementation with the database migration step first, then updating the auth middleware." />
  ),
};

export const ExitPlanWithoutNotes: StoryObj = {
  render: () => <ExitPlanTool />,
};
