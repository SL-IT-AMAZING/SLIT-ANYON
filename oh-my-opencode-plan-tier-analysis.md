# oh-my-opencode: Plan-Based Model Switching (max20 vs standard)

## Overview

The system uses a **3-tier decision chain** to determine which models are assigned based on Claude subscription tier.

---

## 1. INPUT: CLI Argument Parsing

### File: `src/cli/types.ts` (Lines 1-18)

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
  kimiForCoding?: BooleanArg;
  skipAuth?: boolean;
}

export interface InstallConfig {
  hasClaude: boolean;
  isMax20: boolean; // ← THE KEY FLAG
  hasOpenAI: boolean;
  hasGemini: boolean;
  hasCopilot: boolean;
  hasOpencodeZen: boolean;
  hasZaiCodingPlan: boolean;
  hasKimiForCoding: boolean;
}

export interface DetectedConfig {
  isInstalled: boolean;
  hasClaude: boolean;
  isMax20: boolean; // ← Persisted in config
  hasOpenAI: boolean;
  hasGemini: boolean;
  hasCopilot: boolean;
  hasOpencodeZen: boolean;
  hasZaiCodingPlan: boolean;
  hasKimiForCoding: boolean;
}
```

---

## 2. TRANSFORM: Args → Config (Plan Tier Detection)

### File: `src/cli/install-validators.ts` (Lines 150-160)

```typescript
export function argsToConfig(args: InstallArgs): InstallConfig {
  return {
    hasClaude: args.claude !== "no",
    isMax20: args.claude === "max20", // ← DECISION: "max20" string → boolean flag
    hasOpenAI: args.openai === "yes",
    hasGemini: args.gemini === "yes",
    hasCopilot: args.copilot === "yes",
    hasOpencodeZen: args.opencodeZen === "yes",
    hasZaiCodingPlan: args.zaiCodingPlan === "yes",
    hasKimiForCoding: args.kimiForCoding === "yes",
  };
}
```

### CLI Validation: `src/cli/install-validators.ts` (Lines 114-119)

```typescript
if (args.claude === undefined) {
  errors.push("--claude is required (values: no, yes, max20)");
} else if (!["no", "yes", "max20"].includes(args.claude)) {
  errors.push(
    `Invalid --claude value: ${args.claude} (expected: no, yes, max20)`,
  );
}
```

---

## 3. PROPAGATE: Config → Provider Availability

### File: `src/cli/provider-availability.ts` (Lines 1-16)

```typescript
import type { InstallConfig } from "./types";
import type { ProviderAvailability } from "./model-fallback-types";

export function toProviderAvailability(
  config: InstallConfig,
): ProviderAvailability {
  return {
    native: {
      claude: config.hasClaude,
      openai: config.hasOpenAI,
      gemini: config.hasGemini,
    },
    opencodeZen: config.hasOpencodeZen,
    copilot: config.hasCopilot,
    zai: config.hasZaiCodingPlan,
    kimiForCoding: config.hasKimiForCoding,
    isMaxPlan: config.isMax20, // ← KEY: isMax20 → isMaxPlan
  };
}
```

### File: `src/cli/model-fallback-types.ts` (Lines 1-16)

```typescript
export interface ProviderAvailability {
  native: {
    claude: boolean;
    openai: boolean;
    gemini: boolean;
  };
  opencodeZen: boolean;
  copilot: boolean;
  zai: boolean;
  kimiForCoding: boolean;
  isMaxPlan: boolean; // ← This flag controls model assignment
}

export interface AgentConfig {
  model: string;
  variant?: string;
}

