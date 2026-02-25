import type { OmoAgentDefinition } from "./types";

// Standard tool sets
const CORE_TOOLS = [
  "read",
  "write",
  "edit",
  "glob",
  "grep",
  "bash",
  "list",
  "todoread",
  "todowrite",
  "websearch",
  "webfetch",
  "codesearch",
  "apply_patch",
  "question",
];

const OMO_TOOLS = [
  "mcp_task",
  "mcp_call_agent",
  "mcp_background_output",
  "mcp_background_cancel",
  "mcp_skill",
  "mcp_skill_mcp",
  "mcp_slashcommand",
  "mcp_interactive_bash",
  "mcp_ast_grep_search",
  "mcp_ast_grep_replace",
  "mcp_lsp_goto_definition",
  "mcp_lsp_find_references",
  "mcp_lsp_symbols",
  "mcp_lsp_diagnostics",
  "mcp_lsp_prepare_rename",
  "mcp_lsp_rename",
  "mcp_look_at",
  "mcp_session_list",
  "mcp_session_read",
  "mcp_session_search",
  "mcp_session_info",
];

const ALL_TOOLS = [...CORE_TOOLS, ...OMO_TOOLS];

// LSP tools shared by code-aware subagents
const LSP_TOOLS = [
  "mcp_ast_grep_search",
  "mcp_ast_grep_replace",
  "mcp_lsp_goto_definition",
  "mcp_lsp_find_references",
  "mcp_lsp_symbols",
  "mcp_lsp_diagnostics",
  "mcp_lsp_prepare_rename",
  "mcp_lsp_rename",
];

// Read-only LSP tools (no rename, no ast replace)
const LSP_READONLY_TOOLS = [
  "mcp_lsp_goto_definition",
  "mcp_lsp_find_references",
  "mcp_lsp_symbols",
  "mcp_lsp_diagnostics",
];

export const OMO_AGENTS: OmoAgentDefinition[] = [
  {
    name: "sisyphus",
    description:
      "Powerful AI Agent with orchestration capabilities. Delegates work, tracks progress, verifies results.",
    model: { provider: "anthropic", modelId: "claude-opus-4-6" },
    systemPromptFile: "sisyphus.txt",
    tools: ALL_TOOLS,
    mode: "primary",
    cost: "expensive",
    temperature: 0,
    thinking: { enabled: true, budgetTokens: 10000 },
  },
  {
    name: "sisyphus-junior",
    description:
      "Focused execution agent. Direct task implementation without orchestration overhead.",
    model: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
    systemPromptFile: "sisyphus-junior.txt",
    tools: [...CORE_TOOLS, ...LSP_TOOLS],
    mode: "subagent",
    cost: "moderate",
    temperature: 0,
  },
  {
    name: "oracle",
    description:
      "Architecture and debugging consultant. Read-only, high-quality reasoning.",
    model: { provider: "anthropic", modelId: "claude-opus-4-6" },
    systemPromptFile: "oracle.txt",
    tools: [
      "read",
      "glob",
      "grep",
      "list",
      "codesearch",
      ...LSP_READONLY_TOOLS,
    ],
    mode: "subagent",
    cost: "expensive",
    temperature: 0,
    thinking: { enabled: true, budgetTokens: 15000 },
  },
  {
    name: "librarian",
    description:
      "Documentation and research specialist. Finds docs, understands code, retrieves examples.",
    model: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
    systemPromptFile: "librarian.txt",
    tools: [
      "read",
      "glob",
      "grep",
      "list",
      "codesearch",
      "websearch",
      "webfetch",
    ],
    mode: "subagent",
    cost: "moderate",
    temperature: 0,
  },
  {
    name: "explore",
    description: "Fast codebase search agent. Quick file/pattern searches.",
    model: { provider: "anthropic", modelId: "claude-haiku-4-5" },
    systemPromptFile: "explore.txt",
    tools: ["read", "glob", "grep", "list", "codesearch"],
    mode: "subagent",
    cost: "free",
    temperature: 0,
  },
  {
    name: "prometheus",
    description:
      "Strategic planning agent. Creates comprehensive implementation plans.",
    model: { provider: "anthropic", modelId: "claude-opus-4-6" },
    systemPromptFile: "prometheus.txt",
    tools: ["read", "glob", "grep", "list", "codesearch", "write", "edit"],
    mode: "subagent",
    cost: "expensive",
    temperature: 0,
    thinking: { enabled: true, budgetTokens: 10000 },
  },
  {
    name: "metis",
    description:
      "Pre-planning consultant. Analyzes requests for hidden requirements and ambiguities.",
    model: { provider: "anthropic", modelId: "claude-opus-4-6" },
    systemPromptFile: "metis.txt",
    tools: ["read", "glob", "grep", "list", "codesearch"],
    mode: "subagent",
    cost: "expensive",
    temperature: 0,
    thinking: { enabled: true, budgetTokens: 8000 },
  },
  {
    name: "momus",
    description:
      "Expert reviewer. Evaluates plans for clarity, verifiability, and completeness.",
    model: { provider: "anthropic", modelId: "claude-opus-4-6" },
    systemPromptFile: "momus.txt",
    tools: ["read", "glob", "grep", "list", "codesearch"],
    mode: "subagent",
    cost: "expensive",
    temperature: 0,
    thinking: { enabled: true, budgetTokens: 8000 },
  },
  {
    name: "atlas",
    description:
      "Read-only analysis agent. Deep code understanding without modifications.",
    model: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
    systemPromptFile: "atlas.txt",
    tools: [
      "read",
      "glob",
      "grep",
      "list",
      "codesearch",
      ...LSP_READONLY_TOOLS,
    ],
    mode: "subagent",
    cost: "moderate",
    temperature: 0,
  },
  {
    name: "hephaestus",
    description:
      "Code generation specialist. Focused on high-quality code output.",
    model: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
    systemPromptFile: "hephaestus.txt",
    tools: [...CORE_TOOLS, ...LSP_TOOLS],
    mode: "subagent",
    cost: "expensive",
    temperature: 0,
  },
  {
    name: "multimodal-looker",
    description:
      "Visual analysis agent. Screenshots, diagrams, media file interpretation.",
    model: { provider: "anthropic", modelId: "claude-sonnet-4-6" },
    systemPromptFile: "multimodal-looker.txt",
    tools: ["read", "glob", "grep", "list", "mcp_look_at"],
    mode: "subagent",
    cost: "moderate",
    temperature: 0,
  },
];
