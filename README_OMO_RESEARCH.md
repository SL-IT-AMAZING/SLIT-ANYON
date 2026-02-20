# OH-MY-OPENCODE RESEARCH & DOCUMENTATION

## 📋 Overview

This directory contains a **complete mapping** of oh-my-opencode's onboarding and plan-based model configuration system. Three complementary documents provide different levels of detail to help you understand and replicate this tier-based model differentiation system in your product.

**Source**: oh-my-opencode dev branch (latest as of Feb 18, 2026)
**Path**: `/Users/cosmos/Documents/opensource/oh-my-opencode/`

---

## 📁 Documentation Files

### 1. **OMO_QUICK_REFERENCE.md** ⚡

**Best for**: Quick lookups, implementation patterns, key insights

**Contains**:

- The 6 onboarding questions (tree structure)
- The critical `isMax20` differentiator
- Model assignments side-by-side (Max vs Standard)
- Fallback priority chains
- Core logic pseudocode
- Implementation pattern template
- 5 key insights for your product

**Read this first** if you want to understand the system quickly.

---

### 2. **OMO_ONBOARDING_MAP.md** 📖

**Best for**: Complete reference, understanding the full flow, exact requirements

**Contains**:

- Complete onboarding flow (TUI and non-TUI modes)
- All 6 questions with EXACT CODE and possible answers
- Plan tier system (3 tiers: free, pro, max)
- The critical `resolveClaudeCapability()` function
- Model capability levels (8 types)
- Complete fallback chains for each capability
- Agent-to-model mapping (9 agents)
- Category requirements
- Full model assignment tables (Max plan vs Standard plan)
- Key differentiators with explanations
- Installation output format
- CLI argument syntax
- Storage locations

**Read this** to understand every detail and have a reference document.

---

### 3. **OMO_CODE_SNIPPETS.md** 💻

**Best for**: Literal code implementation, copy-paste references, exact syntax

**Contains**:

- Verbatim TypeScript type definitions
- Exact TUI question code with all options
- Complete model fallback system
- Provider availability structure
- The critical `resolveClaudeCapability()` function
- All fallback chains as data structures
- Agent and category requirements
- Model resolution algorithm
- Main config generation function
- Test cases showing exact model differences
- Installation output display code
- Critical warning messaging
- Complete flow example with output

**Read this** when you're ready to implement and want exact code to reference or adapt.

---

## 🎯 The One Critical Concept

All three documents revolve around a **single boolean flag**:

```typescript
isMax20: boolean;
```

- **true** → Claude Max (~$200/mo) → Use OPUS models (most powerful)
- **false** → Claude Pro (~$20/mo) → Use SONNET models (cost-efficient)

This flag drives approximately **80% of the model differentiation** in the system.

---

## 🔑 Key Insights

### For Your Product Implementation

1. **Binary Plan Flag**: Use a single boolean or enum to differentiate plan tiers
2. **Capability-Based Routing**: Map plan → capability level → model
3. **Graceful Fallback Chains**: Multiple fallbacks ensure something always works
4. **Quota Protection**: Cost-conscious plans preserve expensive API quota
5. **Free Tier Always Available**: Ultimate fallback (`opencode/glm-4.7-free`) ensures zero-cost access

### Model Tier Strategy

| Tier     | Sisyphus      | Explore      | Cost     | Purpose             |
| -------- | ------------- | ------------ | -------- | ------------------- |
| **Max**  | Claude Opus   | Claude Haiku | ~$200/mo | Premium performance |
| **Pro**  | Claude Sonnet | grok-code    | ~$20/mo  | Cost-efficient      |
| **Free** | OpenCode GLM  | OpenCode GLM | $0       | Fallback-only       |

---

## 📊 The 6 Onboarding Questions

```
1. Claude Pro/Max?         → isMax20 flag (3 options)
2. OpenAI/ChatGPT?         → hasOpenAI flag
3. Google Gemini?          → hasGemini flag
4. GitHub Copilot?         → hasCopilot flag
5. OpenCode Zen?           → hasOpencodeZen flag
6. Z.ai Coding Plan?       → hasZaiCodingPlan flag
```

**Only question #1 affects the plan tier.** Questions 2-6 are provider options.

---

## 🔗 File Cross-References

If you're reading the full map and need to jump to code, here are the key files:

| Concept                | File                   | Lines   |
| ---------------------- | ---------------------- | ------- |
| TUI Questions          | install.ts             | 178-261 |
| Type Definitions       | types.ts               | 1-41    |
| Model Resolution       | model-fallback.ts      | 49-182  |
| Core Config Generation | model-fallback.ts      | 184-242 |
| Test Cases             | config-manager.test.ts | 204-364 |
| Installation Output    | install.ts             | 35-59   |
| Critical Warning       | install.ts             | 352-364 |

---

## 🚀 Quick Start for Implementation

### Step 1: Understand the System

→ Read **OMO_QUICK_REFERENCE.md**

### Step 2: Deep Dive

