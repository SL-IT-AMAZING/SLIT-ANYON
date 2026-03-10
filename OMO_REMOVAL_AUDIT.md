# EXHAUSTIVE AUDIT: oh-my-opencode References in ANYON

**Date**: March 9, 2026  
**Scope**: Complete removal of oh-my-opencode default plugin installation  
**Status**: READY FOR PATCHING

---

## EXECUTIVE SUMMARY

Found **7 executable code paths** + **2 documentation references** + **1 build configuration** that install, configure, or reference oh-my-opencode:

1. **RUNTIME INITIALIZATION** (Electron app startup)
2. **ENTITLEMENT-DRIVEN CONFIG** (Plan-based model preset application)
3. **VENDOR BINARY FETCHING** (Npm package download script)
4. **BUILD CONFIGURATION** (Electron Forge bundling)
5. **ENGINE INTEGRATION** (Installer references - separate repo)
6. **DOCUMENTATION** (Setup guides, internal notes - docs-only)

---

## DETAILED FINDINGS

### 1. RUNTIME: setupOpenCodeConfig() - EXECUTABLE

**Files Involved:**
- **Implementation**: `src/ipc/utils/opencode_config_setup.ts` (199 lines)
- **Caller**: `src/main.ts` (line 24: import, line 237: call)
- **Secondary Usage**: `src/main/entitlement.ts` (line 3: import, line 403: calls updateOmocConfig)

**Behavior Type**: EXECUTABLE / RUNTIME STARTUP

**What It Does:**
1. Checks if oh-my-opencode binary is available via `getOmocBinaryPath()`
2. If not configured, runs: `oh-my-opencode install --no-tui --claude=yes`
3. Applies default LIGHT_PRESET model configuration to oh-my-opencode.json

**Call Stack:**
```
src/main.ts:237
  ↓
setupOpenCodeConfig() [async, non-blocking]
  ├─ getOpenCodeConfigDir() - resolves ~/.config/opencode/
  ├─ isOmocConfigured() - checks for oh-my-opencode.json
  ├─ getOmocBinaryPath() - loads vendor binary [src/ipc/utils/vendor_binary_utils.ts]
  └─ runOmocInstall() - spawns process with --no-tui --claude=yes
      └─ updateOmocConfig(LIGHT_PRESET) - writes ~/.config/opencode/oh-my-opencode.json
```

**Exact Code Snippets:**

```typescript
// src/ipc/utils/opencode_config_setup.ts:33-95
function runOmocInstall(omocBinaryPath: string): Promise<void> {
  return new Promise((resolve) => {
    logger.info(
      `Running OMOC install: ${omocBinaryPath} install --no-tui --claude=yes`,
    );
    const child = spawn(
      omocBinaryPath,
      ["install", "--no-tui", "--claude=yes"],  // ← HARDCODED DEFAULT
      { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env } }
    );
    // ... timeout handling, exit handling
  });
}
```

```typescript
// src/ipc/utils/opencode_config_setup.ts:162-189
export async function setupOpenCodeConfig(): Promise<void> {
  // ...
  const omocPath = getOmocBinaryPath();
  if (!omocPath) { return; }
  
  await runOmocInstall(omocPath);
  
  // Apply Light preset as default for fresh installs.
  try {
    updateOmocConfig({
      agents: {
        Sisyphus: { model: "anthropic/claude-sonnet-4-5" },
        oracle: { model: "openai/gpt-5.2", variant: "high" },
        // ... 7 more agents with LIGHT tier defaults
      },
      categories: {
        // ... 8 category defaults
      },
    });
  } catch (presetErr) { /* ... */ }
}
```

```typescript
// src/main.ts:237
void setupOpenCodeConfig().catch((err) => {
  logger.error("OpenCode config setup failed:", err);
});
```

**Remove/Replace:**
- Remove import and call from `src/main.ts`
- Delete or refactor `src/ipc/utils/opencode_config_setup.ts`
- Remove `updateOmocConfig()` calls

---

### 2. ENTITLEMENT: applyModelPreset() - EXECUTABLE

**Files Involved:**
- **Implementation**: `src/main/entitlement.ts` (lines 398-410, 66-115)
- **Behavior Type**: EXECUTABLE / PLAN-TRIGGERED

