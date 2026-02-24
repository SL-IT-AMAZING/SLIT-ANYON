# Native Agent Runtime — Execution Plan (v2.1, Momus-Revised)

## Executive Summary

Remove the opencode subprocess dependency and replace it with a native agent runtime inside the ANYON Electron app. The runtime replicates opencode's custom while-loop pattern: `streamText()` per iteration (no `maxSteps`), manual step counting, full session history re-read per turn, and MAX_STEPS prompt injection.

**Core principle**: Extend existing ANYON infrastructure (MCP consent, AgentPicker) where the patterns are compatible; build NEW components (AgentQuestionDialog) where existing UX is fundamentally incompatible.

**Scope**: Core agent loop, 14 native tools, system prompt porting, MCP tool adapter, token metering preservation.

**Excluded**: OMO multi-agent, browser automation, skill system.

---

## Revision Log

**v2 (Momus v1 review incorporated)**:
Replaced new consent/question IPC contracts → generalize existing `mcp_consent.ts` and `plan.ts` patterns
Added AgentPicker contract migration (was completely missing)
Added token/billing metering preservation (was completely missing)
Added `<opencode-tool>` tag emission timing protocol (running→completed)
Added tool abort propagation design
Added MCP vs native tool tag separation rules
Added context window management strategy
Added main.ts lifecycle hooks removal to cleanup
Added OpenCode settings UI removal
Phase 2 time estimate: 8h → 14h
Success criteria rewritten as per-phase testable assertions

**v2.1 (Momus v2 review — code-level mismatches fixed)**:
§0.3: Fixed consent function names: `waitForMcpConsent/resolveMcpConsent` → actual `waitForConsent/resolveConsent`
§0.3: Fixed consent channel names: `mcp:consent-request` → actual `mcp:tool-consent-request/mcp:tool-consent-response`
§0.3: Added native tool consent persistence design (new `nativeToolConsents` DB table)
§0.3: Added 60s consent timeout with auto-decline implementation design
§0.4/§5.2: Replaced `QuestionnaireInput` reuse claim → NEW `AgentQuestionDialog.tsx` (QuestionnaireInput sends chat text via `streamMessage()`, NOT structured IPC — fundamentally incompatible with blocking question tool)
§3.1: Fixed StreamBridge part types to match AI SDK v6 `TextStreamPart`: `part.text` (not `.textDelta`), `finish-step` (not `step-finish`), added `abort`/`error` handling
§5.3: Fixed file path `SettingsPage.tsx` → `settings.tsx`
§7.2: Fixed file path `AIPanel.tsx` → `src/components/settings/panels/AIPanel.tsx`
Tool count corrected: 15 → 14 throughout
§7 success criteria: Added concrete package size measurement (vendor/ = 165MB, binary = 107MB)

---

## Phase 0: Foundation — Types, Feature Flag, UX Generalization

**Goal**: Define runtime types, add feature flag, and generalize existing consent/question UX for native tool use.

**Duration**: ~4 hours | **Parallel with**: Nothing (baseline for all other phases)

### 0.1 Feature Flag

**File**: `src/lib/schemas.ts` (MODIFY)

Add `useNativeAgent: boolean` to `UserSettingsSchema` (default: `false`).

```ts
useNativeAgent: z.boolean().default(false),
```

**Important**: This field lives alongside the existing schema at ~line 260. No migration needed — Zod defaults handle missing values. The `openCodeConnectionMode` field (line ~245) stays until Phase 7.

### 0.2 Runtime Types

**File**: `src/agent/runtime/types.ts` (CREATE)

```ts
import { z } from "zod";
import type { LanguageModel, ToolSet } from "ai";

export interface AgentConfig {
  name: string;
  description: string;
  steps: number; // default Infinity
  tools: string[];
  mode: "primary" | "subagent" | "all";
  prompt?: string;
  temperature?: number;
  topP?: number;
  color?: string;
}

export interface ToolContext {
  sessionId: number;
  chatId: number;
  appPath: string;
  abort: AbortSignal;
  askConsent: (params: ConsentRequest) => Promise<boolean>;
  askQuestion: (params: QuestionRequest) => Promise<QuestionAnswer[]>;
  event: Electron.IpcMainInvokeEvent;
}

export interface ConsentRequest {
  toolName: string;
  toolDescription?: string;
  riskLevel: "safe" | "moderate" | "dangerous";
  inputPreview?: string;
}

export interface QuestionOption {
  label: string;
  description: string;
}

export interface QuestionItem {
  question: string;
  header: string;
  options: QuestionOption[];
  multiple?: boolean;
}

export interface QuestionRequest {
  questions: QuestionItem[];
}

export interface QuestionAnswer {
  question: string;
  selectedOptions: string[];
}

export interface StreamCallbacks {
  onTextDelta: (text: string) => void;
  onReasoningDelta: (text: string) => void;
  onToolCall: (toolName: string, toolCallId: string, input: unknown) => void;
  onToolResult: (toolName: string, toolCallId: string, output: string) => void;
  onToolError: (toolName: string, toolCallId: string, error: string) => void;
  onStepFinish: (usage: { inputTokens: number; outputTokens: number }) => void;
  onFinish: (totalUsage: { inputTokens: number; outputTokens: number }) => void;
  onError: (error: Error) => void;
}

export type LoopResult = "completed" | "aborted" | "max-steps";
```

### 0.3 Generalize Tool Consent — Extend MCP Consent Pattern

**Strategy**: Instead of creating a new `tool_consent.ts`, we **generalize the existing MCP consent system** (`src/ipc/utils/mcp_consent.ts` + `src/ipc/types/mcp.ts` + `src/components/McpConsentToast.tsx`) to support both MCP and native tools.

**File**: `src/ipc/utils/mcp_consent.ts` (MODIFY → rename to `tool_consent.ts`)

Current pattern (keep):

```ts
// Existing: Promise-based blocking with Map<string, resolver>
const pendingConsentResolvers = new Map<string, (d: ConsentDecision) => void>();
export function waitForConsent(requestId: string): Promise<ConsentDecision> { ... }    // actual name (NOT waitForMcpConsent)
export function resolveConsent(requestId: string, decision: ConsentDecision): void { ... } // actual name (NOT resolveMcpConsent)
```

The same `waitForConsent`/`resolveConsent` functions will be reused for native tools — the pending resolvers `Map<string, resolver>` is keyed by `requestId`, which is unique per request regardless of MCP vs native origin. No new functions needed for the blocking mechanism itself.

**File**: `src/db/schema.ts` (MODIFY) — Add native tool consent persistence table:

```ts
// NEW: Separate from mcpToolConsents (which is keyed by serverId + toolName)
export const nativeToolConsents = sqliteTable("native_tool_consents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  toolName: text("tool_name").notNull().unique(), // e.g. "file_write", "bash"
  consent: text("consent", { enum: ["accept-always", "decline"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
});
```

**File**: `src/agent/runtime/consent.ts` (CREATE) — Consent orchestrator for native tools:

```ts
import { waitForConsent, resolveConsent } from "@/ipc/utils/mcp_consent";
import { db } from "@/db";
import { nativeToolConsents } from "@/db/schema";
import { eq } from "drizzle-orm";

const CONSENT_TIMEOUT_MS = 60_000; // 60 seconds

// Wrap waitForConsent with timeout
export async function waitForConsentWithTimeout(
  requestId: string,
  timeoutMs = CONSENT_TIMEOUT_MS,
): Promise<ConsentDecision> {
  return Promise.race([
    waitForConsent(requestId),
    new Promise<ConsentDecision>((_, reject) =>
      setTimeout(() => reject(new Error("Consent timed out")), timeoutMs),
    ),
  ]);
}

// Full consent flow: check DB → skip if "accept-always" → else ask renderer
export async function requestNativeToolConsent({
  toolName,
  riskLevel,
  inputPreview,
  chatId,
  event,
}: NativeToolConsentParams): Promise<ConsentDecision> {
  // 1. Check DB for "accept-always"
  const stored = await db
    .select()
    .from(nativeToolConsents)
    .where(eq(nativeToolConsents.toolName, toolName))
    .get();
  if (stored?.consent === "accept-always") return "accept-once"; // auto-approve

  // 2. Send to renderer, block until response or timeout
  const requestId = crypto.randomUUID();
  event.sender.send("tool:consent-request", {
    requestId,
    toolName,
    riskLevel,
    inputPreview,
    chatId,
  });
  const decision = await waitForConsentWithTimeout(requestId);

  // 3. Persist "accept-always" if chosen
  if (decision === "accept-always") {
    await db
      .insert(nativeToolConsents)
      .values({ toolName, consent: "accept-always" })
      .onConflictDoUpdate({
        target: nativeToolConsents.toolName,
        set: { consent: "accept-always" },
      });
  }
  return decision;
}
```

**File**: `src/ipc/types/mcp.ts` (MODIFY)

Add native tool consent event alongside existing MCP consent event (actual channel: `mcp:tool-consent-request`):

```ts
// Existing: mcp:consent-request event
// NEW: Add native tool consent event using same schema pattern
nativeToolConsentRequest: defineEvent({
  channel: "tool:consent-request",
  payload: z.object({
    requestId: z.string(),
    toolName: z.string(),
    riskLevel: z.enum(["safe", "moderate", "dangerous"]),
    inputPreview: z.string().nullable().optional(),
    chatId: z.number(),
  }),
}),
```

Add response contract:

```ts
respondToNativeToolConsent: defineContract({
  channel: "tool:consent-response",
  input: z.object({
    requestId: z.string(),
    decision: z.enum(["accept-once", "accept-always", "decline"]),
  }),
  output: z.void(),
}),
```

### 0.4 Agent Question Tool — NEW AgentQuestionDialog (NOT QuestionnaireInput)

**Why QuestionnaireInput CANNOT be reused**:

- `QuestionnaireInput.tsx:150-153` calls `streamMessage({chatId, prompt: formattedResponses})` — sends TEXT INTO CHAT, NOT a structured IPC response back to main process
- `plan.ts` only has one-way `plan:questionnaire` event (main→renderer push), NO response contract exists
- `PlanQuestionnaireSchema` uses `{id, type: "text"|"radio"|"checkbox", question, options}` — incompatible with opencode's question tool format `{question, header, options: [{label, description}], multiple}`
- Retrofitting QuestionnaireInput would require gutting its core submission logic and schema — more work and risk than building fresh

**Strategy**: Create a NEW `AgentQuestionDialog` component and NEW agent-specific IPC contracts in a dedicated `agent.ts` types file. The question tool uses the same blocking Promise resolver pattern as consent (§0.3).

**File**: `src/ipc/types/agent.ts` (CREATE) — Agent-specific IPC contracts

```ts
import { z } from "zod";
import {
  defineEvent,
  defineContract,
  createClient,
  createEventClient,
} from "@/ipc/contracts/core";

// Agent question schema — matches opencode's question tool format
const AgentQuestionOptionSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
});

const AgentQuestionSchema = z.object({
  question: z.string(),
  header: z.string().max(30),
  options: z.array(AgentQuestionOptionSchema),
  multiple: z.boolean().optional().default(false),
});

// Events (main → renderer)
const agentEvents = {
  questionRequest: defineEvent({
    channel: "agent:question-request",
    payload: z.object({
      requestId: z.string(),
      chatId: z.number(),
      questions: z.array(AgentQuestionSchema),
    }),
  }),
};

// Contracts (renderer → main)
const agentContracts = {
  respondToQuestion: defineContract({
    channel: "agent:question-response",
    input: z.object({
      requestId: z.string(),
      // null = user cancelled or timed out
      answers: z.array(z.array(z.string())).nullable(),
    }),
    output: z.void(),
  }),
};

export const agentClient = createClient(agentContracts);
export const agentEventClient = createEventClient(agentEvents);
export {
  agentContracts,
  agentEvents,
  AgentQuestionSchema,
  AgentQuestionOptionSchema,
};
```

**File**: `src/agent/runtime/question.ts` (CREATE) — Blocking resolver with timeout

```ts
import { waitForConsent } from "@/ipc/utils/mcp_consent"; // Reuse same Map<string, resolver> pattern

const QUESTION_TIMEOUT_MS = 60_000; // 60 seconds
const pendingQuestionResolvers = new Map<
  string,
  (answers: string[][] | null) => void
>();

export function waitForAgentQuestion(
  requestId: string,
): Promise<string[][] | null> {
  return new Promise((resolve) => {
    pendingQuestionResolvers.set(requestId, resolve);
    // Auto-timeout: resolve with null after 60s
    setTimeout(() => {
      if (pendingQuestionResolvers.has(requestId)) {
        pendingQuestionResolvers.delete(requestId);
        resolve(null);
      }
    }, QUESTION_TIMEOUT_MS);
  });
}

export function resolveAgentQuestion(
  requestId: string,
  answers: string[][] | null,
): void {
  const resolver = pendingQuestionResolvers.get(requestId);
  if (resolver) {
    pendingQuestionResolvers.delete(requestId);
    resolver(answers);
  }
}
```

**File**: `src/ipc/handlers/agent_handlers.ts` (CREATE) — Handler for question response

```ts
import { createTypedHandler } from "@/ipc/handlers/base";
import { agentContracts } from "@/ipc/types/agent";
import { resolveAgentQuestion } from "@/agent/runtime/question";

export function registerAgentHandlers() {
  createTypedHandler(agentContracts.respondToQuestion, async ({ input }) => {
    resolveAgentQuestion(input.requestId, input.answers);
  });
}
```

### 0.5 Re-export from index

**File**: `src/ipc/types/index.ts` (MODIFY) — Add re-exports for new contracts/events added to `mcp.ts` and `plan.ts`.

### 0.6 AgentPicker Contract Migration

**Current state**: `AgentPicker.tsx:88-93` calls `languageModelClient.getOpenCodeAgents(appPath)` → IPC `get-opencode-agents` → handler fetches from OpenCode server `/agent` endpoint → returns `OpenCodeAgent[]`.

