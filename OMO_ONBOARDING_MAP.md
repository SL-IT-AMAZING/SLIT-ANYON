# OH-MY-OPENCODE ONBOARDING & PLAN-BASED MODEL CONFIGURATION MAP

## COMPLETE ONBOARDING FLOW

### INSTALLATION ENTRY POINT

- **File**: `src/cli/install.ts`
- **Function**: `install(args: InstallArgs)`
- **Two modes**:
  1. **TUI Mode** (Interactive): `runTuiMode(detected)`
  2. **Non-TUI Mode** (CLI args): `runNonTuiInstall(args)`

---

## EXACT QUESTIONS ASKED IN TUI MODE

### Question 1: Claude Subscription

**Location**: `src/cli/install.ts:178-186`

```typescript
const claude = await p.select({
  message: "Do you have a Claude Pro/Max subscription?",
  options: [
    {
      value: "no" as const,
      label: "No",
      hint: "Will use opencode/glm-4.7-free as fallback",
    },
    {
      value: "yes" as const,
      label: "Yes (standard)",
      hint: "Claude Opus 4.5 for orchestration",
    },
    {
      value: "max20" as const,
      label: "Yes (max20 mode)",
      hint: "Full power with Claude Sonnet 4.5 for Librarian",
    },
  ],
  initialValue: initial.claude,
});
```

**Possible Answers**: `"no"` | `"yes"` | `"max20"`

**Type Definition**: `ClaudeSubscription = "no" | "yes" | "max20"`

---

### Question 2: OpenAI/ChatGPT Subscription

**Location**: `src/cli/install.ts:193-200`

```typescript
const openai = await p.select({
  message: "Do you have an OpenAI/ChatGPT Plus subscription?",
  options: [
    {
      value: "no" as const,
      label: "No",
      hint: "Oracle will use fallback models",
    },
    {
      value: "yes" as const,
      label: "Yes",
      hint: "GPT-5.2 for Oracle (high-IQ debugging)",
    },
  ],
  initialValue: initial.openai,
});
```

**Possible Answers**: `"no"` | `"yes"`

---

### Question 3: Google Gemini Integration

**Location**: `src/cli/install.ts:207-214`

```typescript
const gemini = await p.select({
  message: "Will you integrate Google Gemini?",
  options: [
    {
      value: "no" as const,
      label: "No",
      hint: "Frontend/docs agents will use fallback",
    },
    {
      value: "yes" as const,
      label: "Yes",
      hint: "Beautiful UI generation with Gemini 3 Pro",
    },
  ],
  initialValue: initial.gemini,
});
```

**Possible Answers**: `"no"` | `"yes"`

---

### Question 4: GitHub Copilot Subscription

**Location**: `src/cli/install.ts:221-228`

```typescript
const copilot = await p.select({
  message: "Do you have a GitHub Copilot subscription?",
  options: [
    {
      value: "no" as const,
      label: "No",
      hint: "Only native providers will be used",
    },
    {
      value: "yes" as const,
      label: "Yes",
      hint: "Fallback option when native providers unavailable",
    },
  ],
  initialValue: initial.copilot,
});
```

**Possible Answers**: `"no"` | `"yes"`

---

### Question 5: OpenCode Zen Models

**Location**: `src/cli/install.ts:235-242`

```typescript
const opencodeZen = await p.select({
  message: "Do you have access to OpenCode Zen (opencode/ models)?",
  options: [
    {
      value: "no" as const,
      label: "No",
      hint: "Will use other configured providers",
    },
    {
      value: "yes" as const,
      label: "Yes",
      hint: "opencode/claude-opus-4-5, opencode/gpt-5.2, etc.",
    },
  ],
  initialValue: initial.opencodeZen,
});
```

**Possible Answers**: `"no"` | `"yes"`

---

### Question 6: Z.ai Coding Plan Subscription

**Location**: `src/cli/install.ts:249-256`