export interface CategoryConfig {
  model: string;
  variant?: string;
}
```

---

## 4. APPLY: Model Assignment Based on Plan Tier

### File: `src/cli/model-fallback.ts` (Lines 1-120)

**THIS IS THE EXACT FUNCTION THAT CHANGES MODEL CONFIGS BASED ON PLAN TIER**

```typescript
export function generateModelConfig(config: InstallConfig): GeneratedOmoConfig {
  const avail = toProviderAvailability(config);
  const hasAnyProvider =
    avail.native.claude ||
    avail.native.openai ||
    avail.native.gemini ||
    avail.opencodeZen ||
    avail.copilot ||
    avail.zai ||
    avail.kimiForCoding;

  if (!hasAnyProvider) {
    return {
      $schema: SCHEMA_URL,
      agents: Object.fromEntries(
        Object.entries(AGENT_MODEL_REQUIREMENTS)
          .filter(
            ([role, req]) => !(role === "sisyphus" && req.requiresAnyModel),
          )
          .map(([role]) => [role, { model: ULTIMATE_FALLBACK }]),
      ),
      categories: Object.fromEntries(
        Object.keys(CATEGORY_MODEL_REQUIREMENTS).map((cat) => [
          cat,
          { model: ULTIMATE_FALLBACK },
        ]),
      ),
    };
  }

  const agents: Record<string, AgentConfig> = {};
  const categories: Record<string, CategoryConfig> = {};

  for (const [role, req] of Object.entries(AGENT_MODEL_REQUIREMENTS)) {
    // ... other role-specific logic ...
  }

  // ★★★ THE CRITICAL LOGIC FOR PLAN-BASED MODEL ASSIGNMENT ★★★
  for (const [cat, req] of Object.entries(CATEGORY_MODEL_REQUIREMENTS)) {
    // Special case: unspecified-high downgrades to unspecified-low when not isMaxPlan
    const fallbackChain =
      cat === "unspecified-high" && !avail.isMaxPlan // ← CHECK: if NOT max plan
        ? CATEGORY_MODEL_REQUIREMENTS["unspecified-low"].fallbackChain // ← DOWNGRADE
        : req.fallbackChain; // ← USE NORMAL CHAIN

    if (
      req.requiresModel &&
      !isRequiredModelAvailable(req.requiresModel, req.fallbackChain, avail)
    ) {
      continue;
    }
    if (
      req.requiresProvider &&
      !isRequiredProviderAvailable(req.requiresProvider, avail)
    ) {
      continue;
    }

    const resolved = resolveModelFromChain(fallbackChain, avail);
    if (resolved) {
      const variant = resolved.variant ?? req.variant;
      categories[cat] = variant
        ? { model: resolved.model, variant }
        : { model: resolved.model };
    } else {
      categories[cat] = { model: ULTIMATE_FALLBACK };
    }
  }

  return {
    $schema: SCHEMA_URL,
    agents,
    categories,
  };
}
```

**KEY LOGIC: Lines 108-113 show the exact downgrade:**

```typescript
const fallbackChain =
  cat === "unspecified-high" && !avail.isMaxPlan
    ? CATEGORY_MODEL_REQUIREMENTS["unspecified-low"].fallbackChain
    : req.fallbackChain;