**Decision**: **Keep the same IPC contract** (`get-opencode-agents` channel, same output schema) but replace the handler implementation to return native agent definitions instead of fetching from OpenCode server.

**File**: `src/ipc/handlers/language_model_handlers.ts` (MODIFY, line 57-62)

Replace:

```ts
// OLD: Fetches from OpenCode subprocess HTTP API
return getOpenCodeAgents(params?.appPath);
```

With:

```ts
// NEW: Returns native agent definitions from agent_config.ts
import { getNativeAgents } from "@/agent/runtime/agent_config";
return getNativeAgents();
```

**Output schema (KEEP IDENTICAL)** — no AgentPicker UI changes needed:

```ts
z.array(
  z.object({
    name: z.string(),
    description: z.string(),
    mode: z.enum(["primary", "subagent", "all"]),
    native: z.boolean(), // Always true for native agents
    hidden: z.boolean().optional(),
    color: z.string().optional(),
    variant: z.string().optional(),
    model: z.object({ providerID: z.string(), modelID: z.string() }).optional(),
  }),
);
```

### 0.7 Token Metering Contract

**Current flow** (MUST preserve):

1. `chat_stream_handlers.ts:584` → `response.usage?.totalTokens`
2. `chat_stream_handlers.ts:586-595` → save `maxTokensUsed` to DB `messages` table
3. `chat_stream_handlers.ts:597-600` → `reportTokenUsage(totalTokens, modelId)` (fire-and-forget to Polar)
4. `entitlement.ts:641` → `getModelTier(modelId)` classifies light/pro
5. `entitlement.ts:644-651` → POST `{ rawTokens, modelId, tier }` to Polar endpoint

**For native runtime**: The `AgentRuntime` loop runs multiple `streamText()` iterations. Each iteration produces `response.usage`. The runtime must:

- **Aggregate** tokens across all iterations within one user message
- **Save** cumulative `maxTokensUsed` to the assistant message in DB
- **Report** cumulative tokens via `reportTokenUsage()` after loop completes

No new IPC contracts needed — this uses existing `entitlement.ts` functions directly in main process.

### Verification (Phase 0)

- [ ] `npm run ts` passes with new types and modified contracts
- [ ] Feature flag defaults to `false` — zero behavioral change
- [ ] Consent event channels auto-derive into preload allowlist
- [ ] Agent question event channels auto-derive into preload allowlist
- [ ] `AgentPicker` contract output schema unchanged (diff: zero)

---

## Phase 1: System Prompts

**Goal**: Port opencode's system prompts with branding replacement.

**Duration**: ~2 hours | **Parallel with**: Phase 0 (no dependency)

### 1.1 Prompt Text Files

**Directory**: `src/prompts/agent/` (CREATE directory)

Port opencode prompt files, replacing "opencode"/"OpenCode" → "anyon"/"Anyon":

| Source file           | Target file           | Key changes                             |
| --------------------- | --------------------- | --------------------------------------- |
| `anthropic.txt`       | `anthropic.txt`       | "OpenCode" → "Anyon", URLs → anyon docs |
| `beast.txt`           | `beast.txt`           | "opencode" → "anyon"                    |
| `gemini.txt`          | `gemini.txt`          | "opencode" → "anyon"                    |
| `qwen.txt`            | `qwen.txt`            | "opencode" → "anyon", URLs              |
| `codex_header.txt`    | `codex.txt`           | "OpenCode" → "Anyon"                    |
| `anthropic_spoof.txt` | `anthropic_spoof.txt` | Keep "Claude Code" spoof as-is          |
| `max-steps.txt`       | `max-steps.txt`       | Copy verbatim                           |
| `explore.txt`         | `explore.txt`         | Copy verbatim                           |
| `compaction.txt`      | `compaction.txt`      | Copy verbatim                           |
| `title.txt`           | `title.txt`           | Copy verbatim                           |
| `summary.txt`         | `summary.txt`         | Copy verbatim                           |

### 1.2 System Prompt Assembly

**File**: `src/agent/runtime/system_prompt.ts` (CREATE)

```ts
export interface SystemPromptInput {
  modelProvider: string;
  modelId: string;
  agentConfig: AgentConfig;
  appPath: string;
  customRules?: string;
  themePrompt?: string;
  supabaseContext?: string;
  anyonMcpPrompt?: string;
}

export function assembleSystemPrompt(input: SystemPromptInput): string[] { ... }
export function selectProviderPrompt(modelProvider: string, modelId: string): string { ... }
export function buildEnvironmentBlock(appPath: string): string { ... }
```

### Verification (Phase 1)

- [ ] All `.txt` files have zero occurrences of "opencode" (case-insensitive, except "Claude Code" spoof)
- [ ] Unit test: `assembleSystemPrompt()` returns correct prompt for each provider (anthropic, gemini, qwen, gpt)
- [ ] Unit test: `selectProviderPrompt()` selects anthropic_spoof for claude models

---

## Phase 2: Native Tools

**Goal**: Implement all tools the agent can call, with abort propagation and tag emission protocol.

**Duration**: ~14 hours | **Parallel with**: Phase 1 (tools depend on Phase 0 types only)

### 2.0 Tool Interface & Registry

**File**: `src/agent/runtime/tool_interface.ts` (CREATE)

```ts
export type RiskLevel = "safe" | "moderate" | "dangerous";

export interface NativeTool<TInput = any> {
  id: string;
  description: string;
  parameters: z.ZodType<TInput>;
  riskLevel: RiskLevel;
  execute: (input: TInput, ctx: ToolContext) => Promise<string>;
}
```

**File**: `src/agent/runtime/tool_registry.ts` (CREATE)

```ts
export class ToolRegistry {
  private tools = new Map<string, NativeTool>();
  register(t: NativeTool): void { ... }
  resolveTools(toolIds: string[], ctx: ToolContext): ToolSet { ... }
  private wrapWithConsent(t: NativeTool, ctx: ToolContext): (...) => Promise<string> { ... }
}
```

**Consent wrapping**: For `riskLevel: "dangerous"` tools, `wrapWithConsent()` calls `ctx.askConsent()` before executing. For `"safe"` tools, execute directly. For `"moderate"`, check user preference (auto-approve or ask).

### 2.1 Tool Abort Propagation Design

**Requirement**: All tools must respect `ctx.abort: AbortSignal` for clean cancellation.

| Tool              | Abort mechanism                               |
| ----------------- | --------------------------------------------- |
| `bash`            | `child_process.kill(pid)` on abort signal     |
| `webfetch`        | Pass `signal` to `fetch()` options            |
| `websearch`       | Pass `signal` to Exa API fetch                |
| `codesearch`      | Pass `signal` to Exa API fetch                |
| `read/write/edit` | Check `abort.aborted` before I/O              |
| `glob/grep/list`  | Pass abort to child process (ripgrep)         |
| `apply_patch`     | Check `abort.aborted` between file operations |
| `question`        | Resolve with `null` on abort                  |

