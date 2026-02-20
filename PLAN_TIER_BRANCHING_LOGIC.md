# Plan-Tier Branching Logic - Copy-Paste Ready

## THE EXACT CONDITION THAT DETERMINES MODEL ASSIGNMENT

### Location: oh-my-opencode/src/cli/model-fallback.ts, Lines 108-113

```typescript
const fallbackChain =
  cat === "unspecified-high" && !avail.isMaxPlan
    ? CATEGORY_MODEL_REQUIREMENTS["unspecified-low"].fallbackChain
    : req.fallbackChain;
```

### Human-Readable Logic

```
IF (category is "unspecified-high") AND (user does NOT have max plan):
  USE "unspecified-low" model chain (downgrade)
ELSE:
  USE the category's normal model chain
```

---

## HOW THE FLAG GETS SET

### CLI Argument → Config Flag

**Location: oh-my-opencode/src/cli/install-validators.ts, Line 156**

```typescript
isMax20: args.claude === "max20",
```

### Config → ProviderAvailability

**Location: oh-my-opencode/src/cli/provider-availability.ts, Line 15**

```typescript
isMaxPlan: config.isMax20,
```

---

## MODEL TIER MAPPING

### High-Tier Models (Only when isMaxPlan = true)

```
Category: unspecified-high
├─ Claude: opus-4-6 (variant: max)
├─ OpenAI: gpt-5.2 (variant: high)
└─ Google: gemini-3-pro
```

### Low-Tier Models (Fallback when isMaxPlan = false)

```
Category: unspecified-low (substituted for unspecified-high)
├─ Claude: sonnet-4-5
├─ OpenAI: gpt-5.3-codex (variant: medium)
└─ Google: gemini-3-flash
```

---

## IMPLEMENTATION PSEUDO-CODE FOR YOUR PRODUCT

```typescript
interface SubscriptionTier {
  isFree: boolean;
  isStandard: boolean;
  isMax20: boolean; // or isPremium, or any 20x-equivalent
}

function getModelForCategory(
  category: string,
  subscription: SubscriptionTier,
  modelRequirements: ModelRegistry,
): Model {
  // If it's a "premium only" category and user doesn't have max plan
  if (category === "unspecified-high" && !subscription.isMax20) {
    // Return the downgraded (standard) model chain
    return modelRequirements["unspecified-low"].chain;
  }

  // Otherwise return the category's normal model chain
  return modelRequirements[category].chain;
}
```

---

## CLI USAGE EXAMPLES

```bash
# STANDARD PLAN (claude === "yes")
bunx oh-my-opencode install --no-tui --claude=yes ...
→ isMax20 = false
→ unspecified-high tasks get unspecified-low models

# MAX 20x PLAN (claude === "max20")
bunx oh-my-opencode install --no-tui --claude=max20 ...
→ isMax20 = true
→ unspecified-high tasks get unspecified-high models

# NO CLAUDE (claude === "no")
bunx oh-my-opencode install --no-tui --claude=no ...
→ isMax20 = false
→ unspecified-high tasks get unspecified-low models
```

---

## KEY FILES TO INSPECT

1. **Decision Point**: `src/cli/install-validators.ts` → `argsToConfig()`
   - Where `--claude=max20` becomes `isMax20 = true`

2. **Application Point**: `src/cli/model-fallback.ts` → `generateModelConfig()`
   - Where plan tier affects model selection (Lines 108-113)

3. **Model Registry**: `src/shared/model-requirements.ts`
   - Where high-tier vs low-tier model chains are defined

4. **Type Definitions**: `src/cli/types.ts`
   - ClaudeSubscription type (line 1)
   - InstallConfig.isMax20 property (line 18)

---

## WHAT CHANGES BETWEEN PLANS

### Per-Agent Model Changes

- **Sisyphus**: Opus 4.6 max (high-tier) → Uses fallback chain equally regardless of plan
- **Explore**: Always uses Haiku (plan tier doesn't affect)

### Per-Category Model Changes

- **unspecified-high**: Opus/GPT-5.2/Gemini-3-pro → Sonnet-4.5/GPT-5.3-codex/Gemini-3-flash
- **unspecified-low**: No change (always has single tier)
- **All others**: No change based on plan tier

This is **NOT** a wholesale model replacement system. It's very targeted to one category: `unspecified-high`.

---

## TESTING THIS BEHAVIOR

Look for tests with "isMax20" in the filename:

- `src/cli/model-fallback.test.ts` - Contains ~10+ test cases with "isMax20 flag" in the name
- `src/cli/__snapshots__/model-fallback.test.ts.snap` - Snapshot showing exact model assignments

Search for this exact pattern in tests:

```typescript
const config = createConfig({ hasClaude: true, isMax20: true });
```

This pattern is used to create a max-plan config and verify the model outputs change accordingly.