```

---

## 5. MODEL REQUIREMENTS: Different Chains by Plan Tier

### File: `src/shared/model-requirements.ts`

**For "unspecified-high" (Premium tasks - ONLY if max20):**

```typescript
"unspecified-high": {
  fallbackChain: [
    { providers: ["anthropic", "github-copilot", "opencode"], model: "claude-opus-4-6", variant: "max" },
    { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.2", variant: "high" },
    { providers: ["google", "github-copilot", "opencode"], model: "gemini-3-pro" },
  ],
},
```

**For "unspecified-low" (Standard tasks - ALWAYS available):**

```typescript
"unspecified-low": {
  fallbackChain: [
    { providers: ["anthropic", "github-copilot", "opencode"], model: "claude-sonnet-4-5" },
    { providers: ["openai", "github-copilot", "opencode"], model: "gpt-5.3-codex", variant: "medium" },
    { providers: ["google", "github-copilot", "opencode"], model: "gemini-3-flash" },
  ],
},
```

**The Downgrade Rule:**

- When `isMaxPlan = false` (user has `--claude=yes` or `--claude=no`)
- `unspecified-high` tasks are demoted to use `unspecified-low` model chain
- This maps Opus 4.6 max → Sonnet 4.5, GPT-5.2 high → GPT-5.3-codex medium, etc.

---

## 6. USAGE: Command-Line Examples

```bash
# Standard plan (regular Claude Pro or no Claude)
bunx oh-my-opencode install --no-tui --claude=yes --openai=no --gemini=no --copilot=no
# Result: isMax20 = false → uses unspecified-low models

# Max 20x plan (Claude Max with 20x token limit)
bunx oh-my-opencode install --no-tui --claude=max20 --openai=no --gemini=no --copilot=no
# Result: isMax20 = true → uses unspecified-high models

# No Claude
bunx oh-my-opencode install --no-tui --claude=no --openai=yes --gemini=no --copilot=no
# Result: isMax20 = false → uses unspecified-low models
```

---

## 7. DECISION FLOW DIAGRAM

```
CLI Input: --claude=<no|yes|max20>
           ↓
TRANSFORM: argsToConfig()
           ↓
           isMax20 = (args.claude === "max20")
           ↓
PROPAGATE: toProviderAvailability()
           ↓
           ProviderAvailability.isMaxPlan = config.isMax20
           ↓
APPLY:     generateModelConfig()
           ↓
           IF cat === "unspecified-high" AND !avail.isMaxPlan:
             USE CATEGORY_MODEL_REQUIREMENTS["unspecified-low"].fallbackChain
           ELSE:
             USE normal req.fallbackChain
           ↓
OUTPUT:    Generated OMO config with plan-tier-specific models
```

---

## Key Takeaways for Your Product

1. **Single Flag**: Plan tier is stored as a boolean `isMaxPlan` (or `isMax20` at input level)
2. **Lazy Downgrade**: Standard/non-max plans DON'T get their config until model assignment time
   - This happens in `generateModelConfig()` at the point where categories are resolved
   - The system doesn't pre-filter agent requirements based on plan tier
3. **Category-Specific**: The downgrade logic is specifically on `unspecified-high` → `unspecified-low`
   - Other categories and agents use their normal fallback chains regardless of plan tier
4. **Variant Handling**: Models in the same tier can have different variants (e.g., "max", "high", "medium")
   - Variants are fallback chain metadata, not plan-dependent
5. **Persistence**: The `isMax20` flag is persisted in the config file so it survives between sessions

---

## APPENDIX: Quick Reference - Code Entry/Exit Points

### Entry Point: Where Plan Tier Decision Happens

```typescript
// src/cli/install-validators.ts, Line 156
isMax20: args.claude === "max20",
```

**Single line of truth**: The plan tier is determined by checking if the CLI arg equals the string "max20".

### Exit Point: Where Model Assignment Changes

```typescript
// src/cli/model-fallback.ts, Lines 108-113
const fallbackChain =
  cat === "unspecified-high" && !avail.isMaxPlan
    ? CATEGORY_MODEL_REQUIREMENTS["unspecified-low"].fallbackChain
    : req.fallbackChain;
```

**Single conditional**: When category is "unspecified-high" AND not a max plan, downgrade to low-tier models.

### Data Flow Through Types

```
InstallArgs.claude: "max20" | "yes" | "no"
        ↓
InstallConfig.isMax20: boolean (true iff claude === "max20")
        ↓
ProviderAvailability.isMaxPlan: boolean (copied from isMax20)
        ↓
generateModelConfig() uses avail.isMaxPlan to decide fallback chains
```

### Model Resolution Chain Example

**When `isMaxPlan = true`:**

```
unspecified-high → claude-opus-4-6 (variant: max) → fallback to gpt-5.2 high → fallback to gemini-3-pro
```

**When `isMaxPlan = false`:**

```
unspecified-high → (REDIRECTED TO unspecified-low)
unspecified-low → claude-sonnet-4-5 → fallback to gpt-5.3-codex medium → fallback to gemini-3-flash
```

---

## Tests Confirming This Behavior

From `src/cli/model-fallback.test.ts`:

1. **Test case: "uses Claude models with isMax20 flag"** (Line 46-68)
   - Creates config with `isMax20: true`
   - Verifies sisyphus gets `claude-opus-4-6` with variant `max`

2. **Test case: "uses all providers with isMax20 flag when all natives available"** (Line 118-138)
   - Creates config with `isMax20: true`
   - Verifies different model chains are used when max plan is active

3. **Test case: "explores uses Claude haiku regardless of isMax20 flag"** (Line 336-348)
   - Shows that `explore` agent ALWAYS uses haiku, independent of plan tier
   - Demonstrates that plan downgrade is NOT universal across all agents/categories

This proves the downgrade is **selectively applied only to `unspecified-high` category**, not all models.