Pattern:

```ts
execute: async (input, ctx) => {
  if (ctx.abort.aborted) throw new Error("Tool execution aborted");
  // ... tool logic with signal propagation
};
```

### 2.2 `<opencode-tool>` Tag Emission Protocol

**StreamBridge** (Phase 3) must emit tags matching the existing renderer's dedup rules.

**Renderer dedup rule** (`AnyonMarkdownParser.tsx:314-338`): Parser tracks all `<opencode-tool>` tags by `toolid`. When multiple tags share the same `toolid`, it **keeps the LAST occurrence**. This enables streaming updates: emit `running` first, then `completed`/`error` with same `toolid` to replace it.

**Emission protocol per tool call**:

1. **On tool-call start** (AI SDK `tool-call` stream part):

   ```xml
   <opencode-tool name="bash" status="running" title="Running command" toolid="call_abc123"></opencode-tool>
   ```

2. **On tool-result** (AI SDK `tool-result` stream part):

   ```xml
   <opencode-tool name="bash" status="completed" title="Ran: ls -la" toolid="call_abc123">OUTPUT_HERE</opencode-tool>
   ```

3. **On tool-error** (execution throws):
   ```xml
   <opencode-tool name="bash" status="error" title="Command failed" toolid="call_abc123">ERROR_MESSAGE</opencode-tool>
   ```

**Critical rules**:

- `toolid` = AI SDK's `toolCallId` (globally unique per call)
- Double-quote all attributes
- XML-escape `<>&"` in attributes, `<>&` in content body
- Always close tag (parser auto-closes during streaming, but final output must be well-formed)

### 2.3 MCP vs Native Tool Tag Separation

**MCP tools** (called via `McpManager`): Continue using existing tags:

```xml
<anyon-mcp-tool-call server="SERVER" tool="TOOL">JSON_ARGS</anyon-mcp-tool-call>
<anyon-mcp-tool-result server="SERVER" tool="TOOL">OUTPUT</anyon-mcp-tool-result>
```

**Native tools** (read/write/bash/etc.): Use `<opencode-tool>` tags (per §2.2).

**Rule**: The MCP adapter (§2.9) wraps MCP tools as AI SDK tools, but StreamBridge checks `tool.source === "mcp"` and emits `<anyon-mcp-tool-call/result>` tags instead of `<opencode-tool>` tags.

### 2.4 File System Tools (safe)

| File                              | Tool ID | Risk |
| --------------------------------- | ------- | ---- |
| `src/agent/runtime/tools/read.ts` | `read`  | safe |
| `src/agent/runtime/tools/glob.ts` | `glob`  | safe |
| `src/agent/runtime/tools/grep.ts` | `grep`  | safe |
| `src/agent/runtime/tools/list.ts` | `list`  | safe |

### 2.5 File Mutation Tools (dangerous)

| File                                     | Tool ID       | Risk      |
| ---------------------------------------- | ------------- | --------- |
| `src/agent/runtime/tools/write.ts`       | `write`       | dangerous |
| `src/agent/runtime/tools/edit.ts`        | `edit`        | dangerous |
| `src/agent/runtime/tools/apply_patch.ts` | `apply_patch` | dangerous |

**File**: `src/agent/runtime/tools/patch_parser.ts` (CREATE) — Ported from opencode's `src/patch/index.ts` (680-line, 4-pass fuzzy matching).

### 2.6 Shell Tool (dangerous)

| File                              | Tool ID | Risk      |
| --------------------------------- | ------- | --------- |
| `src/agent/runtime/tools/bash.ts` | `bash`  | dangerous |

Must propagate `ctx.abort` → `child_process.kill()`.

### 2.7 Todo Tools (safe)

| File                                   | Tool ID     | Risk |
| -------------------------------------- | ----------- | ---- |
| `src/agent/runtime/tools/todoread.ts`  | `todoread`  | safe |
| `src/agent/runtime/tools/todowrite.ts` | `todowrite` | safe |

### 2.8 Web Tools (moderate)

| File                                    | Tool ID      | Risk     |
| --------------------------------------- | ------------ | -------- |
| `src/agent/runtime/tools/websearch.ts`  | `websearch`  | moderate |
| `src/agent/runtime/tools/webfetch.ts`   | `webfetch`   | moderate |
| `src/agent/runtime/tools/codesearch.ts` | `codesearch` | moderate |

**New dependency**: `turndown` (HTML→Markdown for webfetch).

### 2.9 Question Tool (safe)

| File                                  | Tool ID    | Risk |
| ------------------------------------- | ---------- | ---- |
| `src/agent/runtime/tools/question.ts` | `question` | safe |

Uses agent question IPC round-trip from Phase 0.4 (`src/ipc/types/agent.ts` contracts + `AgentQuestionDialog` UI). Blocks via `waitForAgentQuestion()` (60s timeout, auto-resolves with `null` on timeout/cancel).

### 2.10 MCP Tool Adapter

**File**: `src/agent/runtime/tools/mcp_adapter.ts` (CREATE)

Wraps `McpManager.callTool()` as AI SDK tools. Each MCP tool gets a `source: "mcp"` marker so StreamBridge emits correct tags.

### 2.11 Existing Anyon Tools Integration

**File**: `src/agent/runtime/tools/anyon_tools_adapter.ts` (CREATE)

Wraps existing 6 Anyon tools from `src/agent/tools/`.

### 2.12 AI SDK `tool-error` Handling

**Issue** (Momus): Current codebase doesn't handle `tool-error` stream parts (`chat_stream_handlers.ts:142-159` only handles `text-delta`, `tool-call`, `tool-result`, `reasoning`).

**Solution**: StreamBridge must handle `tool-error` part type from `fullStream`:

```ts
case "tool-error": {
  const { toolCallId, toolName, error } = part;
  callbacks.onToolError(toolName, toolCallId, error.message);
  // Emit <opencode-tool status="error" ...>
  break;
}
```

### Verification (Phase 2)

- [ ] Each tool has a unit test for happy path + abort behavior
- [ ] `apply_patch` tested with 4-pass fuzzy matching (port opencode test cases)
- [ ] `bash` tool tested with abort → child process killed
- [ ] `question` tool tested with mock IPC round-trip
- [ ] All tools registered in `ToolRegistry`
- [ ] `npm run ts` — zero type errors in tool files

---

## Phase 3: Agent Runtime Core

**Goal**: Implement the custom while-loop agent runtime with context window management.

**Duration**: ~6 hours | **Depends on**: Phase 0 (types), Phase 2 (tools)

### 3.1 StreamBridge

**File**: `src/agent/runtime/stream_bridge.ts` (CREATE)

Converts AI SDK `fullStream` parts into callbacks + XML tag content:

```ts
export class StreamBridge {
  constructor(
    private callbacks: StreamCallbacks,
    private mcpToolIds: Set<string>,
  ) {}

  async processStream(
    fullStream: AsyncIterable<TextStreamPart<ToolSet>>,
    abort: AbortSignal,
  ): Promise<{
    finishReason: string;
    usage: { inputTokens: number; outputTokens: number };
  }> {
    for await (const part of fullStream) {
      if (abort.aborted) break;
      switch (part.type) {
        case "text-delta":
          callbacks.onTextDelta(part.text);
          break;
        case "reasoning-delta":
          callbacks.onReasoningDelta(part.text);
          break;
        case "tool-call":
          /* emit running tag */ break;
        case "tool-result":
          /* emit completed tag */ break;
        case "tool-error":
          /* emit error tag */ break;
        case "finish-step":
          /* aggregate usage: part.usage */ break;
        case "finish":
          /* return final usage: part.totalUsage */ break;
        case "abort":
          /* handle abort */ break;
        case "error":
          /* handle error: part.error */ break;
      }
    }
  }
}
```

**MCP tool detection**: If `toolCallId` is in `mcpToolIds` set, emit `<anyon-mcp-tool-call/result>` instead of `<opencode-tool>`.

### 3.2 AgentRuntime — The Core Loop

**File**: `src/agent/runtime/agent_runtime.ts` (CREATE)

```ts
export class AgentRuntime {
  private step = 0;
  private abortController: AbortController;
  private cumulativeTokens = { input: 0, output: 0 };

  constructor(private params: AgentRuntimeParams) { ... }

  async loop(): Promise<LoopResult> {
    while (true) {
      // 1. Re-read ALL session messages from DB
      const dbMessages = await this.loadMessages();

      // 2. Check exit: if last assistant finishReason != "tool-calls" AND step > 0 → done
      if (this.step > 0 && !this.lastFinishedWithToolCalls(dbMessages)) {
        return "completed";
      }

      // 3. Convert to AI SDK messages with context window management
      const messages = this.convertWithContextLimit(dbMessages);

      // 4. step++; isLastStep = step >= agent.steps
      this.step++;
      const isLastStep = this.step >= this.params.agentConfig.steps;

      // 5. Resolve tools (empty if isLastStep)
      const tools = isLastStep ? {} : this.registry.resolveTools(...);

      // 6. If isLastStep: inject MAX_STEPS assistant prefill
      if (isLastStep) {
        messages.push({ role: "assistant", content: MAX_STEPS_PROMPT });
      }

      // 7. streamText({model, system, messages, tools})
      const result = streamText({
        model: this.params.model,
        system: this.params.systemPrompt,
        messages,
        tools,
        abortSignal: this.abortController.signal,
      });

      // 8. Process stream via StreamBridge
      const { finishReason, usage } = await this.bridge.processStream(
        result.fullStream, this.abortController.signal,
      );

      // 9. Aggregate tokens
      this.cumulativeTokens.input += usage.inputTokens;
      this.cumulativeTokens.output += usage.outputTokens;

      // 10. Save assistant message + tool results to DB
      await this.saveResponse(result);

      // 11. If finishReason != "tool-calls" → done
      if (finishReason !== "tool-calls") {
        return isLastStep ? "max-steps" : "completed";
      }

      // 12. If aborted → return
      if (this.abortController.signal.aborted) return "aborted";
    }
  }

  getCumulativeTokens() { return this.cumulativeTokens; }
  abort(): void { this.abortController.abort(); }
}
```

### 3.3 Context Window Management

**Problem** (Momus): Full DB message reload every iteration risks token explosion.

**Strategy**: `convertWithContextLimit()` applies a message budget:

1. **Always include**: System prompt (counted separately by AI SDK) + first user message + last 2 turns
2. **Budget**: Check model's context window (from provider config). Reserve 30% for output + tool overhead.
3. **Truncation**: If message token estimate exceeds budget:
   - Drop oldest middle messages (keep first + last N)
   - Insert `[earlier messages truncated]` system message at truncation point
4. **Token estimation**: Use `tiktoken` rough estimate (4 chars ≈ 1 token) — good enough for budgeting.

**Related setting**: `src/lib/schemas.ts:291` has existing context-related fields that can be used.

### 3.4 Message Conversion

**File**: `src/agent/runtime/message_converter.ts` (CREATE)

Converts ANYON DB messages ↔ AI SDK `CoreMessage[]`.

**Key mapping**:

- DB `role: "user"` → `{ role: "user", content: string }`
- DB `role: "assistant"` with tool calls → `{ role: "assistant", content: [TextPart, ToolCallPart[]] }`
- DB tool results → `{ role: "tool", content: [ToolResultPart[]] }`

### Verification (Phase 3)

- [ ] Unit: loop exits after `finishReason !== "tool-calls"`
- [ ] Unit: step counter increments, MAX_STEPS injected at limit
- [ ] Unit: abort mid-stream → returns "aborted"
- [ ] Unit: context window truncation keeps first + last messages
- [ ] Unit: token aggregation accumulates across iterations
- [ ] Integration: mock model + real `read` tool → full loop completes

---

## Phase 4: Integration

**Goal**: Wire AgentRuntime into chat handlers, replace AgentPicker handler, preserve billing.

**Duration**: ~5 hours | **Depends on**: Phase 0–3

### 4.1 Model Client Routing

**File**: `src/ipc/utils/get_model_client.ts` (MODIFY)

Current: Forces OpenCode for all non-`IS_TEST_BUILD` runs (line 25-58).

Change: When `useNativeAgent: true`, call `getModelClientUpstream()` directly (returns AI SDK `LanguageModel`). When `false`, keep OpenCode path.

```ts
if (settings.useNativeAgent) {
  return getModelClientUpstream(model, settings);
} else {
  return getOpenCodeModelClient(model, settings); // existing path
}
```

### 4.2 Chat Stream Handler — Native Agent Path

**File**: `src/ipc/handlers/chat_stream_handlers.ts` (MODIFY)

Add `isNativeAgentMode` branch alongside existing `isOpenCodeMode`:

```ts
if (isNativeAgentMode) {
  // 1. Get model client via upstream provider
  const { modelClient } = await getModelClientUpstream(model, settings);

  // 2. Assemble system prompt
  const systemPrompt = assembleSystemPrompt({...});

  // 3. Build tool registry + context
  const registry = createToolRegistry();
  const toolCtx = buildToolContext(event, sessionId, chatId, appPath, abortController);

  // 4. Create StreamCallbacks wired to:
  //    - DB writes (same as existing processStreamChunks)
  //    - Renderer chunk emission (same SSE events)
  const callbacks = createStreamCallbacks(event, chatId, assistantMessageId);

  // 5. Run AgentRuntime.loop()
  const runtime = new AgentRuntime({model: modelClient, systemPrompt, registry, toolCtx, callbacks, agentConfig});
  activeRuntimes.set(chatId, runtime);
  const result = await runtime.loop();
  activeRuntimes.delete(chatId);

  // 6. Token metering (CRITICAL — preserves billing)
  const tokens = runtime.getCumulativeTokens();
  const totalTokens = tokens.input + tokens.output;
  if (totalTokens > 0) {
    await db.update(messages).set({ maxTokensUsed: totalTokens }).where(eq(messages.id, assistantMessageId));
    void reportTokenUsage(totalTokens, settings.selectedModel.name);
  }

  // 7. Post-response: git commit, summary extraction (same as existing)
}
```

