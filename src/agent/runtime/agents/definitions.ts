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
    promptMetadata: {
      category: "specialist",
      cost: "EXPENSIVE",
      triggers: [
        {
          domain: "Primary orchestration",
          trigger: "Complex multi-step autonomous tasks requiring full lifecycle execution",
        },
      ],
    },
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
    promptMetadata: {
      category: "specialist",
      cost: "CHEAP",
      triggers: [
        {
          domain: "Implementation",
          trigger: "Direct task execution",
        },
      ],
    },
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
    promptMetadata: {
      category: "advisor",
      cost: "EXPENSIVE",
      promptAlias: "Oracle",
      triggers: [
        {
          domain: "Architecture decisions",
          trigger: "Multi-system tradeoffs, unfamiliar patterns",
        },
        {
          domain: "Self-review",
          trigger: "After completing significant implementation",
        },
        {
          domain: "Hard debugging",
          trigger: "After 2+ failed fix attempts",
        },
      ],
      useWhen: [
        "Complex architecture design",
        "After completing significant work",
        "2+ failed fix attempts",
        "Unfamiliar code patterns",
        "Security/performance concerns",
        "Multi-system tradeoffs",
      ],
      avoidWhen: [
        "Simple file operations (use direct tools)",
        "First attempt at any fix (try yourself first)",
        "Questions answerable from code you've read",
        "Trivial decisions (variable names, formatting)",
        "Things you can infer from existing code patterns",
      ],
    },
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
    promptMetadata: {
      category: "exploration",
      cost: "CHEAP",
      promptAlias: "Librarian",
      keyTrigger: "External library/source mentioned → fire `librarian` background",
      triggers: [
        {
          domain: "Librarian",
          trigger: "Unfamiliar packages / libraries",
        },
      ],
      useWhen: [
        "How do I use [library]?",
        "What's the best practice for [framework feature]?",
        "Why does [external dependency] behave this way?",
        "Find examples of [library] usage",
      ],
    },
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
    promptMetadata: {
      category: "exploration",
      cost: "FREE",
      promptAlias: "Explore",
      keyTrigger: "2+ modules involved → fire `explore` background",
      triggers: [
        {
          domain: "Explore",
          trigger: "Find existing codebase structure, patterns and styles",
        },
      ],
      useWhen: [
        "Multiple search angles needed",
        "Unfamiliar module structure",
        "Cross-layer pattern discovery",
      ],
      avoidWhen: [
        "You know exactly what to search",
        "Single keyword/pattern suffices",
        "Known file location",
      ],
    },
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
    promptMetadata: {
      category: "advisor",
      cost: "EXPENSIVE",
      triggers: [
        {
          domain: "Strategic planning",
          trigger: "Creating comprehensive work plans",
        },
      ],
    },
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
    promptMetadata: {
      category: "advisor",
      cost: "EXPENSIVE",
      triggers: [
        {
          domain: "Pre-planning",
          trigger: "Complex task requiring scope clarification",
        },
      ],
    },
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
    promptMetadata: {
      category: "advisor",
      cost: "EXPENSIVE",
      triggers: [
        {
          domain: "Plan review",
          trigger: "Evaluate work plans for clarity and completeness",
        },
      ],
    },
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
    promptMetadata: {
      category: "specialist",
      cost: "EXPENSIVE",
      triggers: [
        {
          domain: "Orchestration",
          trigger: "Complex multi-step autonomous tasks",
        },
      ],
    },
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
    promptMetadata: {
      category: "specialist",
      cost: "CHEAP",
      triggers: [
        {
          domain: "Frontend",
          trigger: "UI/UX components, styling",
        },
      ],
    },
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
    promptMetadata: {
      category: "utility",
      cost: "CHEAP",
      triggers: [
        {
          domain: "Visual analysis",
          trigger: "Screenshots, diagrams, images",
        },
      ],
    },
    temperature: 0,
  },
];
