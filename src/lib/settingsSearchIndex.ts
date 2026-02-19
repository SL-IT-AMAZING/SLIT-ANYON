export const SECTION_IDS = {
  general: "general-settings",
  workflow: "workflow-settings",
  ai: "ai-settings",
  telemetry: "telemetry",
  integrations: "integrations",
  toolsMcp: "tools-mcp",
  experiments: "experiments",
  dangerZone: "danger-zone",
} as const;

export const SETTING_IDS = {
  theme: "setting-theme",
  zoom: "setting-zoom",
  autoUpdate: "setting-auto-update",
  releaseChannel: "setting-release-channel",
  runtimeMode: "setting-runtime-mode",
  nodePath: "setting-node-path",
  autoApprove: "setting-auto-approve",
  autoFix: "setting-auto-fix",
  autoExpandPreview: "setting-auto-expand-preview",
  chatCompletionNotification: "setting-chat-completion-notification",
  thinkingBudget: "setting-thinking-budget",
  maxChatTurns: "setting-max-chat-turns",
  telemetry: "setting-telemetry",
  github: "setting-github",
  vercel: "setting-vercel",
  supabase: "setting-supabase",
  nativeGit: "setting-native-git",
  reset: "setting-reset",
  language: "setting-language",
} as const;

type SearchableSettingItem = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  sectionId: string;
  sectionLabel: string;
};

export const SETTINGS_SEARCH_INDEX: SearchableSettingItem[] = [
  // General Settings
  {
    id: SETTING_IDS.theme,
    label: "Theme",
    description: "Switch between system, light, and dark mode",
    keywords: ["dark mode", "light mode", "appearance", "color", "system"],
    sectionId: SECTION_IDS.general,
    sectionLabel: "General",
  },
  {
    id: SETTING_IDS.zoom,
    label: "Zoom Level",
    description: "Adjust the zoom level to make content easier to read",
    keywords: ["font size", "magnify", "scale", "accessibility", "zoom"],
    sectionId: SECTION_IDS.general,
    sectionLabel: "General",
  },
  {
    id: SETTING_IDS.language,
    label: "Language",
    description: "Choose your preferred display language",
    keywords: [
      "language",
      "locale",
      "korean",
      "english",
      "i18n",
      "한국어",
      "영어",
    ],
    sectionId: SECTION_IDS.general,
    sectionLabel: "General",
  },
  {
    id: SETTING_IDS.autoUpdate,
    label: "Auto Update",
    description: "Automatically update the app when new versions are available",
    keywords: ["update", "automatic", "version", "upgrade"],
    sectionId: SECTION_IDS.general,
    sectionLabel: "General",
  },

  {
    id: SETTING_IDS.runtimeMode,
    label: "Runtime Mode",
    description: "Configure Node runtime settings",
    keywords: ["node", "runtime", "bun", "environment"],
    sectionId: SECTION_IDS.general,
    sectionLabel: "General",
  },
  {
    id: SETTING_IDS.nodePath,
    label: "Node Path",
    description: "Set a custom Node.js installation path",
    keywords: ["node", "path", "nodejs", "binary", "executable"],
    sectionId: SECTION_IDS.general,
    sectionLabel: "General",
  },

  // Workflow Settings
  {
    id: SETTING_IDS.autoApprove,
    label: "Auto-approve",
    description: "Automatically approve code changes and run them",
    keywords: ["approve", "automatic", "code changes", "auto"],
    sectionId: SECTION_IDS.workflow,
    sectionLabel: "Workflow",
  },
  {
    id: SETTING_IDS.autoFix,
    label: "Auto Fix Problems",
    description: "Automatically fix TypeScript errors",
    keywords: ["fix", "typescript", "errors", "automatic", "problems", "auto"],
    sectionId: SECTION_IDS.workflow,
    sectionLabel: "Workflow",
  },
  {
    id: SETTING_IDS.autoExpandPreview,
    label: "Auto Expand Preview",
    description:
      "Automatically expand the preview panel when code changes are made",
    keywords: ["preview", "expand", "panel", "automatic", "auto"],
    sectionId: SECTION_IDS.workflow,
    sectionLabel: "Workflow",
  },
  {
    id: SETTING_IDS.chatCompletionNotification,
    label: "Chat Completion Notification",
    description:
      "Show a native notification when a chat response completes while the app is not focused",
    keywords: ["notification", "chat", "complete", "alert", "background"],
    sectionId: SECTION_IDS.workflow,
    sectionLabel: "Workflow",
  },

  // AI Settings
  {
    id: SETTING_IDS.thinkingBudget,
    label: "Thinking Budget",
    description: "Set the AI thinking token budget",
    keywords: ["thinking", "tokens", "budget", "reasoning", "ai"],
    sectionId: SECTION_IDS.ai,
    sectionLabel: "AI",
  },
  {
    id: SETTING_IDS.maxChatTurns,
    label: "Max Chat Turns",
    description: "Set the maximum number of conversation turns",
    keywords: ["turns", "max", "conversation", "limit", "chat"],
    sectionId: SECTION_IDS.ai,
    sectionLabel: "AI",
  },

  // Telemetry
  {
    id: SETTING_IDS.telemetry,
    label: "Telemetry",
    description: "Enable or disable anonymous usage data collection",
    keywords: [
      "telemetry",
      "analytics",
      "usage",
      "data",
      "privacy",
      "tracking",
    ],
    sectionId: SECTION_IDS.telemetry,
    sectionLabel: "Telemetry",
  },

  // Integrations
  {
    id: SETTING_IDS.github,
    label: "GitHub Integration",
    description: "Connect your GitHub account",
    keywords: ["github", "git", "integration", "connect", "account"],
    sectionId: SECTION_IDS.integrations,
    sectionLabel: "Integrations",
  },
  {
    id: SETTING_IDS.vercel,
    label: "Vercel Integration",
    description: "Connect your Vercel account for deployments",
    keywords: ["vercel", "deploy", "integration", "hosting", "connect"],
    sectionId: SECTION_IDS.integrations,
    sectionLabel: "Integrations",
  },
  {
    id: SETTING_IDS.supabase,
    label: "Supabase Integration",
    description: "Connect your Supabase project",
    keywords: [
      "supabase",
      "database",
      "integration",
      "backend",
      "connect",
      "postgres",
    ],
    sectionId: SECTION_IDS.integrations,
    sectionLabel: "Integrations",
  },

  // Tools (MCP)
  {
    id: SECTION_IDS.toolsMcp,
    label: "Tools (MCP)",
    description: "Configure MCP servers and environment variables",
    keywords: [
      "mcp",
      "tools",
      "server",
      "model context protocol",
      "environment",
    ],
    sectionId: SECTION_IDS.toolsMcp,
    sectionLabel: "Tools (MCP)",
  },

  // Experiments
  {
    id: SETTING_IDS.nativeGit,
    label: "Enable Native Git",
    description:
      "Use native Git for faster performance without external installation",
    keywords: ["git", "native", "experiment", "beta", "performance"],
    sectionId: SECTION_IDS.experiments,
    sectionLabel: "Experiments",
  },

  // Danger Zone
  {
    id: SETTING_IDS.reset,
    label: "Reset Everything",
    description:
      "Delete all apps, chats, and settings. This action cannot be undone.",
    keywords: ["reset", "delete", "clear", "wipe", "danger", "destructive"],
    sectionId: SECTION_IDS.dangerZone,
    sectionLabel: "Danger Zone",
  },
];