### 4.3 AgentPicker Handler Replacement

**File**: `src/ipc/handlers/language_model_handlers.ts` (MODIFY, line 57-62)

```ts
handle("get-opencode-agents", async (event, params) => {
  const settings = await getUserSettings();
  if (settings.useNativeAgent) {
    return getNativeAgents(); // From agent_config.ts
  }
  return getOpenCodeAgents(params?.appPath); // Existing path (fallback during transition)
});
```

### 4.4 Cancel Handler Update

**File**: `src/ipc/handlers/chat_stream_handlers.ts` (MODIFY)

```ts
const activeRuntimes = new Map<number, AgentRuntime>();

// In cancel handler:
const runtime = activeRuntimes.get(chatId);
if (runtime) runtime.abort();
```

### 4.5 Consent & Question Handler Registration

**File**: `src/ipc/ipc_host.ts` (MODIFY)

Register handlers for:

- `tool:consent-response` → calls `resolveNativeToolConsent()`
- `agent:question-response` → calls `resolveAgentQuestion()`

### 4.6 Agent Configuration

**File**: `src/agent/runtime/agent_config.ts` (CREATE)

```ts
const NATIVE_AGENTS: AgentConfig[] = [
  {
    name: "Sisyphus",
    description: "Full-featured coding agent",
    steps: Infinity,
    tools: [
      "read",
      "write",
      "edit",
      "bash",
      "glob",
      "grep",
      "list",
      "todoread",
      "todowrite",
      "websearch",
      "webfetch",
      "codesearch",
      "apply_patch",
      "question",
    ],
    mode: "primary",
    color: "#...",
  },
  {
    name: "Hephaestus",
    description: "Code-focused builder",
    steps: Infinity,
    tools: [
      "read",
      "write",
      "edit",
      "bash",
      "glob",
      "grep",
      "list",
      "apply_patch",
    ],
    mode: "primary",
  },
  {
    name: "Atlas",
    description: "Read-only explorer",
    steps: 20,
    tools: ["read", "glob", "grep", "list", "bash", "todoread", "todowrite"],
    mode: "primary",
  },
];

export function getNativeAgents(): OpenCodeAgent[] {
  // Map AgentConfig[] → OpenCodeAgent[] schema (same shape as get-opencode-agents output)
  return NATIVE_AGENTS.filter((a) => a.mode !== "subagent").map((a) => ({
    name: a.name,
    description: a.description,
    mode: a.mode,
    native: true,
    color: a.color,
  }));
}
```

### Verification (Phase 4)

- [ ] Feature flag `false` → opencode path executes (zero regression)
- [ ] Feature flag `true` → native runtime executes
- [ ] AgentPicker shows native agents when flag is on
- [ ] Token usage saved to DB after native runtime loop
- [ ] `reportTokenUsage()` called with correct cumulative tokens
- [ ] Cancel → runtime aborts, partial response saved
- [ ] E2E: send chat with native flag → receive streamed response with tool calls

---

## Phase 5: Renderer UI Updates

**Goal**: Generalize existing UX components for native tool consent and question tool. Clean up OpenCode-specific UI.

**Duration**: ~3 hours | **Parallel with**: Phase 4

### 5.1 Generalize McpConsentToast → Support Native Tools

**File**: `src/components/McpConsentToast.tsx` (MODIFY → consider rename to `ToolConsentToast.tsx`)

Current: Renders MCP-specific consent toast with server name.

Change: Accept a `source` prop (`"mcp"` | `"native"`) to adjust display:

- MCP: "Server X wants to run tool Y" (existing)
- Native: "Agent wants to run {toolName}" with risk badge

**File**: `src/renderer.tsx` or equivalent (MODIFY)

Add event listener for `tool:consent-request` alongside existing `mcp:consent-request`:

```ts
ipc.events.onNativeToolConsentRequest((payload) => {
  showToolConsentToast({
    source: "native",
    requestId: payload.requestId,
    toolName: payload.toolName,
    riskLevel: payload.riskLevel,
    inputPreview: payload.inputPreview,
  });
});
```

### 5.2 AgentQuestionDialog — New Component

**File**: `src/components/chat/AgentQuestionDialog.tsx` (CREATE)

**Why NOT reuse QuestionnaireInput** (see §0.4 for full rationale):

- `QuestionnaireInput` sends TEXT into chat via `streamMessage()`, NOT structured IPC
- Different schema: plan uses `{id, type, question}`, agent uses `{question, header, options: [{label, description}], multiple}`
- No blocking IPC round-trip exists in plan questionnaire

**Component design**:

```tsx
// State: Jotai atom for pending question
export const pendingAgentQuestionAtom = atom<{
  requestId: string;
  chatId: number;
  questions: AgentQuestion[];
} | null>(null);

// Component: Renders as modal/dialog when atom is non-null
export function AgentQuestionDialog() {
  const [pending, setPending] = useAtom(pendingAgentQuestionAtom);
  if (!pending) return null;

  const handleSubmit = (answers: string[][]) => {
    agentClient.respondToQuestion({ requestId: pending.requestId, answers });
    setPending(null);
  };

  const handleCancel = () => {
    agentClient.respondToQuestion({
      requestId: pending.requestId,
      answers: null,
    });
    setPending(null);
  };

  // Auto-dismiss after 60s
  useEffect(() => {
    const timer = setTimeout(handleCancel, 60_000);
    return () => clearTimeout(timer);
  }, [pending.requestId]);

  return (
    <Dialog open onClose={handleCancel}>
      {pending.questions.map((q, i) => (
        <QuestionBlock key={i} question={q} />
        // Each QuestionBlock: shows header, question text, selectable options (label + description)
        // If q.multiple: checkbox selection; else: radio selection
      ))}
      <Button onClick={() => handleSubmit(selectedAnswers)}>Submit</Button>
      <Button variant="ghost" onClick={handleCancel}>
        Cancel
      </Button>
    </Dialog>
  );
}
```

**File**: `src/renderer.tsx` (MODIFY) — Add event listener for agent questions:

```tsx
import { agentEventClient } from "@/ipc/types/agent";
import { pendingAgentQuestionAtom } from "@/components/chat/AgentQuestionDialog";
import { getDefaultStore } from "jotai";

// In renderer setup:
agentEventClient.onQuestionRequest((payload) => {
  getDefaultStore().set(pendingAgentQuestionAtom, payload);
});
```

### 5.3 Feature Flag Toggle in Settings

**File**: `src/pages/settings.tsx` (MODIFY)

Add toggle for `useNativeAgent` in the AI/Agent section.

### 5.4 OpenCode Settings UI Removal (Conditional)

**Files to modify** (only when feature flag is `true`, full removal in Phase 7):

- `src/components/OpenCodeConnectionModeSelector.tsx` — Hide when `useNativeAgent`
- `src/pages/settings.tsx:27,372` — Conditionally hide OpenCode connection mode section

