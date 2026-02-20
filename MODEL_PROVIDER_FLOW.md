# Model Provider Selection Flow - Complete Mapping

## Overview

When a user selects a model to chat with, the app determines the provider and creates the appropriate model client. The flow is split into **two execution modes**: E2E test mode (upstream/DB-based) and production (OpenCode-based).

---

## 1. DATA STRUCTURES

### LargeLanguageModel (User Selection)

**File**: `src/lib/schemas.ts`

```typescript
export const LargeLanguageModelSchema = z.object({
  name: z.string(), // API model name (e.g., "claude-sonnet-4-20250514")
  provider: z.string(), // Provider ID (e.g., "opencode", "openai", "anthropic")
  customModelId: z.number().optional(), // For custom models only
});

export type LargeLanguageModel = z.infer<typeof LargeLanguageModelSchema>;
```

### UserSettings (Storage)

**File**: `src/lib/schemas.ts`

```typescript
export const UserSettingsSchema = z.object({
  selectedModel: LargeLanguageModelSchema,
  providerSettings: z.record(z.string(), ProviderSettingSchema),
  // ... other settings
});
```

### LanguageModelProvider (Provider Metadata)

**File**: `src/ipc/types/language-model.ts`

```typescript
export const LanguageModelProviderSchema = z.object({
  id: z.string(), // "opencode", "openai", "custom::myapi"
  name: z.string(), // Display name
  hasFreeTier: z.boolean().optional(), // KEY: Free tier flag
  type: z.enum(["custom", "local", "cloud"]),
  isConnected: z.boolean().optional(),
  // ... other fields
});
```

---

## 2. MODEL SELECTION FLOW

### Step 1: User Selects Model in UI

**File**: `src/components/ModelPicker.tsx` (lines 102-112)

```typescript
const handleModelSelect = (model: LanguageModel, providerId: string) => {
  updateSettings({
    selectedModel: {
      name: model.apiName, // e.g., "claude-sonnet-4-20250514"
      provider: providerId, // e.g., "opencode"
    },
  });
  queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all });
  setOpen(false);
};
```

**Key Point**: When user picks a model from dropdown, the provider ID is set directly from the grouping context (the provider ID under which that model was displayed).

---

## 3. PROVIDER DETERMINATION LOGIC

### Two Execution Modes

#### Mode A: E2E Test Build (IS_TEST_BUILD = true)

**File**: `src/ipc/shared/language_model_helpers.ts` (lines 33-145)

Uses **upstream/DB-based** provider list:

- Reads from database: `language_model_providers` table
- Uses hardcoded `CLOUD_PROVIDERS` and `LOCAL_PROVIDERS` constants
- Returns merged list with custom providers

```typescript
async function getLanguageModelProvidersUpstream(): Promise<
  LanguageModelProvider[]
> {
  // 1. Query custom providers from DB
  // 2. Map CLOUD_PROVIDERS constants
  // 3. Map LOCAL_PROVIDERS constants
  // 4. Return merged list
}
```

**LOCAL_PROVIDERS** (lines 51-62 in `language_model_constants.ts`):

```typescript
export const LOCAL_PROVIDERS: Record<
  string,
  { displayName: string; hasFreeTier: boolean }
> = {
  opencode: {
    displayName: "OpenCode CLI",
    hasFreeTier: true, // ← MARKED AS FREE TIER
  },
};
```

#### Mode B: Production Build (OpenCode API)

**File**: `src/ipc/shared/language_model_helpers.ts` (lines 195-206)

Uses **OpenCode API** to get provider list:

```typescript
async function getLanguageModelProvidersOpenCode(): Promise<
  LanguageModelProvider[]
> {
  const data = await fetchProviders(); // Calls OpenCode API
  return data.all.map((p) => ({
    id: p.id,
    name: p.name,
    type: "cloud" as const,
    hasFreeTier: p.id === "opencode", // ← ONLY "opencode" is free tier
    isConnected: data.connected.includes(p.id),
  }));
}
```

**Critical Distinction**:

- In **production**: `hasFreeTier === true` ONLY when `p.id === "opencode"`
- In **test mode**: Uses the static `LOCAL_PROVIDERS.opencode.hasFreeTier` constant

