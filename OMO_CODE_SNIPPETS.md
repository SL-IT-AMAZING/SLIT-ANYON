# OH-MY-OPENCODE - KEY CODE SNIPPETS

## 1. TYPES DEFINITION

**File**: `src/cli/types.ts`

```typescript
export type ClaudeSubscription = "no" | "yes" | "max20";
export type BooleanArg = "no" | "yes";

export interface InstallArgs {
  tui: boolean;
  claude?: ClaudeSubscription;
  openai?: BooleanArg;
  gemini?: BooleanArg;
  copilot?: BooleanArg;
  opencodeZen?: BooleanArg;
  zaiCodingPlan?: BooleanArg;
  skipAuth?: boolean;
}

export interface InstallConfig {
  hasClaude: boolean;
  isMax20: boolean; // ⭐ THE CRITICAL FLAG
  hasOpenAI: boolean;
  hasGemini: boolean;
  hasCopilot: boolean;
  hasOpencodeZen: boolean;
  hasZaiCodingPlan: boolean;
}

export interface DetectedConfig {
  isInstalled: boolean;
  hasClaude: boolean;
  isMax20: boolean; // ⭐ THE CRITICAL FLAG
  hasOpenAI: boolean;
  hasGemini: boolean;
  hasCopilot: boolean;
  hasOpencodeZen: boolean;
  hasZaiCodingPlan: boolean;
}
```

---

## 2. ONBOARDING QUESTIONS (EXACT TUI CODE)

**File**: `src/cli/install.ts:178-261`

```typescript
// QUESTION 1: Claude Subscription
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
if (p.isCancel(claude)) {
  p.cancel("Installation cancelled.");
  return null;
}

// QUESTION 2: OpenAI/ChatGPT
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
if (p.isCancel(openai)) {
  p.cancel("Installation cancelled.");
  return null;
}

// QUESTION 3: Gemini
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
if (p.isCancel(gemini)) {
  p.cancel("Installation cancelled.");
  return null;
}

// QUESTION 4: GitHub Copilot
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
if (p.isCancel(copilot)) {
  p.cancel("Installation cancelled.");
  return null;
}

// QUESTION 5: OpenCode Zen
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
if (p.isCancel(opencodeZen)) {
  p.cancel("Installation cancelled.");
  return null;
}

// QUESTION 6: Z.ai Coding Plan
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
if (p.isCancel(zaiCodingPlan)) {
  p.cancel("Installation cancelled.");
  return null;
}

return {
  hasClaude: claude !== "no",
  isMax20: claude === "max20", // ⭐ THE CONVERSION
  hasOpenAI: openai === "yes",
  hasGemini: gemini === "yes",
  hasCopilot: copilot === "yes",
  hasOpencodeZen: opencodeZen === "yes",
  hasZaiCodingPlan: zaiCodingPlan === "yes",
};
```

---

## 3. MODEL FALLBACK SYSTEM

**File**: `src/cli/model-fallback.ts`

### Capability Levels

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

### Provider Availability

```typescript
interface ProviderAvailability {
  native: {
    claude: boolean;
    openai: boolean;
    gemini: boolean;
  };
  opencodeZen: boolean;
  copilot: boolean;
  zai: boolean;
  isMaxPlan: boolean; // ⭐ THE CRITICAL FLAG
}

function toProviderAvailability(config: InstallConfig): ProviderAvailability {
  return {
    native: {
      claude: config.hasClaude,
      openai: config.hasOpenAI,
      gemini: config.hasGemini,
    },
    opencodeZen: config.hasOpencodeZen,
    copilot: config.hasCopilot,
    zai: config.hasZaiCodingPlan,
    isMaxPlan: config.isMax20, // ⭐ FROM isMax20
  };
}
```

### THE CRITICAL FUNCTION

```typescript
function resolveClaudeCapability(avail: ProviderAvailability): ModelCapability {
  return avail.isMaxPlan ? "unspecified-high" : "unspecified-low";
}
// isMaxPlan=true  → "unspecified-high"  (Opus models)
// isMaxPlan=false → "unspecified-low"   (Sonnet models)
```