### Verification (Phase 5)

- [ ] Native tool consent toast appears for `dangerous` tools
- [ ] "Accept always" persists across tool calls in same session
- [ ] Agent question dialog renders options correctly with custom + multiple selection
- [ ] OpenCode settings hidden when native agent flag is on
- [ ] Consent timeout (60s) → auto-decline

---

## Phase 6: Testing & Parity

**Goal**: Verify functional parity with opencode path.

**Duration**: ~4 hours | **Depends on**: Phase 4 + 5

### 6.1 Unit Tests

| Test file                   | Coverage                                                   |
| --------------------------- | ---------------------------------------------------------- |
| `agent_runtime.test.ts`     | Loop, steps, MAX_STEPS injection, abort, token aggregation |
| `stream_bridge.test.ts`     | All stream part types → correct callbacks + XML tags       |
| `tool_registry.test.ts`     | Resolution, consent wrapping, abort propagation            |
| `message_converter.test.ts` | DB ↔ CoreMessage, context window truncation                |
| `patch_parser.test.ts`      | 4-pass fuzzy matching (ported opencode test cases)         |
| `system_prompt.test.ts`     | Provider selection, branding, env block                    |
| `agent_config.test.ts`      | getNativeAgents() matches expected schema                  |

### 6.2 E2E Tests

**File**: `e2e-tests/native-agent.spec.ts` (CREATE)

One broad E2E test:

1. Enable native agent flag in settings
2. Send a chat message that triggers tool use
3. Verify streamed response appears with tool cards
4. Verify tool consent dialog for dangerous tools
5. Verify response completes

**Note**: Must run `npm run build` before E2E tests. Existing `e2e-tests/local_agent_consent.spec.ts` can serve as reference.

### Verification (Phase 6)

- [ ] `npm run test` — all unit tests pass
- [ ] `npm run build && PLAYWRIGHT_HTML_OPEN=never npm run e2e` — all E2E pass
- [ ] `npm run ts` — zero type errors
- [ ] `npm run lint` — zero lint errors

---

## Phase 7: Cleanup — Remove OpenCode Dependency

**Goal**: Remove all opencode subprocess code, settings, and lifecycle hooks.

**Duration**: ~3 hours | **Depends on**: Phase 6 green

### 7.1 Files to Delete

| File                                                | Lines | Purpose                       |
| --------------------------------------------------- | ----- | ----------------------------- |
| `src/ipc/utils/opencode_server.ts`                  | 704   | Subprocess manager            |
| `src/ipc/utils/opencode_provider.ts`                | 1074  | HTTP/SSE → AI SDK translation |
| `src/ipc/utils/opencode_api.ts`                     | 109   | HTTP client for OpenCode API  |
| `src/ipc/utils/opencode_config_setup.ts`            | ~100  | OMO config setup              |
| `src/ipc/utils/opencode_startup.ts`                 | ~50   | Startup handling              |
| `src/ipc/utils/vendor_binary_utils.ts`              | ~80   | Binary path resolution        |
| `src/opencode/tool_gateway.ts`                      | 214   | HTTP tool server              |
| `src/opencode/mcp/mcp_server_script.ts`             | ~100  | MCP server script             |
| `scripts/fetch-vendor-binaries.ts`                  | ~200  | Binary fetcher                |
| `src/components/OpenCodeConnectionModeSelector.tsx` | ~50   | Settings UI component         |

### 7.2 Files to Modify

| File                                                | Changes                                                |
| --------------------------------------------------- | ------------------------------------------------------ |
| `src/main.ts:83`                                    | Remove `resolveVendorBinaries()` call                  |
| `src/main.ts:185-188`                               | Remove OpenCode server startup hook                    |
| `src/main.ts:669-689`                               | Remove OpenCode server shutdown/cleanup in `will-quit` |
| `src/ipc/utils/get_model_client.ts`                 | Remove OpenCode path — always use upstream             |
| `src/ipc/handlers/chat_stream_handlers.ts`          | Remove `isOpenCodeMode` branch entirely                |
| `src/ipc/handlers/language_model_handlers.ts:57-62` | Remove OpenCode API fallback in AgentPicker handler    |
| `src/lib/schemas.ts:245-248`                        | Remove `openCodeConnectionMode` field                  |
| `src/lib/schemas.ts`                                | Remove `useNativeAgent` flag (always native now)       |
| `src/pages/settings.tsx:27,372`                     | Remove OpenCode connection mode references             |
| `src/components/settings/panels/AIPanel.tsx`        | Remove conditional                                     |
| `package.json`                                      | Remove `fetch-vendor` script                           |
| `forge.config.ts`                                   | Remove vendor binary bundling                          |

### 7.3 Import Cleanup

After deletion, run `npm run ts` to find all broken imports. Fix each one:

- Remove dead imports to deleted files
- Remove conditional code paths that checked for OpenCode mode

### Verification (Phase 7)

- [ ] `npm run ts` — zero type errors
- [ ] `grep -r "opencode" src/` — zero references (except intentional like "Anyon" branding in prompts)
- [ ] `grep -r "vendor_binary" src/` — zero references
- [ ] No imports reference deleted files
- [ ] `npm run build` succeeds without vendor binaries
- [ ] App starts without OpenCode subprocess
- [ ] `npm run build && PLAYWRIGHT_HTML_OPEN=never npm run e2e` — all E2E pass
- [ ] App package size reduced (vendor/ = 165MB, opencode binary = 107MB → removed)

---

## Dependency Graph

```
Phase 0 (Foundation — Types, Flag, UX Generalization)
  |
  |-- Phase 1 (System Prompts)     ← parallel with Phase 2
  |-- Phase 2 (Native Tools)       ← parallel with Phase 1
  |
  +-- Phase 3 (Agent Runtime Core) ← depends on Phase 0 + 2
        |
        |-- Phase 4 (Integration)  ← depends on Phase 0-3
        |     |
        |     +-- Phase 5 (Renderer UI) ← parallel with Phase 4 (needs Phase 0 types)
        |
        +-- Phase 6 (Testing)     ← depends on Phase 4 + 5
              |
              +-- Phase 7 (Cleanup) ← depends on Phase 6 green
```

## Total Estimated Duration

| Phase                   | Hours    | Change from v1                                       | Parallel?                  |
| ----------------------- | -------- | ---------------------------------------------------- | -------------------------- |
| Phase 0: Foundation     | 4h       | +1h (UX generalization, AgentPicker, metering)       | Baseline                   |
| Phase 1: System Prompts | 2h       | —                                                    | Parallel with Phase 2      |
| Phase 2: Native Tools   | 14h      | +6h (abort, tag protocol, tool-error, reality)       | Parallel with Phase 1      |
| Phase 3: Runtime Core   | 6h       | — (context mgmt added but offset by clearer spec)    | After Phase 0+2            |
| Phase 4: Integration    | 5h       | +1h (AgentPicker, metering, routing)                 | After Phase 3              |
| Phase 5: Renderer UI    | 3h       | — (generalize not new-build, but also cleanup)       | Parallel with Phase 4      |
| Phase 6: Testing        | 4h       | —                                                    | After Phase 4+5            |
| Phase 7: Cleanup        | 3h       | +1h (main.ts hooks, settings, thorough verification) | After Phase 6              |
| **Critical path**       | **~36h** | +13h vs v1                                           | With parallelism: **~28h** |