**What It Does:**
1. After entitlement sync, applies model preset to oh-my-opencode.json based on subscription plan
2. Uses `PRO_PRESET` (Opus models) for pro/power, `LIGHT_PRESET` (Sonnet models) for free/starter

**Call Stack:**
```
src/main/entitlement.ts:383-384
  ↓
applyModelPreset(plan)
  ├─ Selects PRO_PRESET or LIGHT_PRESET based on plan
  └─ updateOmocConfig(preset) [from src/ipc/utils/opencode_config_setup.ts]
      └─ Writes to ~/.config/opencode/oh-my-opencode.json
```

**Exact Code Snippets:**

```typescript
// src/main/entitlement.ts:65-87
export const PRO_PRESET: ModelPreset = {
  agents: {
    Sisyphus: { model: "anthropic/claude-opus-4-6" },  // ← Pro tier
    oracle: { model: "openai/gpt-5.3", variant: "high" },
    // ... pro configs
  },
  categories: { /* ... */ },
} as const;

export const LIGHT_PRESET: ModelPreset = {
  agents: {
    Sisyphus: { model: "anthropic/claude-sonnet-4-5" },  // ← Light tier
    oracle: { model: "openai/gpt-5.3", variant: "high" },
    // ... light configs
  },
  categories: { /* ... */ },
} as const;
```

```typescript
// src/main/entitlement.ts:383-385
applyModelPreset(state.plan).catch((err) =>
  logger.error("Failed to apply model preset after sync:", err),
);
```

```typescript
// src/main/entitlement.ts:398-410
export async function applyModelPreset(
  plan: "free" | "starter" | "pro" | "power",
): Promise<void> {
  const preset = plan === "pro" || plan === "power" ? PRO_PRESET : LIGHT_PRESET;
  try {
    updateOmocConfig(preset);  // ← WRITES TO OMOC CONFIG
    logger.info(`Applied ${plan === "pro" || plan === "power" ? "Pro" : "Light"} model preset...`);
  } catch (error) {
    logger.error("Failed to apply model preset:", error);
  }
}
```

**Remove/Replace:**
- Delete `PRO_PRESET` and `LIGHT_PRESET` constants (or repurpose for new plugin)
- Remove `applyModelPreset()` function
- Remove call in `syncEntitlements()` (line 383)
- Remove import of `updateOmocConfig` from `opencode_config_setup.ts`

---

### 3. VENDOR BINARY FETCHING: fetch-vendor-binaries.ts - EXECUTABLE

**File**: `scripts/fetch-vendor-binaries.ts` (352 lines)  
**Behavior Type**: EXECUTABLE / BUILD/SETUP SCRIPT

**What It Does:**
1. Downloads oh-my-opencode binary from npm registry for current platform
2. Extracts and signs binary (on macOS)
3. Records version in `vendor/versions.json`

**Exact Code Snippets:**

