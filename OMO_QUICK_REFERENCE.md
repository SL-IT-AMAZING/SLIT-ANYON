# OH-MY-OPENCODE PLAN-BASED MODEL CONFIG - QUICK REFERENCE

## The 6 Onboarding Questions (TUI Mode)

```
1. Do you have a Claude Pro/Max subscription?
   ├─ No                 → hasClaude=false, isMax20=false
   ├─ Yes (standard)     → hasClaude=true, isMax20=false
   └─ Yes (max20 mode)   → hasClaude=true, isMax20=true

2. Do you have an OpenAI/ChatGPT Plus subscription?
   ├─ No  → hasOpenAI=false
   └─ Yes → hasOpenAI=true

3. Will you integrate Google Gemini?
   ├─ No  → hasGemini=false
   └─ Yes → hasGemini=true

4. Do you have a GitHub Copilot subscription?
   ├─ No  → hasCopilot=false
   └─ Yes → hasCopilot=true

5. Do you have access to OpenCode Zen (opencode/ models)?
   ├─ No  → hasOpencodeZen=false
   └─ Yes → hasOpencodeZen=true

6. Do you have a Z.ai Coding Plan subscription?
   ├─ No  → hasZaiCodingPlan=false
   └─ Yes → hasZaiCodingPlan=true
```

## The Critical Differentiator: `isMax20`

```
isMax20 = true  (Claude Max, ~$200/mo)    → Uses OPUS models
isMax20 = false (Claude Pro, ~$20/mo)     → Uses SONNET models
```

## Model Assignments - Side by Side

### Sisyphus (Orchestrator) 👑

```
Max20  → anthropic/claude-opus-4-5      (Premium, most capable)
Std    → anthropic/claude-sonnet-4-5    (Cost-efficient)
```

### Explore (Fast Search) ⚡

```
Max20  → anthropic/claude-haiku-4-5     (Uses Claude quota)
Std    → opencode/grok-code             (Preserves Claude quota)
```

### Prometheus & Metis (Planning)

```
Max20  → anthropic/claude-opus-4-5      (Premium planning)
Std    → anthropic/claude-sonnet-4-5    (Cost-efficient planning)
```

### Oracle (High-IQ Debugging) 🧠

```
Max20  → openai/gpt-5.2-codex           (Same for both)
Std    → openai/gpt-5.2-codex           (Same for both)
```

### All Other Agents & Categories

```
Same regardless of plan (use other providers or fallbacks)
```

## Model Fallback Priority Chain

1. **Native providers** (Claude/OpenAI/Gemini) - highest priority
   - If Claude available: use based on plan (Opus vs Sonnet)
   - If no Claude: use OpenAI → Gemini in order
2. **OpenCode Zen** - if no native available
3. **GitHub Copilot** - if no native or opencode
4. **Z.ai** - if no other options (special: always glm-4.7)
5. **Ultimate fallback** - `opencode/glm-4.7-free` (free tier)

## The Core Logic (Pseudocode)

```javascript
function resolveSisyphusModel(config) {
  if (config.isMax20 && config.hasClaude) {
    return "anthropic/claude-opus-4-5"; // Max = Opus
  } else if (config.hasClaude) {
    return "anthropic/claude-sonnet-4-5"; // Standard = Sonnet
  } else if (config.hasOpenAI) {
    return "openai/gpt-5.2"; // Fallback to OpenAI
  } else if (config.hasOpencodeZen) {
    return "opencode/claude-sonnet-4-5"; // Fallback to OpenCode
  } else if (config.hasCopilot) {
    return "github-copilot/claude-sonnet-4.5"; // Fallback to Copilot
  } else {
    return "opencode/glm-4.7-free"; // Ultimate fallback
  }
}
```

## Files to Reference

| File                             | Purpose                                      |
| -------------------------------- | -------------------------------------------- |
| `src/cli/install.ts`             | TUI questions & onboarding flow              |
| `src/cli/types.ts`               | `InstallConfig` & `ClaudeSubscription` types |
| `src/cli/model-fallback.ts`      | `resolveClaudeCapability()` & model mappings |
| `src/cli/config-manager.ts`      | Config generation & storage                  |
| `src/cli/config-manager.test.ts` | Test cases showing exact model assignments   |

## Implementation Pattern for Your Product

```typescript
// 1. Define your tier system
type SubscriptionTier = "free" | "pro" | "max";
interface UserConfig {
  tier: SubscriptionTier;
  hasOpenAI?: boolean;
  hasGemini?: boolean;
  // ... other providers
}

// 2. Map tier to capability level
function resolveCapability(tier: SubscriptionTier): "high" | "mid" | "low" {
  return tier === "max" ? "high" : tier === "pro" ? "mid" : "low";
}

// 3. Map capability to model
const models = {
  high: {
    orchestrator: "anthropic/claude-opus-4-5",
    planning: "anthropic/claude-opus-4-5",
    fast: "anthropic/claude-haiku-4-5",
  },
  mid: {
    orchestrator: "anthropic/claude-sonnet-4-5",
    planning: "anthropic/claude-sonnet-4-5",
    fast: "opencode/grok-code",
  },
  low: {
    orchestrator: "opencode/glm-4.7-free",
    planning: "opencode/glm-4.7-free",
    fast: "opencode/glm-4.7-free",
  },
};

// 4. Generate config
function generateAgentConfig(config: UserConfig) {
  const capability = resolveCapability(config.tier);
  return {
    sisyphus: models[capability].orchestrator,
    explore: models[capability].fast,
    prometheus: models[capability].planning,
    // ... etc
  };
}
```

## Key Insights for Your Product

1. **Single Binary Flag**: `isMax20` drives most model differences
2. **Graceful Degradation**: Multiple fallback chains ensure something always works
3. **Quota Protection**: Standard plan users preserve their Claude quota for orchestrator
4. **Plan-Aligned Capability**: More expensive plan = better models automatically
5. **Zero-Cost Tier**: Always available via `opencode/glm-4.7-free` fallback

---

**Generated from oh-my-opencode dev branch**
**Source**: `/Users/cosmos/Documents/opensource/oh-my-opencode/`
**Date**: 2026-02-18