---

## 4. CLIENT CREATION

### getModelClient() - Main Entry Point

**File**: `src/ipc/utils/get_model_client.ts` (lines 15-58)

```typescript
export async function getModelClient(
  model: LargeLanguageModel, // Contains {name, provider}
  settings: UserSettings,
  options?: { chatId?: number; appPath?: string },
): Promise<{
  modelClient: ModelClient;
  isEngineEnabled?: boolean;
  isSmartContextEnabled?: boolean;
  isOpenCodeMode?: boolean;
}> {
  // E2E TEST MODE
  if (IS_TEST_BUILD) {
    const result = await getModelClientUpstream(model, settings);
    return { ...result, isOpenCodeMode: false };
  }

  // PRODUCTION MODE: Use OpenCode
  const provider = createOpenCodeProvider({
    agentName: settings.selectedAgent,
    conversationId: options?.chatId
      ? `anyon-chat-${options.chatId}`
      : undefined,
    appPath: options?.appPath,
  });

  return {
    modelClient: {
      model: provider(model.name, model.provider), // Create model instance
      builtinProviderId: model.provider,
    },
    isEngineEnabled: false,
    isSmartContextEnabled: false,
    isOpenCodeMode: true, // ← Indicates OpenCode is being used
  };
}
```

### OpenCode Provider Creation

**File**: `src/ipc/utils/opencode_provider.ts` (lines 541-547)

```typescript
export function createOpenCodeProvider(
  settings: OpenCodeProviderSettings = {},
): OpenCodeProvider {
  return (modelId: string, providerID?: string): LanguageModelV2 => {
    return new OpenCodeLanguageModel(modelId, settings, providerID);
  };
}

// Usage in model:
model: provider(model.name, model.provider)
       ↓
       new OpenCodeLanguageModel("claude-sonnet-4-20250514", settings, "opencode")
```

**OpenCodeLanguageModel** sends requests with:

```typescript
const promptPayload = {
  parts: [{ type: "text", text: userMessage }],
  ...(systemPrompt && { system: systemPrompt }),
  // Only include model spec if provider is not "auto"
  ...(this.providerID &&
    this.providerID !== "auto" && {
      model: {
        providerID: this.providerID, // e.g., "opencode"
        modelID: this.modelId, // e.g., "claude-sonnet-4-20250514"
      },
    }),
  ...(this.settings.agentName && { agent: this.settings.agentName }),
};
```

---

## 5. FREE TIER DETECTION

### isFreeTierProvider() - Chat Stream Context

**File**: `src/ipc/handlers/chat_stream_handlers.ts` (lines 119-124)

```typescript
async function isFreeTierProvider(providerId: string): Promise<boolean> {
  const providers = await getLanguageModelProviders();
  return providers.some((provider) => {
    return provider.id === providerId && provider.hasFreeTier === true;
  });
}
```

**Usage in Chat Handlers**:

```typescript
if (!(await isFreeTierProvider(settings.selectedModel.provider))) {
  // Apply credit checking, usage tracking, etc.
}
```

### isFreeTierModel() - Entitlement Context

**File**: `src/ipc/handlers/entitlement_handlers.ts` (lines 17-43)

```typescript
async function isFreeTierModel(modelId: string): Promise<boolean> {
  const settings = readSettings();
  const providers = await getLanguageModelProviders();

  // Check if currently selected model is free tier
  const selectedProvider = providers.find(
    (provider) => provider.id === settings.selectedModel.provider,
  );
  if (
    settings.selectedModel.name === modelId &&
    selectedProvider?.hasFreeTier === true
  ) {
    return true; // ← Selected model is from free tier provider
  }

  // Check if modelId is in ANY free tier provider
  const freeTierProviders = providers.filter(
    (provider) => provider.hasFreeTier === true,
  );

  for (const provider of freeTierProviders) {
    const models = await getLanguageModels({ providerId: provider.id });
    if (models.some((model) => model.apiName === modelId)) {
      return true; // ← Model exists in free tier provider
    }
  }

  return false;
}
```

**Usage**:

```typescript
createTypedHandler(entitlementContracts.checkCredits, async (_, input) => {
  if (await isFreeTierModel(input.modelId)) {
    return {
      allowed: true,
      creditsRemaining: 0,
      plan: "free" as const,
      usagePercent: 0,
    };
  }
  return checkCreditsForModel(input.modelId);
});
```

---

## 6. SCENARIOS & TRUTH TABLE

### Scenario 1: OpenCode CLI Model Selection (Production)

```
User selects: "Claude Sonnet 4" from "OpenCode CLI" provider group

Settings saved:
  selectedModel: {
    name: "claude-sonnet-4-20250514",
    provider: "opencode"
  }

Provider lookup:
  ✓ getLanguageModelProviders() → finds provider with id="opencode"
  ✓ provider.hasFreeTier === true

isFreeTierProvider("opencode") → true
isFreeTierModel("claude-sonnet-4-20250514") → true

Effect:
  - Credit checks skipped
  - No usage tracking
  - isOpenCodeMode: true in model client
```

### Scenario 2: OpenAI Model Selection (Production)

```
User selects: "GPT-4" from "OpenAI" provider group

Settings saved:
  selectedModel: {
    name: "gpt-4",
    provider: "openai"
  }

Provider lookup:
  ✓ getLanguageModelProviders() → finds provider with id="openai"
  ✗ provider.hasFreeTier === undefined (or false)

isFreeTierProvider("openai") → false
isFreeTierModel("gpt-4") → false

Effect:
  - Credit checks applied
  - Usage tracking enabled
  - isOpenCodeMode: false (uses upstream routing)
```

### Scenario 3: Custom Provider Model (Production)

```
User has custom provider "my-api" set up

User selects: "custom-model-1" from "my-api" group

Settings saved:
  selectedModel: {
    name: "custom-model-1",
    provider: "custom::my-api"  (or whatever custom ID)
  }

Provider lookup:
  ✓ getLanguageModelProviders() → fetches from DB
  ✗ custom provider in hasFreeTier logic depends on saved settings

isFreeTierProvider("custom::my-api") → false (custom != "opencode")
isFreeTierModel("custom-model-1") → false

Effect:
  - Custom provider always requires API key setup
  - Credit checks applied
  - Usage tracking enabled
```

### Scenario 4: E2E Test Mode (Upstream)

```
E2E test with fake-llm-server

is_test_build = true

User selection → settings.selectedModel = { name, provider }

getLanguageModelProviders() calls:
  ✓ getLanguageModelProvidersUpstream() instead of OpenCode API
  ✓ Reads DB + merges LOCAL_PROVIDERS constant
  ✓ LOCAL_PROVIDERS.opencode.hasFreeTier = true

isFreeTierProvider() → true if provider="opencode"
isFreeTierModel() → true if provider="opencode"

getModelClient() calls:
  ✓ getModelClientUpstream() instead of OpenCode provider
  ✓ Bypasses OpenCode server entirely
  ✓ isOpenCodeMode: false
```

---

## 7. KEY INSIGHTS

### Provider ID is Set at Selection Time

- The provider ID comes from the model's parent group in ModelPicker
- `{ provider: providerId }` is saved to settings immediately
- Not determined by looking up the model name later

### OpenCode Distinction

1. **In Production**: Only provider with `id === "opencode"` has `hasFreeTier === true`
2. **In Tests**: Uses static `LOCAL_PROVIDERS` constant instead of OpenCode API
3. **Both paths**: Provider list + free tier flags determine behavior

### Two Independent Checks

1. **isFreeTierProvider()** - checks provider ID
2. **isFreeTierModel()** - checks if model exists in ANY free tier provider (broader)
   - First checks selected model against selected provider
   - Then scans all free tier providers for the model ID

### Client Creation is Separate from Provider Determination

- Provider determination is about **which provider supplies the model**
- Client creation is about **which implementation to use** (OpenCode vs. upstream)
- In production: almost always OpenCode
- In tests: uses upstream routing to work with fake-llm-server

---

## 8. FILE REFERENCE GUIDE