```typescript
// scripts/fetch-vendor-binaries.ts:247-303
async function fetchOmoc(): Promise<string> {
  const packageName = `oh-my-opencode-${platform}-${arch}`;
  let version = process.env.OMOC_VERSION;

  if (!version) {
    console.log(`📦 Fetching latest Oh-My-OpenCode version...`);
    const metaUrl = `https://registry.npmjs.org/${packageName}/latest`;
    const res = await fetchWithRetry(metaUrl);
    const meta = (await res.json()) as { version: string };
    version = meta.version;
  }

  const tarballUrl = `https://registry.npmjs.org/${packageName}/-/${packageName}-${version}.tgz`;
  const outDir = join(VENDOR_DIR, "oh-my-opencode", "bin");  // ← HARDCODED PATH
  
  // ... download, extract, sign ...
  
  const binaryName = `oh-my-opencode${exeExt}`;
  const srcBin = join(tmpDir, "package", "bin", binaryName);
  const destBin = join(outDir, binaryName);
  copyFileSync(srcBin, destBin);  // ← COPIES BINARY
  
  // ... chmod, codesign ...
  
  return version;
}
```

```typescript
// scripts/fetch-vendor-binaries.ts:327-338
async function main(): Promise<void> {
  // ... fetchOpenCode() ...
  
  try {
    omocVersion = await fetchOmoc();  // ← CALLED IN MAIN
  } catch (err) {
    console.error(`\n❌ Failed to fetch Oh-My-OpenCode: ...`);
    process.exit(1);
  }
  
  const versions = {
    opencode: opencodeVersion,
    "oh-my-opencode": omocVersion,  // ← RECORDED
    // ...
  };
}
```

**Usage**:
- Called via `npm run fetch-vendor` (package.json line 39)
- Run before `npm run build` to populate `vendor/oh-my-opencode/`

**Remove/Replace:**
- Delete `fetchOmoc()` function entirely
- Remove call from `main()` 
- Remove from versions tracking
- May need to keep `fetchOpenCode()` if anyon app needs opencode binary

---

### 4. BUILD CONFIGURATION: forge.config.ts - EXECUTABLE (BUILD)

**File**: `forge.config.ts`  
**Behavior Type**: EXECUTABLE / BUILD-TIME

**What It Does:**
1. Includes `vendor/oh-my-opencode` directory in electron-forge extraResources
2. Bundles oh-my-opencode binary with packaged app

**Exact Code Snippet:**

```typescript
// forge.config.ts (lines ~270-280, structure inferred from grep)
extraResource: [
  "node_modules/dugite/git",
  "node_modules/@vscode",
  ...(fs.existsSync("vendor/opencode") ? ["vendor/opencode"] : []),
  ...(fs.existsSync("vendor/oh-my-opencode")  // ← CONDITIONAL INCLUDE
    ? ["vendor/oh-my-opencode"]
    : []),
  ...(fs.existsSync("preview-dists") ? ["preview-dists"] : []),
],
```

**Remove/Replace:**
- Delete the conditional block for `vendor/oh-my-opencode`
- Keep `vendor/opencode` if still needed

---

### 5. VENDOR BINARY RESOLUTION: vendor_binary_utils.ts - EXECUTABLE

**File**: `src/ipc/utils/vendor_binary_utils.ts` (89 lines)  
**Behavior Type**: EXECUTABLE / RUNTIME

**What It Does:**
1. `getOmocBinaryPath()` - locates bundled oh-my-opencode binary
2. `resolveVendorBinaries()` - sets env vars and logs binary paths

**Exact Code Snippets:**

```typescript
// src/ipc/utils/vendor_binary_utils.ts:35-60
export function getOmocBinaryPath(): string | null {
  const execName =
    os.platform() === "win32" ? "oh-my-opencode.exe" : "oh-my-opencode";

  const binaryPath = !app.isPackaged
    ? path.join(app.getAppPath(), "vendor", "oh-my-opencode", "bin", execName)
    : path.join(process.resourcesPath, "oh-my-opencode", "bin", execName);

  if (!fs.existsSync(binaryPath)) {
    logger.warn(
      `Bundled Oh-My-OpenCode binary not found at: ${binaryPath}. Run \`npm run fetch-vendor\` to download vendor binaries.`,
    );
    return null;
  }

  try {
    fs.accessSync(binaryPath, fs.constants.X_OK);
  } catch {
    logger.warn(
      `Bundled Oh-My-OpenCode binary is not executable: ${binaryPath}. Check file permissions.`,
    );
    return null;
  }

  return binaryPath;
}
```

```typescript
// src/ipc/utils/vendor_binary_utils.ts:62-89
export function resolveVendorBinaries(): void {
  const opencodePath = getOpenCodeBinaryPath();
  if (opencodePath) { /* ... */ }

  const omocPath = getOmocBinaryPath();  // ← CALLED HERE
  if (omocPath) {
    logger.info(`Bundled Oh-My-OpenCode binary found: ${omocPath}`);
  }
}
```

**Usage**:
- Called from `src/main.ts:116` during app startup

**Remove/Replace:**
- Delete `getOmocBinaryPath()` function
- Remove call from `resolveVendorBinaries()`
- May keep `resolveVendorBinaries()` if opencode binary still needed

---

### 6. ENGINE INSTALLER - EXECUTABLE (SEPARATE REPO)

**Files in engine/src/cli/:**
- `cli-installer.ts` (208 lines) - references anyon plugin, not oh-my-opencode directly
- `detect-current-config.ts` - filters plugins to exclude oh-my-opencode

**Behavior Type**: EXECUTABLE / INTERACTIVE INSTALLER

**What It Does:**
1. `cli-installer.ts` adds "anyon plugin" to opencode config (lines 75-83)
2. Excludes oh-my-opencode when detecting current config

**Exact Code Snippet:**

```typescript
// engine/src/cli/cli-installer.ts:75-83
printStep(step++, totalSteps, "Adding anyon plugin...");
const pluginResult = await addPluginToOpenCodeConfig(version);
if (!pluginResult.success) {
  printError(`Failed: ${pluginResult.error}`);
  return 1;
}
printSuccess(
  `Plugin ${isUpdate ? "verified" : "added"} ${SYMBOLS.arrow} ${color.dim(pluginResult.configPath)}`,
);
```

```typescript
// engine/src/cli/config-manager/detect-current-config.ts (inferred)
(p) => p.startsWith("@anyon-cli/anyon") || p.startsWith("oh-my-opencode")
// ↑ FILTERS OUT oh-my-opencode when detecting plugins
```

**Note**: Engine is separate repo; changes needed there too if you're replacing OMOC plugin.

---

## 7. DOCUMENTATION - DOCS-ONLY (NOT EXECUTABLE)

**Files**:
1. `OMO_QUICK_REFERENCE.md` - Reference notes
2. `OMO_ONBOARDING_MAP.md` - Example install commands
3. `README_OMO_RESEARCH.md` - Research documentation
4. `PLAN_TIER_BRANCHING_LOGIC.md` - Model tier explanation
5. Various analysis docs

**Behavior Type**: DOCUMENTATION ONLY

**Note**: These are internal notes and can be left as-is or deleted. They don't affect runtime.

---

## SUMMARY TABLE

| # | File | Type | Behavior | Action |
|---|------|------|----------|--------|
| 1 | `src/ipc/utils/opencode_config_setup.ts` | Executable | Initializes OMOC config, runs install | **DELETE or REFACTOR** |
| 2 | `src/main.ts:24,237` | Executable | Imports & calls setupOpenCodeConfig() | **REMOVE IMPORT & CALL** |
| 3 | `src/main/entitlement.ts:3,383,398-410` | Executable | Applies model presets to OMOC | **REMOVE PRESET LOGIC** |
| 4 | `src/ipc/utils/vendor_binary_utils.ts:35-60` | Executable | Resolves OMOC binary path | **DELETE FUNCTION** |
| 5 | `scripts/fetch-vendor-binaries.ts:247-303` | Executable | Downloads OMOC from npm | **DELETE FUNCTION** |
| 6 | `forge.config.ts` | Build config | Bundles OMOC in app | **REMOVE CONDITIONAL** |
| 7 | `engine/src/cli/` | Executable | Installer references | **Update in engine repo** |
| 8+ | `*.md` docs | Documentation | Reference/guide | *Leave or delete* |

---

## RECOMMENDED PATCHING ORDER

1. **Remove initialization** (src/main.ts)
   - Delete `setupOpenCodeConfig()` import
   - Delete call to `setupOpenCodeConfig()`

2. **Remove entitlement-driven config** (src/main/entitlement.ts)
   - Delete `PRO_PRESET` and `LIGHT_PRESET`
   - Delete `applyModelPreset()` function
   - Remove call from `syncEntitlements()`

3. **Remove unused modules** (src/ipc/utils/)
   - Delete `opencode_config_setup.ts` OR refactor for new plugin
   - Delete `getOmocBinaryPath()` from `vendor_binary_utils.ts`

4. **Remove vendor script** (scripts/)
   - Delete `fetchOmoc()` from `fetch-vendor-binaries.ts`
   - Update main() to skip OMOC fetch

5. **Update build config** (forge.config.ts)
   - Remove `vendor/oh-my-opencode` from extraResource array

6. **Update engine installer** (separate repo)
   - Remove oh-my-opencode filtering from `detect-current-config.ts`
   - Update CLI installer documentation

---

## VERIFICATION CHECKLIST

After patching:

- [ ] `npm run build` completes without errors
- [ ] `npm run ts` passes type-checking
- [ ] `npm run lint` shows no new issues
- [ ] No references to `oh-my-opencode`, `omoc`, or `OMOC` remain in src/
- [ ] `setupOpenCodeConfig` no longer called
- [ ] App startup doesn't attempt OMOC config
- [ ] Entitlement sync doesn't modify OMOC config
- [ ] Vendor binary fetch script doesn't download OMOC
- [ ] E2E tests pass (run after build)

