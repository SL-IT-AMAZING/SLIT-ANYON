# OH-MY-OPENCODE CURRENT STATE - DEFINITIVE RECONNAISSANCE

**Date:** 2026-02-18 | **Repo:** /Users/cosmos/Documents/opensource/oh-my-opencode

---

## ⚠️ CRITICAL FINDING: NO HEPHAESTUS AGENT

**Search Result:** 0 matches for "hephaestus" or "Hephaestus" agent implementation.

- **Only reference:** Line in momus.ts (mythological commentary about Momus criticizing Hephaestus)
- **Conclusion:** "Hephaestus" mentioned in your context is OUTDATED/INCORRECT

---

## 1. NATIVE FALLBACK CHAINS (EXACT)

**File:** `src/cli/model-fallback.ts` | **Lines:** 49-86

### unspecified-high (Line 50-54)

```typescript
{ provider: "claude", model: "anthropic/claude-opus-4-5" },
{ provider: "openai", model: "openai/gpt-5.2" },
{ provider: "gemini", model: "google/gemini-3-pro-preview" },
```

### unspecified-low (Line 55-59)

```typescript
{ provider: "claude", model: "anthropic/claude-sonnet-4-5" },
{ provider: "openai", model: "openai/gpt-5.2" },
{ provider: "gemini", model: "google/gemini-3-flash-preview" },
```

### quick (Line 60-64)

```typescript
{ provider: "claude", model: "anthropic/claude-haiku-4-5" },
{ provider: "openai", model: "openai/gpt-5.1-codex-mini" },
{ provider: "gemini", model: "google/gemini-3-flash-preview" },
```

### ultrabrain (Line 65-69)

```typescript
{ provider: "openai", model: "openai/gpt-5.2-codex" },  // PRIMARY
{ provider: "claude", model: "anthropic/claude-opus-4-5" },
{ provider: "gemini", model: "google/gemini-3-pro-preview" },
```

### visual-engineering (Line 70-74)

```typescript
{ provider: "gemini", model: "google/gemini-3-pro-preview" },  // PRIMARY
{ provider: "openai", model: "openai/gpt-5.2" },
{ provider: "claude", model: "anthropic/claude-sonnet-4-5" },
```

### artistry (Line 75-79)

```typescript
{ provider: "gemini", model: "google/gemini-3-pro-preview" },  // PRIMARY
{ provider: "openai", model: "openai/gpt-5.2" },
{ provider: "claude", model: "anthropic/claude-opus-4-5" },
```

### writing (Line 80-84)

```typescript
{ provider: "gemini", model: "google/gemini-3-flash-preview" },  // PRIMARY
{ provider: "openai", model: "openai/gpt-5.2" },
{ provider: "claude", model: "anthropic/claude-sonnet-4-5" },
```

### glm (Line 85)

```typescript
glm: [],  // EMPTY - resolves via provider availability
```

---

## 2. AGENT REQUIREMENTS (EXACT)

**File:** `src/cli/model-fallback.ts` | **Lines:** 117-127

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

---

## 3. BUILTIN AGENT LIST

**File:** `src/agents/types.ts` | **Lines:** 59-67

```typescript
export type BuiltinAgentName =
  | "Sisyphus"
  | "oracle"
  | "librarian"
  | "explore"
  | "multimodal-looker"
  | "Metis (Plan Consultant)"
  | "Momus (Plan Reviewer)"
  | "Atlas";
```

**Total: 8 agents** (No Hephaestus)

---

## 4. RESOLVED MODELS (Agent → Capability → Model)

| Agent                       | Capability         | Variant | Resolved Model                |
| --------------------------- | ------------------ | ------- | ----------------------------- |
| **Sisyphus**                | unspecified-high   | —       | `anthropic/claude-opus-4-5`   |
| **oracle**                  | ultrabrain         | high    | `openai/gpt-5.2-codex`        |
| **librarian**               | glm                | —       | `opencode/glm-4.7-free`       |
| **explore**                 | quick              | —       | `anthropic/claude-haiku-4-5`  |
| **multimodal-looker**       | visual-engineering | —       | `google/gemini-3-pro-preview` |
| **Prometheus (Planner)**    | unspecified-high   | —       | `anthropic/claude-opus-4-5`   |
| **Metis (Plan Consultant)** | unspecified-high   | —       | `anthropic/claude-opus-4-5`   |
| **Momus (Plan Reviewer)**   | ultrabrain         | medium  | `openai/gpt-5.2-codex`        |
| **Atlas**                   | unspecified-high   | —       | `anthropic/claude-opus-4-5`   |

