import type { LocalAgentFixture } from "../../../../testing/fake-llm-server/localAgentTypes";

/**
 * Fixture for native agent runtime E2E test.
 * Uses native tool names (read, glob) instead of opencode names (read_file, list_dir).
 */
export const fixture: LocalAgentFixture = {
  description: "Native agent reads a file using the 'read' tool",
  turns: [
    {
      text: "I'll read the App.tsx file to see its contents.",
      toolCalls: [
        {
          name: "read",
          args: {
            file_path: "src/App.tsx",
          },
        },
      ],
    },
    {
      text: "I can see the file contents. The app renders a simple component with the text 'Minimal imported app'. The file is straightforward and doesn't have any issues.",
    },
  ],
};