```typescript
const zaiCodingPlan = await p.select({
  message: "Do you have a Z.ai Coding Plan subscription?",
  options: [
    {
      value: "no" as const,
      label: "No",
      hint: "Will use other configured providers",
    },
    {
      value: "yes" as const,
      label: "Yes",
      hint: "zai-coding-plan/glm-4.7 for Librarian",
    },
  ],
  initialValue: initial.zaiCodingPlan,
});
```

**Possible Answers**: `"no"` | `"yes"`

---

## PLAN TIER SYSTEM - THE CORE DIFFERENTIATOR

### Plan Classification

**Type**: `ClaudeSubscription = "no" | "yes" | "max20"`

**Location**: `src/cli/types.ts:1`

There are **3 tiers**:

| Tier | Code      | Name                    | Cost     | Focus                          |
| ---- | --------- | ----------------------- | -------- | ------------------------------ |
| 0    | `"no"`    | **No Claude**           | $0       | Fallback-only mode             |
| 1    | `"yes"`   | **Claude Pro/Standard** | ~$20/mo  | Cost-efficient orchestration   |
| 2    | `"max20"` | **Claude Max**          | ~$200/mo | Full power with premium models |

---

## MODEL ASSIGNMENT LOGIC - THE DIFFERENTIATOR

### File: `src/cli/model-fallback.ts`

### Key Function: `resolveClaudeCapability()`

**Location**: `src/cli/model-fallback.ts:184-186`

```typescript
function resolveClaudeCapability(avail: ProviderAvailability): ModelCapability {
  return avail.isMaxPlan ? "unspecified-high" : "unspecified-low";
}
```

**This is THE pivot point**:

- **Max Plan (`isMaxPlan: true`)** → `"unspecified-high"` capability
- **Standard Plan (`isMaxPlan: false`)** → `"unspecified-low"` capability

---

### Model Capability Levels

**Location**: `src/cli/model-fallback.ts:5-13`

```typescript
type ModelCapability =
  | "unspecified-high" // Claude Max: Opus
  | "unspecified-low" // Claude Pro: Sonnet
  | "quick" // Haiku
  | "ultrabrain" // GPT-5.2-codex
  | "visual-engineering" // Gemini 3 Pro
  | "artistry" // Gemini 3 Pro
  | "writing" // Gemini 3 Flash
  | "glm"; // OpenCode GLM free
```

---

### Fallback Chains - How Models Are Selected

**Location**: `src/cli/model-fallback.ts:49-86`

#### For "unspecified-high" (Max Plan users):

```typescript
"unspecified-high": [
  { provider: "claude", model: "anthropic/claude-opus-4-5" },           // 🏆 Best
  { provider: "openai", model: "openai/gpt-5.2" },                      // Fallback 1
  { provider: "gemini", model: "google/gemini-3-pro-preview" },         // Fallback 2
]
```

#### For "unspecified-low" (Standard Plan users):

```typescript
"unspecified-low": [
  { provider: "claude", model: "anthropic/claude-sonnet-4-5" },         // 🏆 Cost-efficient
  { provider: "openai", model: "openai/gpt-5.2" },                      // Fallback 1
  { provider: "gemini", model: "google/gemini-3-flash-preview" },       // Fallback 2
]
```

#### For "quick":

```typescript
"quick": [
  { provider: "claude", model: "anthropic/claude-haiku-4-5" },
  { provider: "openai", model: "openai/gpt-5.1-codex-mini" },
  { provider: "gemini", model: "google/gemini-3-flash-preview" },
]
```

#### For "ultrabrain":

```typescript
"ultrabrain": [
  { provider: "openai", model: "openai/gpt-5.2-codex" },     // Prioritize for high-IQ debugging
  { provider: "claude", model: "anthropic/claude-opus-4-5" },
  { provider: "gemini", model: "google/gemini-3-pro-preview" },
]
```

---

## AGENT-TO-MODEL MAPPING

### File: `src/cli/model-fallback.ts:117-127`

**Agent Capability Requirements**:

```typescript
const AGENT_REQUIREMENTS: Record<string, AgentRequirement> = {
  Sisyphus: { capability: "unspecified-high" }, // 👑 Orchestrator
  oracle: { capability: "ultrabrain", variant: "high" }, // 🧠 High-IQ debugging
  librarian: { capability: "glm" }, // 📚 Documentation
  explore: { capability: "quick" }, // ⚡ Fast search
  "multimodal-looker": { capability: "visual-engineering" }, // 🎨 Visual analysis
  "Prometheus (Planner)": { capability: "unspecified-high" }, // 📋 Planning
  "Metis (Plan Consultant)": { capability: "unspecified-high" }, // 🤔 Review
  "Momus (Plan Reviewer)": { capability: "ultrabrain", variant: "medium" }, // 👁️ Critique
  Atlas: { capability: "unspecified-high" }, // 🗺️ Coordination
};
```

---

## EXACT MODEL DIFFERENCES BY PLAN

### Sisyphus Agent (Primary Orchestrator)

**Location**: `src/cli/config-manager.test.ts:225-242`

#### Max Plan (`isMax20: true`)

```typescript
// CLAUDE MAX: Uses Opus (most powerful)
agents["Sisyphus"].model = "anthropic/claude-opus-4-5";
```

**Test**:

```typescript
test("generates native opus models when Claude max20 subscription", () => {
  const config = {
    hasClaude: true,
    isMax20: true, // ← THE DIFFERENTIATOR
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
  };
  const result = generateOmoConfig(config);
  expect(result.agents.Sisyphus.model).toBe("anthropic/claude-opus-4-5");
});
```

#### Standard Plan (`isMax20: false`)

```typescript
// CLAUDE PRO: Uses Sonnet (cost-efficient)
agents["Sisyphus"].model = "anthropic/claude-sonnet-4-5";
```

**Test**:

```typescript
test("generates native sonnet models when Claude standard subscription", () => {
  const config = {
    hasClaude: true,
    isMax20: false, // ← THE DIFFERENTIATOR
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
  };
  const result = generateOmoConfig(config);
  expect(result.agents.Sisyphus.model).toBe("anthropic/claude-sonnet-4-5");
});
```

---

### Explore Agent (Fast Search)

**Special Logic**: Max Plan users get Haiku (uses Claude quota), others get grok-code

**Location**: `src/cli/model-fallback.ts:218-223`

```typescript
} else if (role === "explore") {
  if (avail.native.claude && avail.isMaxPlan) {
    agents[role] = { model: "anthropic/claude-haiku-4-5" }  // ← Max20 only
  } else {
    agents[role] = { model: "opencode/grok-code" }           // ← Standard preserves Claude quota
  }
}
```

**Tests**:

```typescript
test("uses haiku for explore when Claude max20", () => {
  const config = { hasClaude: true, isMax20: true, ... }
  const result = generateOmoConfig(config)
  expect(result.agents.explore.model).toBe("anthropic/claude-haiku-4-5")
})

test("uses grok-code for explore when not max20", () => {
  const config = { hasClaude: true, isMax20: false, ... }  // ← Standard
  const result = generateOmoConfig(config)
  expect(result.agents.explore.model).toBe("opencode/grok-code")
})
```

---

### Librarian Agent (Documentation)

**Special Logic**: If Z.ai is available, always uses Z.ai regardless of plan

**Location**: `src/cli/model-fallback.ts:216-217`

```typescript
if (role === "librarian" && avail.zai) {
  agents[role] = { model: "zai-coding-plan/glm-4.7" }; // ← Z.ai override
}
```

**Test**:

```typescript
test("uses zai-coding-plan/glm-4.7 for librarian when Z.ai available", () => {
  const config = {
    hasClaude: true,
    isMax20: true,  // ← Plan doesn't matter
    hasZaiCodingPlan: true,  // ← This overrides
    ...
  }
  const result = generateOmoConfig(config)
  expect(result.agents.librarian.model).toBe("zai-coding-plan/glm-4.7")
})
```

---

## CATEGORY MODEL ASSIGNMENTS

**Location**: `src/cli/model-fallback.ts:134-142`