### Fallback Chains

```typescript
const NATIVE_FALLBACK_CHAINS: Record<ModelCapability, NativeFallbackEntry[]> = {
  "unspecified-high": [
    { provider: "claude", model: "anthropic/claude-opus-4-5" },
    { provider: "openai", model: "openai/gpt-5.2" },
    { provider: "gemini", model: "google/gemini-3-pro-preview" },
  ],
  "unspecified-low": [
    { provider: "claude", model: "anthropic/claude-sonnet-4-5" },
    { provider: "openai", model: "openai/gpt-5.2" },
    { provider: "gemini", model: "google/gemini-3-flash-preview" },
  ],
  quick: [
    { provider: "claude", model: "anthropic/claude-haiku-4-5" },
    { provider: "openai", model: "openai/gpt-5.1-codex-mini" },
    { provider: "gemini", model: "google/gemini-3-flash-preview" },
  ],
  ultrabrain: [
    { provider: "openai", model: "openai/gpt-5.2-codex" },
    { provider: "claude", model: "anthropic/claude-opus-4-5" },
    { provider: "gemini", model: "google/gemini-3-pro-preview" },
  ],
  "visual-engineering": [
    { provider: "gemini", model: "google/gemini-3-pro-preview" },
    { provider: "openai", model: "openai/gpt-5.2" },
    { provider: "claude", model: "anthropic/claude-sonnet-4-5" },
  ],
  artistry: [
    { provider: "gemini", model: "google/gemini-3-pro-preview" },
    { provider: "openai", model: "openai/gpt-5.2" },
    { provider: "claude", model: "anthropic/claude-opus-4-5" },
  ],
  writing: [
    { provider: "gemini", model: "google/gemini-3-flash-preview" },
    { provider: "openai", model: "openai/gpt-5.2" },
    { provider: "claude", model: "anthropic/claude-sonnet-4-5" },
  ],
  glm: [],
};

const OPENCODE_ZEN_MODELS: Record<ModelCapability, string> = {
  "unspecified-high": "opencode/claude-opus-4-5",
  "unspecified-low": "opencode/claude-sonnet-4-5",
  quick: "opencode/claude-haiku-4-5",
  ultrabrain: "opencode/gpt-5.2-codex",
  "visual-engineering": "opencode/gemini-3-pro",
  artistry: "opencode/gemini-3-pro",
  writing: "opencode/gemini-3-flash",
  glm: "opencode/glm-4.7-free",
};

const GITHUB_COPILOT_MODELS: Record<ModelCapability, string> = {
  "unspecified-high": "github-copilot/claude-opus-4.5",
  "unspecified-low": "github-copilot/claude-sonnet-4.5",
  quick: "github-copilot/claude-haiku-4.5",
  ultrabrain: "github-copilot/gpt-5.2-codex",
  "visual-engineering": "github-copilot/gemini-3-pro-preview",
  artistry: "github-copilot/gemini-3-pro-preview",
  writing: "github-copilot/gemini-3-flash-preview",
  glm: "github-copilot/gpt-5.2",
};

const ZAI_MODEL = "zai-coding-plan/glm-4.7";
const ULTIMATE_FALLBACK = "opencode/glm-4.7-free";
```

### Agent Requirements

```typescript
const AGENT_REQUIREMENTS: Record<string, AgentRequirement> = {
  Sisyphus: { capability: "unspecified-high" },
  oracle: { capability: "ultrabrain", variant: "high" },
  librarian: { capability: "glm" },
  explore: { capability: "quick" },
  "multimodal-looker": { capability: "visual-engineering" },
  "Prometheus (Planner)": { capability: "unspecified-high" },
  "Metis (Plan Consultant)": { capability: "unspecified-high" },
  "Momus (Plan Reviewer)": { capability: "ultrabrain", variant: "medium" },
  Atlas: { capability: "unspecified-high" },
};
```

### Model Resolution