## New npm Dependencies

| Package    | Purpose                                      |
| ---------- | -------------------------------------------- |
| `turndown` | HTML → Markdown (webfetch tool)              |
| `diff`     | Unified diff generation (apply_patch output) |

## Risks & Mitigations

| Risk                                      | Severity   | Mitigation                                                                                                                                |
| ----------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| AI SDK v6 streamText behavior differences | High       | Same pattern as opencode. Test with Claude first. `tool-error` part explicitly handled.                                                   |
| Patch parser edge cases                   | Medium     | Port opencode's test suite. 4-pass fuzzy matching tested.                                                                                 |
| Exa AI endpoint changes                   | Medium     | Abstract behind interface. Fallback message.                                                                                              |
| Tool consent UI blocks agent              | Medium     | 60s timeout. Auto-decline on timeout.                                                                                                     |
| DB/AI SDK message format mismatch         | High       | Extensive unit tests for message_converter.                                                                                               |
| **`<opencode-tool>` tag timing/dedup**    | **High**   | **Strict emission protocol (§2.2): unique toolid per call, running→completed update. Parser dedup keeps LAST per toolid.**                |
| **Tool abort propagation failure**        | **Medium** | **Each tool has explicit abort mechanism (§2.1). bash → kill(pid), fetch → signal, IO → check aborted.**                                  |
| **Token metering regression**             | **High**   | **AgentRuntime aggregates tokens per iteration. Integration (§4.2) saves to DB + reports to Polar. Unit test verifies cumulative count.** |
| **MCP vs native tool tag overlap**        | **Medium** | **Clear separation (§2.3): MCP tools → `<anyon-mcp-*>` tags, native tools → `<opencode-tool>` tags. StreamBridge checks tool source.**    |
| Token explosion from history              | Medium     | Context window management (§3.3): message budgeting, middle truncation, 30% output reserve.                                               |
| Two code paths during transition          | Low        | Feature flag for instant rollback. Phase 7 removes dual paths.                                                                            |

## Success Criteria (Per-Phase, Testable)

### Phase 0

- `npm run ts` passes
- Feature flag in schema defaults to `false`
- New consent/question events appear in preload channel allowlist

### Phase 1

- `grep -ri "opencode" src/prompts/agent/` returns zero (except Claude Code spoof)
- `assembleSystemPrompt()` unit test passes for all 4 providers

### Phase 2

- All 14 tool unit tests pass
- `apply_patch` passes ported fuzzy-matching test suite
- `bash` abort test: child process killed within 1s

### Phase 3

- Loop test: mock model returning tool-calls → continues; returning stop → exits
- MAX_STEPS test: at step limit, tools empty + assistant prefill injected
- Context truncation test: 1000-message history → stays within budget

### Phase 4

- `AgentPicker` displays native agents when flag=true (same UI, different data source)
- Token usage: DB `maxTokensUsed` matches sum of iteration usages
- `reportTokenUsage()` called exactly once per user message with cumulative total
- Cancel: partial response saved, runtime stops within 2s

### Phase 5

- Consent toast appears for `dangerous` native tool calls
- `AgentQuestionDialog` renders and responds via blocking IPC round-trip (60s timeout)
- OpenCode settings hidden when native agent flag is on

### Phase 6

- `npm run test` — all pass
- `npm run build && PLAYWRIGHT_HTML_OPEN=never npm run e2e` — all pass
- `npm run ts && npm run lint` — zero errors

### Phase 7

- `grep -r "opencode_server\|opencode_provider\|opencode_api\|vendor_binary" src/` → zero
- App starts, no subprocess spawned
- `npm run build` package size < previous (no bundled binaries)
- All E2E tests pass on clean build

---

## Git Workflow

### Branch Strategy

```
dev (base)
 └── feature/native-agent-runtime (작업 브랜치)
      ├── Phase 0~2 커밋들
      ├── Phase 3~5 커밋들
      ├── Phase 6 (테스트)
      └── Phase 7 (클린업) → dev로 머지
```

### Step-by-Step

#### 1. 브랜치 생성

```bash
git checkout dev
git pull origin dev
git checkout -b feature/native-agent-runtime
```

#### 2. Phase별 커밋 전략

각 Phase 완료 시 커밋. 커밋 단위:

| Phase | 커밋 메시지 패턴                                        | 예시                                          |
| ----- | ------------------------------------------------------- | --------------------------------------------- |
| 0     | `feat: add native agent foundation`                     | types, feature flag, consent generalization   |
| 1     | `feat: port system prompts from opencode`               | prompt templates, branding swap               |
| 2     | `feat: implement native tools (N/14)`                   | 도구별 또는 카테고리별 분할 커밋 가능         |
| 3     | `feat: add agent runtime core`                          | AgentRuntime, StreamBridge, message converter |
| 4     | `feat: integrate native agent into chat handlers`       | chat_stream_handlers wiring                   |
| 5     | `feat: add agent consent toast and question dialog`     | UI components                                 |
| 6     | `test: add native agent unit and e2e tests`             | 테스트만                                      |
| 7     | `chore: remove opencode subprocess and vendor binaries` | 삭제 + 클린업                                 |

#### 3. Phase별 검증 게이트

각 Phase 커밋 전 반드시 통과:

```bash
npm run fmt          # 포매팅
npm run lint         # 린트 (실패 시 npm run lint:fix)
npm run ts           # 타입체크
```

Phase 6 완료 후 전체 테스트:

```bash
npm run test                                    # unit tests
npm run build                                   # 빌드 (E2E 테스트 전 필수)
PLAYWRIGHT_HTML_OPEN=never npm run e2e           # E2E tests
```

#### 4. dev 머지 조건 (ALL must pass)

다음 조건 전부 충족 시에만 dev로 머지:

- [ ] `npm run fmt` — 포매팅 클린
- [ ] `npm run lint` — 에러 0개
- [ ] `npm run ts` — 타입 에러 0개
- [ ] `npm run test` — unit 테스트 전체 통과
- [ ] `npm run build` — 빌드 성공
- [ ] `PLAYWRIGHT_HTML_OPEN=never npm run e2e` — E2E 전체 통과
- [ ] opencode 서브프로세스 코드 완전 삭제 확인
- [ ] 앱 실행 시 서브프로세스 미생성 확인

#### 5. dev 머지 실행

```bash
git checkout dev
git pull origin dev
git merge feature/native-agent-runtime --no-ff -m "feat: replace opencode subprocess with native agent runtime"
git push origin dev
```

#### 6. 머지 후 정리

```bash
git branch -d feature/native-agent-runtime       # 로컬 브랜치 삭제
git push origin --delete feature/native-agent-runtime  # 원격 브랜치 삭제 (선택)
```