```typescript
const CATEGORY_REQUIREMENTS: Record<string, CategoryRequirement> = {
  "visual-engineering": { capability: "visual-engineering" },
  ultrabrain: { capability: "ultrabrain" },
  artistry: { capability: "artistry", variant: "max" },
  quick: { capability: "quick" },
  "unspecified-low": { capability: "unspecified-low" }, // ← Standard plan
  "unspecified-high": { capability: "unspecified-high" }, // ← Max plan
  writing: { capability: "writing" },
};
```

**Flow for each category**:

1. If capability is `"unspecified-high"` or `"unspecified-low"`, resolve via `resolveClaudeCapability()` (uses `isMaxPlan`)
2. Otherwise, use capability directly
3. Find first available model from fallback chain
4. If no native provider available, check OpenCode Zen → GitHub Copilot → Z.ai → Ultimate fallback

---

## FALLBACK RESOLUTION LOGIC

**Location**: `src/cli/model-fallback.ts:161-182`

```typescript
function resolveModel(
  capability: ModelCapability,
  avail: ProviderAvailability,
): string {
  // 1. Try native providers in priority order
  const nativeChain = NATIVE_FALLBACK_CHAINS[capability];
  for (const entry of nativeChain) {
    if (avail.native[entry.provider]) {
      return entry.model; // ← Return first available native provider
    }
  }

  // 2. If no native, try OpenCode Zen
  if (avail.opencodeZen) {
    return OPENCODE_ZEN_MODELS[capability];
  }

  // 3. Then GitHub Copilot
  if (avail.copilot) {
    return GITHUB_COPILOT_MODELS[capability];
  }

  // 4. Then Z.ai
  if (avail.zai) {
    return ZAI_MODEL; // Always "zai-coding-plan/glm-4.7"
  }

  // 5. Ultimate fallback
  return ULTIMATE_FALLBACK; // "opencode/glm-4.7-free"
}
```

---

## PROVIDER AVAILABILITY STRUCTURE

**Location**: `src/cli/model-fallback.ts:15-25`

```typescript
interface ProviderAvailability {
  native: {
    claude: boolean; // ← From config.hasClaude
    openai: boolean; // ← From config.hasOpenAI
    gemini: boolean; // ← From config.hasGemini
  };
  opencodeZen: boolean; // ← From config.hasOpencodeZen
  copilot: boolean; // ← From config.hasCopilot
  zai: boolean; // ← From config.hasZaiCodingPlan
  isMaxPlan: boolean; // ← From config.isMax20 ⭐ THE CRITICAL FLAG
}
```

---

## CONFIGURATION FLOW DIAGRAM

```
┌─────────────────────────────────────┐
│   TUI Onboarding Questions          │
│  (6 subscription/provider questions)│
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  InstallConfig (TUI answers)        │
│  ├─ hasClaude: boolean              │
│  ├─ isMax20: boolean ⭐ CRITICAL    │
│  ├─ hasOpenAI: boolean              │
│  ├─ hasGemini: boolean              │
│  ├─ hasCopilot: boolean             │
│  ├─ hasOpencodeZen: boolean         │
│  └─ hasZaiCodingPlan: boolean       │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  generateModelConfig()              │
│  ├─ Convert to ProviderAvailability │
│  ├─ For each Agent:                 │
│  │  └─ Resolve capability           │
│  │     (may use isMaxPlan)          │
│  ├─ For each Category:              │
│  │  └─ Resolve capability           │
│  │     (may use isMaxPlan)          │
│  └─ Generate model assignments      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  GeneratedOmoConfig                 │
│  {                                  │
│    $schema: "...",                  │
│    agents: {                        │
│      "Sisyphus": {                  │
│        model: "anthropic/claude..." │
│      },                             │
│      ...                            │
│    },                               │
│    categories: { ... }              │
│  }                                  │
└─────────────────────────────────────┘
```

---

## ULTIMATE FALLBACK CHAIN

**Location**: `src/cli/model-fallback.ts:144`

```typescript
const ULTIMATE_FALLBACK = "opencode/glm-4.7-free";
```