→ Read **OMO_ONBOARDING_MAP.md**

### Step 3: Implementation

→ Reference **OMO_CODE_SNIPPETS.md** + adapt code to your stack

### Step 4: Implementation Pattern (from Quick Reference)

```typescript
// 1. Capture plan tier during onboarding
// 2. Map tier to capability level (high/mid/low)
// 3. Map capability to model for each agent
// 4. Implement fallback chains for resilience
// 5. Generate config and store it
```

---

## ✨ Special Cases to Handle

### 1. Explore Agent (Different Logic)

- **Max Plan**: Uses Claude Haiku (consumes Claude quota)
- **Standard Plan**: Uses grok-code (preserves Claude Pro quota)

### 2. Librarian Agent (Override)

- If Z.ai available: **Always uses Z.ai** regardless of plan
- Otherwise: Follows normal fallback chain

### 3. No Providers Selected

- All agents/categories → `opencode/glm-4.7-free` (ultimate fallback)
- System shows critical warning about degraded performance

### 4. Oracle Agent (Plan-Independent)

- Always uses `openai/gpt-5.2-codex` if OpenAI available
- Plan doesn't affect this agent's model

---

## 🎓 Architecture Highlights

### Capability System

```
"unspecified-high" ← Max Plan users ← Opus models
"unspecified-low"  ← Pro Plan users ← Sonnet models
"quick"            ← Haiku models
"ultrabrain"       ← GPT-5.2-codex
"visual-engineering" ← Gemini 3 Pro
"artistry"         ← Gemini 3 Pro
"writing"          ← Gemini 3 Flash
"glm"              ← OpenCode GLM free
```

### Fallback Priority

1. Native providers (Claude/OpenAI/Gemini)
2. OpenCode Zen
3. GitHub Copilot
4. Z.ai
5. Ultimate fallback (opencode/glm-4.7-free)

### Config Storage

Generated as JSON at: `~/.config/opencode/omo-config.json`

Contains: `agents` and `categories` objects with model assignments

---

## 🔍 How to Navigate This Documentation

**If you want to...** → **Read this section**

- Understand the system in 5 minutes → OMO_QUICK_REFERENCE.md (full)
- See the exact onboarding questions → OMO_ONBOARDING_MAP.md (section: "EXACT QUESTIONS ASKED")
- Understand model selection logic → OMO_ONBOARDING_MAP.md (section: "MODEL ASSIGNMENT LOGIC")
- See model differences by plan → OMO_ONBOARDING_MAP.md (section: "ACTUAL MODEL VALUES")
- Copy type definitions → OMO_CODE_SNIPPETS.md (section 1)
- See the TUI code → OMO_CODE_SNIPPETS.md (section 2)
- Understand config generation → OMO_CODE_SNIPPETS.md (section 4)
- See test cases → OMO_CODE_SNIPPETS.md (section 5)
- Implement in your product → OMO_QUICK_REFERENCE.md (implementation pattern section)

---

## 📝 Document Statistics

- **OMO_QUICK_REFERENCE.md**: 170 lines, ~5KB
  - Best for: Quick lookups, patterns, insights
- **OMO_ONBOARDING_MAP.md**: 693 lines, ~21KB
  - Best for: Complete reference, specifications
- **OMO_CODE_SNIPPETS.md**: 562 lines, ~16KB
  - Best for: Implementation, exact code

**Total**: 1,425 lines of detailed documentation

---

## 🏆 Key Takeaways for Your Product

1. **One boolean flag per plan tier** is sufficient to drive model differentiation
2. **Fallback chains** ensure graceful degradation when preferred providers aren't available
3. **Capability levels** abstract model selection from business logic
4. **User-centric onboarding** asks only relevant questions (6 total)
5. **Cost protection** for standard-tier users (preserve expensive quota for orchestrator)

---

## 📚 Source Repository

**Repository**: https://github.com/code-yeongyu/oh-my-opencode
**Branch**: `dev` (as of Feb 18, 2026)
**Key Files Analyzed**:

- `src/cli/install.ts` (524 lines)
- `src/cli/types.ts` (41 lines)
- `src/cli/model-fallback.ts` (247 lines)
- `src/cli/config-manager.ts` (642 lines)
- `src/cli/config-manager.test.ts` (365 lines)

---

## ✅ Verification Checklist

After reading this documentation, you should understand:

- [ ] The 6 onboarding questions and what they ask
- [ ] How the `isMax20` flag drives model selection
- [ ] The 3 plan tiers (free/pro/max)
- [ ] Why Sisyphus uses Opus vs Sonnet
- [ ] Why Explore uses Haiku vs grok-code
- [ ] How fallback chains work
- [ ] Why Z.ai Librarian overrides plan-based selection
- [ ] How to replicate this in your product

If you've checked all boxes, you're ready to implement this system!

---

**Generated**: February 18, 2026
**Source**: oh-my-opencode dev branch
**For**: ANYON B2C Plan-Based Model Configuration