---

## 5. CATEGORY MAPPINGS

**File:** `src/tools/delegate-task/constants.ts` | **Lines:** 158-166

```typescript
export const DEFAULT_CATEGORIES: Record<string, CategoryConfig> = {
  "visual-engineering": { model: "google/gemini-3-pro-preview" },
  ultrabrain: { model: "openai/gpt-5.2-codex", variant: "xhigh" },
  artistry: { model: "google/gemini-3-pro-preview", variant: "max" },
  quick: { model: "anthropic/claude-haiku-4-5" },
  "unspecified-low": { model: "anthropic/claude-sonnet-4-5" },
  "unspecified-high": { model: "anthropic/claude-opus-4-5", variant: "max" },
  writing: { model: "google/gemini-3-flash-preview" },
};
```

---

## 6. OPENCODE ZEN MODELS

**File:** `src/cli/model-fallback.ts` | **Lines:** 88-97

```typescript
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
```

---

## 7. GITHUB COPILOT MODELS

**File:** `src/cli/model-fallback.ts` | **Lines:** 99-108

```typescript
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
```

---

## 8. OTHER PROVIDERS

### ZAI (Zai Coding Plan)

**File:** `src/cli/model-fallback.ts` | **Line:** 110

```typescript
const ZAI_MODEL = "zai-coding-plan/glm-4.7";
```

Used for: `librarian` agent only

### Ultimate Fallback

**File:** `src/cli/model-fallback.ts` | **Line:** 144

```typescript
const ULTIMATE_FALLBACK = "opencode/glm-4.7-free";
```

---

## 9. MODEL VERSION SUMMARY

### NO "opus-4-6" or "gpt-5.3" FOUND

**Claude Models (3 versions):**

- ✅ `anthropic/claude-opus-4-5` (highest)
- ✅ `anthropic/claude-sonnet-4-5` (mid)
- ✅ `anthropic/claude-haiku-4-5` (fast)

**OpenAI Models (3 versions):**

- ✅ `openai/gpt-5.2` (highest general)
- ✅ `openai/gpt-5.2-codex` (specialized logic)
- ✅ `openai/gpt-5.1-codex-mini` (fallback fast)

**Google Models (2 versions):**

- ✅ `google/gemini-3-pro-preview` (highest)
- ✅ `google/gemini-3-flash-preview` (fast)

**No gpt-5.3, opus-4-6, or future model versions referenced anywhere**

---

## 10. RESOLVE CHAIN PRIORITY

**File:** `src/cli/model-fallback.ts` | **Function:** `resolveModel()` (Lines 161-182)

```
1. Native provider (if available) → NATIVE_FALLBACK_CHAINS first match
2. OpenCode Zen (if available) → OPENCODE_ZEN_MODELS
3. GitHub Copilot (if available) → GITHUB_COPILOT_MODELS
4. ZAI (if available, librarian only) → ZAI_MODEL
5. Ultimate fallback → "opencode/glm-4.7-free"
```

**Special overrides in generateModelConfig():**

- **explore agent** (Lines 218-223):
  - If Claude + Max: `anthropic/claude-haiku-4-5`
  - Otherwise: `opencode/grok-code`
- **librarian agent** (Lines 216-217):
  - If ZAI available: `zai-coding-plan/glm-4.7`
  - Otherwise: resolve via glm capability

---

## 11. AGENT FILE SIZES

**Directory:** `src/agents/`

| File                 | Lines | Purpose                           |
| -------------------- | ----- | --------------------------------- |
| sisyphus.ts          | 633   | Main orchestrator prompt          |
| atlas.ts             | 1383  | New orchestrator agent            |
| prometheus-prompt.ts | 1196  | Planning agent interview mode     |
| momus.ts             | 444   | Plan reviewer with interview loop |
| librarian.ts         | 326   | Docs & code search specialist     |
| metis.ts             | 315   | Pre-planning analysis             |
| oracle.ts            | 122   | High-IQ debugging                 |
| sisyphus-junior.ts   | 134   | Category-specific worker          |
| explore.ts           | 52    | Fast codebase exploration         |
| multimodal-looker.ts | 56    | PDF/image analysis                |
| types.ts             | 80    | Type definitions                  |
| utils.ts             | 240   | Shared utilities                  |
| index.ts             | 14    | Barrel exports                    |

