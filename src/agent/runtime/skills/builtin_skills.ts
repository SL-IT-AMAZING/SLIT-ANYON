import type { Skill } from "./types";

export const BUILTIN_SKILLS: Skill[] = [
  {
    name: "playwright",
    description:
      "MUST USE for any browser-related tasks. Browser automation via Playwright MCP - verification, browsing, information gathering, web scraping, testing, screenshots, and all browser interactions.",
    content:
      "Use Playwright MCP for browser automation. This skill provides tools for navigating websites, taking screenshots, clicking elements, filling forms, and extracting data from web pages.",
    scope: "builtin",
    mcp: {
      name: "playwright",
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-playwright"],
    },
  },
  {
    name: "dev-browser",
    description:
      "Browser automation with persistent page state. Use when users ask to navigate websites, fill forms, take screenshots, extract web data, test web apps, or automate browser workflows.",
    content:
      "Use the dev-browser skill for persistent browser automation. This provides a browser session that maintains state across interactions.",
    scope: "builtin",
    mcp: {
      name: "dev-browser",
      command: "npx",
      args: ["-y", "@anthropic-ai/mcp-playwright"],
    },
  },
  {
    name: "frontend-ui-ux",
    description:
      "Designer-turned-developer who crafts stunning UI/UX even without design mockups",
    content:
      "You are a designer-turned-developer. When building UI, prioritize visual quality, spacing, contrast, and user experience. Use modern CSS patterns, thoughtful animations, and accessible color palettes. Think like a designer first, engineer second.",
    scope: "builtin",
  },
  {
    name: "git-master",
    description:
      "Git expert for atomic commits, rebasing, and history management",
    content:
      "You are an expert in Git workflows. Create atomic, well-described commits. Use conventional commit messages. Know when to rebase vs merge. Handle complex history operations with care.",
    scope: "builtin",
  },
];