```typescript
function resolveModel(
  capability: ModelCapability,
  avail: ProviderAvailability,
): string {
  const nativeChain = NATIVE_FALLBACK_CHAINS[capability];
  for (const entry of nativeChain) {
    if (avail.native[entry.provider]) {
      return entry.model;
    }
  }

  if (avail.opencodeZen) {
    return OPENCODE_ZEN_MODELS[capability];
  }

  if (avail.copilot) {
    return GITHUB_COPILOT_MODELS[capability];
  }

  if (avail.zai) {
    return ZAI_MODEL;
  }

  return ULTIMATE_FALLBACK;
}
```

---

## 4. MAIN CONFIG GENERATION

**File**: `src/cli/model-fallback.ts:188-242`

```typescript
export function generateModelConfig(config: InstallConfig): GeneratedOmoConfig {
  const avail = toProviderAvailability(config);
  const hasAnyProvider =
    avail.native.claude ||
    avail.native.openai ||
    avail.native.gemini ||
    avail.opencodeZen ||
    avail.copilot ||
    avail.zai;

  // If no providers, use ultimate fallback for everything
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

  const agents: Record<string, AgentConfig> = {};
  const categories: Record<string, CategoryConfig> = {};

  // Resolve Claude capability based on plan
  const claudeCapability = resolveClaudeCapability(avail); // ⭐ USES isMaxPlan

  // Handle special cases and other agents
  for (const [role, req] of Object.entries(AGENT_REQUIREMENTS)) {
    if (role === "librarian" && avail.zai) {
      // Z.ai override for librarian
      agents[role] = { model: ZAI_MODEL };
    } else if (role === "explore") {
      // Special logic: preserve Claude quota for standard plan
      if (avail.native.claude && avail.isMaxPlan) {
        agents[role] = { model: "anthropic/claude-haiku-4-5" };
      } else {
        agents[role] = { model: "opencode/grok-code" };
      }
    } else {
      // Normal resolution
      const capability =
        req.capability === "unspecified-high"
          ? claudeCapability
          : req.capability;
      const model = resolveModel(capability, avail);
      agents[role] = req.variant ? { model, variant: req.variant } : { model };
    }
  }

  // Categories
  for (const [cat, req] of Object.entries(CATEGORY_REQUIREMENTS)) {
    const capability =
      req.capability === "unspecified-high" ? claudeCapability : req.capability;
    const model = resolveModel(capability, avail);
    categories[cat] = req.variant ? { model, variant: req.variant } : { model };
  }

  return {
    $schema: SCHEMA_URL,
    agents,
    categories,
  };
}
```

---

## 5. TEST CASES SHOWING EXACT MODEL DIFFERENCES

**File**: `src/cli/config-manager.test.ts`

```typescript
test("generates native opus models when Claude max20 subscription", () => {
  // #given user has Claude max20 subscription
  const config: InstallConfig = {
    hasClaude: true,
    isMax20: true, // ← THE DIFFERENTIATOR
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
  };

  // #when generating config
  const result = generateOmoConfig(config);

  // #then should use native anthropic opus (max power for max20 plan)
  expect(
    (result.agents as Record<string, { model: string }>).Sisyphus.model,
  ).toBe("anthropic/claude-opus-4-5");
});

test("generates native sonnet models when Claude standard subscription", () => {
  // #given user has Claude standard subscription (not max20)
  const config: InstallConfig = {
    hasClaude: true,
    isMax20: false, // ← THE DIFFERENTIATOR
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
  };

  // #when generating config
  const result = generateOmoConfig(config);

  // #then should use native anthropic sonnet (cost-efficient for standard plan)
  expect(
    (result.agents as Record<string, { model: string }>).Sisyphus.model,
  ).toBe("anthropic/claude-sonnet-4-5");
});

test("uses haiku for explore when Claude max20", () => {
  const config: InstallConfig = {
    hasClaude: true,
    isMax20: true, // ← Max20 uses haiku
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
  };
  const result = generateOmoConfig(config);
  expect(
    (result.agents as Record<string, { model: string }>).explore.model,
  ).toBe("anthropic/claude-haiku-4-5");
});

test("uses grok-code for explore when not max20", () => {
  const config: InstallConfig = {
    hasClaude: true,
    isMax20: false, // ← Standard uses grok-code
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
  };
  const result = generateOmoConfig(config);
  expect(
    (result.agents as Record<string, { model: string }>).explore.model,
  ).toBe("opencode/grok-code");
});
```