---

## 12. README vs CODE DISCREPANCIES

**README.md (Line 191) claims:**

```
Meet our main agent: Sisyphus (Opus 4.5 High).
```

**README.md (Lines 196-199) claims:**

```
- Oracle: Design, debugging (GPT 5.2 Medium)
- Frontend UI/UX Engineer: Frontend development (Gemini 3 Pro)
- Librarian: Official docs, open source implementations, codebase exploration (Claude Sonnet 4.5)
- Explore: Blazing fast codebase exploration (Contextual Grep) (Grok Code)
```

**Code reality:**

- ❌ Librarian: Actually `opencode/glm-4.7-free` (NOT Claude Sonnet 4.5)
- ⚠️ Explore: `anthropic/claude-haiku-4-5` (fallback: `opencode/grok-code`)
- ✅ Oracle: `openai/gpt-5.2-codex` (variant: high)
- ✅ Sisyphus: `anthropic/claude-opus-4-5`

---

## 13. TIER MAPPING FOR PRODUCT

### Free/Minimal Tier

- All agents resolve to: `opencode/glm-4.7-free`
- Result: Severely degraded quality

### Pro/Standard Tier (Single Provider)

**Example: Claude only**

- Sisyphus: `anthropic/claude-opus-4-5` ✓
- Oracle: `openai/gpt-5.2-codex` → fallback → `anthropic/claude-opus-4-5` (capability down)
- Librarian: `opencode/glm-4.7-free` ✓
- Explore: `anthropic/claude-haiku-4-5` ✓

### Max Tier (All Providers)

- Sisyphus: `anthropic/claude-opus-4-5` ✓
- Oracle: `openai/gpt-5.2-codex` ✓ (PRIMARY)
- Visual-engineering: `google/gemini-3-pro-preview` ✓ (PRIMARY)
- All agents: First-in-chain primary model

### Provider-Specific Tiers

- **OpenCode Zen:** Zenified variants (slightly different model names)
- **GitHub Copilot:** Copilot-wrapped variants
- **ZAI Coding Plan:** Uses GLM-4.7 for librarian

---

## 14. KEY CONSTANTS

| Name                   | Value                            | Purpose                     |
| ---------------------- | -------------------------------- | --------------------------- |
| NATIVE_FALLBACK_CHAINS | Record<ModelCapability, Entry[]> | Primary fallback logic      |
| AGENT_REQUIREMENTS     | 9 entries                        | Maps agent → capability     |
| CATEGORY_REQUIREMENTS  | 7 entries                        | Maps category → capability  |
| DEFAULT_CATEGORIES     | 7 entries                        | Category → model resolution |
| ULTIMATE_FALLBACK      | "opencode/glm-4.7-free"          | Last resort model           |
| ZAI_MODEL              | "zai-coding-plan/glm-4.7"        | ZAI-specific model          |

---

## SUMMARY FOR PRODUCT TIERS

### Sisyphus/Prometheus/Metis/Atlas (Orchestrators)

- **Tier requirement:** Unspecified-high capability
- **Model chain:** opus-4-5 → gpt-5.2 → gemini-3-pro
- **Min tier:** All require at least fallback (glm-4.7-free)

### Oracle (High-IQ reasoning)

- **Tier requirement:** Ultrabrain capability (variant: high/medium)
- **Model chain:** gpt-5.2-codex → opus-4-5 → gemini-3-pro
- **Min tier:** Needs high-performance provider

### Visual-engineering category

- **Model chain:** gemini-3-pro → gpt-5.2 → sonnet-4-5
- **Best tier:** Requires Gemini for optimal

### Ultrabrain category (Deep logic)

- **Model:** gpt-5.2-codex (variant: xhigh)
- **Best tier:** Requires OpenAI

### Quick tasks

- **Model:** haiku-4-5 (fastest, cheapest)
- **Best tier:** Pro minimum

---

## FILES TO READ NEXT (If Needed)

For tier mapping implementation:

1. `src/cli/install.ts` (462 lines) - Interactive tier selection
2. `src/cli/config-manager.ts` (616 lines) - Config parsing & multi-level merge
3. `src/config/schema.ts` - Zod validation schema