When user has NO providers selected:

```typescript
if (!hasAnyProvider) {
  return {
    $schema: SCHEMA_URL,
    agents: Object.fromEntries(
      Object.keys(AGENT_REQUIREMENTS).map((role) => [
        role,
        { model: ULTIMATE_FALLBACK },
      ]),
    ),
    categories: Object.fromEntries(
      Object.keys(CATEGORY_REQUIREMENTS).map((cat) => [
        cat,
        { model: ULTIMATE_FALLBACK },
      ]),
    ),
  };
}
```

All agents and categories get: `"opencode/glm-4.7-free"`

---

## ACTUAL MODEL VALUES - COMPLETE TABLE

### When Max Plan (`isMax20: true`, `hasClaude: true`)

| Agent/Category          | Model                                                          |
| ----------------------- | -------------------------------------------------------------- |
| Sisyphus                | `anthropic/claude-opus-4-5`                                    |
| oracle                  | `openai/gpt-5.2-codex`                                         |
| librarian               | `opencode/glm-4.7-free` (or `zai-coding-plan/glm-4.7` if Z.ai) |
| explore                 | `anthropic/claude-haiku-4-5`                                   |
| multimodal-looker       | `google/gemini-3-pro-preview`                                  |
| Prometheus (Planner)    | `anthropic/claude-opus-4-5`                                    |
| Metis (Plan Consultant) | `anthropic/claude-opus-4-5`                                    |
| Momus (Plan Reviewer)   | `openai/gpt-5.2-codex`                                         |
| Atlas                   | `anthropic/claude-opus-4-5`                                    |
| **unspecified-high**    | `anthropic/claude-opus-4-5`                                    |
| **unspecified-low**     | `anthropic/claude-sonnet-4-5`                                  |
| **quick**               | `anthropic/claude-haiku-4-5`                                   |
| **ultrabrain**          | `openai/gpt-5.2-codex`                                         |
| **visual-engineering**  | `google/gemini-3-pro-preview`                                  |
| **artistry**            | `google/gemini-3-pro-preview`                                  |
| **writing**             | `google/gemini-3-flash-preview`                                |

### When Standard Plan (`isMax20: false`, `hasClaude: true`)

| Agent/Category          | Model                                                          |
| ----------------------- | -------------------------------------------------------------- |
| Sisyphus                | `anthropic/claude-sonnet-4-5` ← Different!                     |
| oracle                  | `openai/gpt-5.2-codex`                                         |
| librarian               | `opencode/glm-4.7-free` (or `zai-coding-plan/glm-4.7` if Z.ai) |
| explore                 | `opencode/grok-code` ← Different!                              |
| multimodal-looker       | `google/gemini-3-pro-preview`                                  |
| Prometheus (Planner)    | `anthropic/claude-sonnet-4-5` ← Different!                     |
| Metis (Plan Consultant) | `anthropic/claude-sonnet-4-5` ← Different!                     |
| Momus (Plan Reviewer)   | `openai/gpt-5.2-codex`                                         |
| Atlas                   | `anthropic/claude-sonnet-4-5` ← Different!                     |
| **unspecified-high**    | `anthropic/claude-sonnet-4-5` ← Different!                     |
| **unspecified-low**     | `anthropic/claude-sonnet-4-5`                                  |
| **quick**               | `anthropic/claude-haiku-4-5`                                   |
| **ultrabrain**          | `openai/gpt-5.2-codex`                                         |
| **visual-engineering**  | `google/gemini-3-pro-preview`                                  |
| **artistry**            | `google/gemini-3-pro-preview`                                  |
| **writing**             | `google/gemini-3-flash-preview`                                |

---

## KEY DIFFERENTIATORS: Max Plan vs Standard

### Primary Impact: Sisyphus (Orchestrator)

**Max20**: `anthropic/claude-opus-4-5` (Opus = most powerful)
**Standard**: `anthropic/claude-sonnet-4-5` (Sonnet = cost-efficient)

→ **Performance difference**: Opus is more capable at complex orchestration