| Purpose                       | File                                         | Key Lines          |
| ----------------------------- | -------------------------------------------- | ------------------ |
| User selection UI             | `src/components/ModelPicker.tsx`             | 102-112            |
| Provider list (upstream)      | `src/ipc/shared/language_model_helpers.ts`   | 33-145             |
| Provider list (OpenCode)      | `src/ipc/shared/language_model_helpers.ts`   | 195-206            |
| Free tier constants           | `src/ipc/shared/language_model_constants.ts` | 51-62              |
| Client creation               | `src/ipc/utils/get_model_client.ts`          | 15-58              |
| OpenCode provider             | `src/ipc/utils/opencode_provider.ts`         | 541-547            |
| Free tier check (stream)      | `src/ipc/handlers/chat_stream_handlers.ts`   | 119-124            |
| Free tier check (entitlement) | `src/ipc/handlers/entitlement_handlers.ts`   | 17-43              |
| Data structures               | `src/lib/schemas.ts`                         | LargeLanguageModel |
| Type definitions              | `src/ipc/types/language-model.ts`            | 1-175              |

---

## VISUAL FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER SELECTS MODEL                                  │
│                    src/components/ModelPicker.tsx                            │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                    handleModelSelect(model, providerId)
                                   │
                    updateSettings({
                       selectedModel: {
                         name: model.apiName,
                         provider: providerId
                       }
                    })
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SETTINGS STORED IN DB                                   │
│         UserSettings.selectedModel = { name, provider }                     │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                  When chat starts or credits checked
                                   │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │  IS_TEST_BUILD       │      │  PRODUCTION BUILD    │
        │  (E2E tests)         │      │  (Real usage)        │
        └──────────┬───────────┘      └──────────┬───────────┘
                   │                             │
      getLanguageModelProvidersUpstream()    getLanguageModelProvidersOpenCode()
      (read from DB + LOCAL_PROVIDERS)       (fetch from OpenCode API)
                   │                             │
                   ▼                             ▼
        ┌──────────────────────┐      ┌──────────────────────┐
        │ LOCAL_PROVIDERS:     │      │  For each provider   │
        │ opencode: {          │      │  {                   │
        │   hasFreeTier: true  │      │    hasFreeTier:      │
        │ }                    │      │    id === "opencode" │
        │                      │      │  }                   │
        └──────────┬───────────┘      └──────────┬───────────┘
                   │                             │
                   └───────────────┬─────────────┘
                                   │
                                   ▼
        ┌─────────────────────────────────────────────┐
        │  FREE TIER CHECKS                           │
        │  isFreeTierProvider(providerId)             │
        │  isFreeTierModel(modelId)                   │
        └──────────────┬────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    hasFreeTier                  hasFreeTier
     === true                     === false
        │                             │
        ├─ Skip credits               ├─ Apply credits
        ├─ No usage tracking          ├─ Track usage
        └─ isOpenCodeMode: true       └─ Standard handling
```

---

## ANSWERING YOUR KEY QUESTIONS

### Q1: When does `isFreeTierProvider` return true vs false?

**TRUE** when:

- `provider.id === "opencode"` AND `provider.hasFreeTier === true`

**FALSE** when:

- Provider ID is anything other than "opencode"
- Provider exists but `hasFreeTier` is undefined/false

**Note**: In production, ONLY the "opencode" provider has `hasFreeTier: true`.

### Q2: Is there a scenario where OpenCode CLI models get treated as non-free-tier?

**YES, potentially in these edge cases:**

1. **Test mode with modified constants**: If `LOCAL_PROVIDERS.opencode.hasFreeTier` is changed to `false`
2. **OpenCode API returns different data**: If `getOpenCodeProviders()` returns provider data where "opencode" has `hasFreeTier: false`
3. **Provider ID mismatch**: If model is saved with `provider: "opencode-enterprise"` instead of `"opencode"`

But in normal production flow: **OpenCode models are always free tier** because the check is hardcoded as `p.id === "opencode"`.

### Q3: How is the provider determined when user picks a model?

**Direct assignment**, not lookup:

- User picks model from group labeled "OpenCode CLI"
- `providerId` parameter is "opencode"
- Settings saved: `selectedModel: { name: "...", provider: "opencode" }`
- Provider is NOT looked up from model name; it's the group the model was in
