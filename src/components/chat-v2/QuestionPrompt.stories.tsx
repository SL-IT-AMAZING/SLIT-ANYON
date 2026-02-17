import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { QuestionPromptProps } from "./QuestionPrompt";
import { QuestionPrompt } from "./QuestionPrompt";

function SubmitCapture(props: QuestionPromptProps) {
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="space-y-4 max-w-lg">
      {result ? (
        <div className="p-3 rounded-lg border border-border bg-muted/20 text-sm text-muted-foreground">
          {result}
        </div>
      ) : (
        <QuestionPrompt
          {...props}
          onSubmit={(a) => setResult(`Submitted: ${JSON.stringify(a)}`)}
          onDismiss={() => setResult("Dismissed")}
        />
      )}
    </div>
  );
}

const meta: Meta<typeof QuestionPrompt> = {
  title: "chat-v2/QuestionPrompt",
  component: QuestionPrompt,
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

export const SingleQuestion: Story = {
  render: () => (
    <SubmitCapture
      questions={[
        {
          question: "Which package manager do you prefer?",
          options: [
            {
              label: "npm",
              description: "The default Node.js package manager",
            },
            {
              label: "pnpm",
              description: "Fast, disk space efficient package manager",
            },
            {
              label: "yarn",
              description: "Deterministic dependency resolution",
            },
          ],
        },
      ]}
      onSubmit={() => {}}
    />
  ),
};

export const MultipleChoice: Story = {
  render: () => (
    <SubmitCapture
      questions={[
        {
          question: "Which features should be enabled?",
          multiple: true,
          options: [
            { label: "TypeScript" },
            { label: "ESLint" },
            { label: "Prettier" },
            { label: "Tailwind CSS" },
          ],
        },
      ]}
      onSubmit={() => {}}
    />
  ),
};

export const MultiQuestion: Story = {
  render: () => (
    <SubmitCapture
      questions={[
        {
          header: "Framework",
          question: "Which framework do you want to use?",
          options: [
            { label: "React", description: "Component-based UI library" },
            { label: "Vue", description: "Progressive JavaScript framework" },
            { label: "Svelte", description: "Compile-time reactive framework" },
          ],
        },
        {
          header: "Styling",
          question: "How do you want to handle styling?",
          options: [
            { label: "Tailwind CSS" },
            { label: "CSS Modules" },
            { label: "Styled Components" },
          ],
        },
        {
          header: "Testing",
          question: "Which test runner do you prefer?",
          options: [
            { label: "Vitest" },
            { label: "Jest" },
            { label: "Playwright" },
          ],
        },
      ]}
      onSubmit={() => {}}
    />
  ),
};

export const WithCustomAnswer: Story = {
  render: () => (
    <SubmitCapture
      questions={[
        {
          question: "What database should this project use?",
          options: [
            { label: "PostgreSQL", description: "Relational database" },
            { label: "SQLite", description: "Embedded file-based database" },
          ],
        },
      ]}
      onSubmit={() => {}}
    />
  ),
};

export const TwoOptionsSimple: Story = {
  render: () => (
    <SubmitCapture
      questions={[
        {
          question: "Do you want to proceed with the migration?",
          options: [{ label: "Yes" }, { label: "No" }],
        },
      ]}
      onSubmit={() => {}}
    />
  ),
};

export const ManyOptions: Story = {
  render: () => (
    <SubmitCapture
      questions={[
        {
          question: "Select a deployment target:",
          options: [
            { label: "Vercel", description: "Serverless platform" },
            { label: "Netlify", description: "JAMstack hosting" },
            { label: "AWS Lambda", description: "Serverless compute" },
            { label: "Google Cloud Run", description: "Container platform" },
            { label: "Fly.io", description: "Edge application hosting" },
            { label: "Railway", description: "Infrastructure platform" },
            { label: "Render", description: "Cloud application hosting" },
            { label: "DigitalOcean", description: "Cloud infrastructure" },
            { label: "Cloudflare Workers", description: "Edge compute" },
          ],
        },
      ]}
      onSubmit={() => {}}
    />
  ),
};