### Secondary Impact: Explore Agent

**Max20**: `anthropic/claude-haiku-4-5` (uses Claude quota)
**Standard**: `opencode/grok-code` (preserves Claude Pro quota)

→ **Quota management**: Standard plan users preserve their Claude credit for Sisyphus

### Tertiary Impact: Planning Agents

**Max20**:

- Prometheus: `anthropic/claude-opus-4-5`
- Metis: `anthropic/claude-opus-4-5`

**Standard**:

- Prometheus: `anthropic/claude-sonnet-4-5`
- Metis: `anthropic/claude-sonnet-4-5`

→ **Planning quality**: Max plan gets better planning models

---

## WARNINGS IN INSTALL

**Location**: `src/cli/install.ts:352-364`

If user selects `no` for Claude (when `!config.hasClaude`):

```
⚠️  CRITICAL WARNING

Sisyphus agent is STRONGLY optimized for Claude Opus 4.5.
Without Claude, you may experience significantly degraded performance:
  • Reduced orchestration quality
  • Weaker tool selection and delegation
  • Less reliable task completion

Consider subscribing to Claude Pro/Max for the best experience.
```

---

## INSTALLATION CONFIGURATION SUMMARY

**Location**: `src/cli/install.ts:35-59`

Output shows Claude subscription type:

```
Configuration Summary

✓ Claude (max20)                  ← If isMax20: true
✓ Claude (standard)               ← If hasClaude: true but isMax20: false
✓ OpenAI/ChatGPT (GPT-5.2 for Oracle)
✓ Gemini
✓ GitHub Copilot (fallback)
✓ OpenCode Zen (opencode/ models)
✓ Z.ai Coding Plan (Librarian: glm-4.7)

─────────────────────────────────────

Model Assignment

ℹ Models auto-configured based on provider priority
• Priority: Native > Copilot > OpenCode Zen > Z.ai
```

---

## NON-TUI MODE (CLI ARGUMENTS)

**Location**: `src/cli/install.ts:274-286`

```bash
# Syntax:
bunx oh-my-opencode install --no-tui --claude=<no|yes|max20> --gemini=<no|yes> --copilot=<no|yes>

# Examples:
bunx oh-my-opencode install --no-tui --claude=max20 --gemini=yes --copilot=no
bunx oh-my-opencode install --no-tui --claude=yes --gemini=no --copilot=yes
```

**Validation** (`validateNonTuiArgs`):

- `--claude` is required (must be: `no`, `yes`, or `max20`)
- `--gemini` is required (must be: `no` or `yes`)
- `--copilot` is required (must be: `no` or `yes`)
- `--openai` is optional (must be: `no` or `yes`)
- `--opencode-zen` is optional (must be: `no` or `yes`)
- `--zai-coding-plan` is optional (must be: `no` or `yes`)

---

## STORAGE LOCATION

**Configuration File**: `~/.config/opencode/omo-config.json` (or `.jsonc`)

**Contains**: The generated model configuration (agents and categories with model assignments)

---

## SUMMARY FOR PRODUCT BUILDERS

### The One Critical Flag

```typescript
isMax20: boolean; // True = Claude Max (~$200/mo), False = Claude Pro (~$20/mo)
```

### The Three Critical Model Assignments

1. **Sisyphus** (Orchestrator): Opus (max20) vs Sonnet (standard)
2. **Explore** (Fast): Haiku (max20) vs grok-code (standard)
3. **Planning agents** (Prometheus/Metis): Opus (max20) vs Sonnet (standard)

### To Replicate the Tier System:

1. Ask users about their subscription plan during onboarding
2. Store a `isPremiumTier` or `isPlanMax` flag
3. For each agent/category with `capability: "unspecified-high"`:
   - Premium tier → use high-capability model (Opus)
   - Standard tier → use mid-capability model (Sonnet)
4. For explore agent: Premium uses high-capability (Haiku), Standard uses fallback (grok-code)
5. Implement fallback chain: Native → OpenCode Zen → Copilot → Z.ai → Fallback