---

## 6. INSTALLATION OUTPUT DISPLAY

**File**: `src/cli/install.ts:35-59`

```typescript
function formatConfigSummary(config: InstallConfig): string {
  const lines: string[] = [];

  lines.push(color.bold(color.white("Configuration Summary")));
  lines.push("");

  // Shows which plan tier was selected
  const claudeDetail = config.hasClaude
    ? config.isMax20
      ? "max20"
      : "standard"
    : undefined;
  lines.push(formatProvider("Claude", config.hasClaude, claudeDetail));
  lines.push(
    formatProvider("OpenAI/ChatGPT", config.hasOpenAI, "GPT-5.2 for Oracle"),
  );
  lines.push(formatProvider("Gemini", config.hasGemini));
  lines.push(formatProvider("GitHub Copilot", config.hasCopilot, "fallback"));
  lines.push(
    formatProvider("OpenCode Zen", config.hasOpencodeZen, "opencode/ models"),
  );
  lines.push(
    formatProvider(
      "Z.ai Coding Plan",
      config.hasZaiCodingPlan,
      "Librarian: glm-4.7",
    ),
  );

  lines.push("");
  lines.push(color.dim("─".repeat(40)));
  lines.push("");

  lines.push(color.bold(color.white("Model Assignment")));
  lines.push("");
  lines.push(
    `  ${SYMBOLS.info} Models auto-configured based on provider priority`,
  );
  lines.push(
    `  ${SYMBOLS.bullet} Priority: Native > Copilot > OpenCode Zen > Z.ai`,
  );

  return lines.join("\n");
}
```

---

## 7. CRITICAL WARNING FOR NO-CLAUDE SCENARIO

**File**: `src/cli/install.ts:352-364`

```typescript
if (!config.hasClaude) {
  console.log();
  console.log(color.bgRed(color.white(color.bold(" ⚠️  CRITICAL WARNING "))));
  console.log();
  console.log(
    color.red(
      color.bold("  Sisyphus agent is STRONGLY optimized for Claude Opus 4.5."),
    ),
  );
  console.log(
    color.red(
      "  Without Claude, you may experience significantly degraded performance:",
    ),
  );
  console.log(color.dim("    • Reduced orchestration quality"));
  console.log(color.dim("    • Weaker tool selection and delegation"));
  console.log(color.dim("    • Less reliable task completion"));
  console.log();
  console.log(
    color.yellow(
      "  Consider subscribing to Claude Pro/Max for the best experience.",
    ),
  );
  console.log();
}
```

---

## 8. COMPLETE FLOW EXAMPLE

```typescript
// User chooses during onboarding:
// "Do you have Claude Pro/Max?" → Answer: "Yes (max20 mode)"

// This creates:
const config: InstallConfig = {
  hasClaude: true,
  isMax20: true,  // ⭐ THE KEY FLAG
  hasOpenAI: false,
  hasGemini: false,
  hasCopilot: false,
  hasOpencodeZen: false,
  hasZaiCodingPlan: false,
}

// Which produces:
const modelConfig = generateModelConfig(config)

// Result (simplified):
{
  "$schema": "https://...",
  "agents": {
    "Sisyphus": {
      "model": "anthropic/claude-opus-4-5"  // ← OPUS (most powerful)
    },
    "explore": {
      "model": "anthropic/claude-haiku-4-5"  // ← HAIKU (uses quota)
    },
    "oracle": {
      "model": "openai/gpt-5.2-codex"
    },
    // ... etc
  },
  "categories": {
    "unspecified-high": {
      "model": "anthropic/claude-opus-4-5"  // ← OPUS
    },
    "unspecified-low": {
      "model": "anthropic/claude-sonnet-4-5"
    },
    // ... etc
  }
}
```
