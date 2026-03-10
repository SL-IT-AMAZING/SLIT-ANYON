# Monorepo Migration: Root + Engine Coupling Analysis

**Date:** 2026-03-10  
**Status:** Comprehensive reconnaissance complete  
**Scope:** Identify all integration points and migration risks for merging ANYON root repo + engine submodule into single monorepo

---

## Executive Summary

The engine is currently a **git submodule** (anyon-cli) with **light coupling** to the root repo. Most integration happens via:
1. NPM dependency references to published `@anyon-cli/anyon` package
2. Vendoring of pre-built binaries via `npm run fetch-vendor`
3. Environment variable configuration for local dev (`ANYON_ENGINE_URL`)
4. OpenCode plugin configuration

**Risk Level: LOW** — The repos are cleanly separated by design. Migration is straightforward.

---

## Current Architecture

### Repo Structure

```
/Users/cosmos/Documents/an/ANYON-b2c/
├── .git/                           # Root git repo
├── .gitmodules                     # Submodule config (engine)
├── engine/                         # Git submodule (separate repo clone)
│   ├── .git/                       # Points to ../.git/modules/engine
│   ├── package.json                # Monorepo consumer: @anyon-cli/anyon@0.2.4
│   ├── src/                        # 5530+ source files
│   └── dist/                       # Pre-built distribution
├── src/                            # Root app (Electron + React)
│   └── ipc/utils/                 # OpenCode config managers
├── package.json                    # Root package: anyon@1.0.1
├── .github/workflows/
│   ├── ci.yml                     # CI pipeline
│   └── release.yml                # Release pipeline
└── scripts/
    └── fetch-vendor-binaries.ts   # Downloads OpenCode + OMOC
```

### Key Repositories & Remotes

| Entity | URL | Role |
|--------|-----|------|
| **Root** | `https://github.com/SL-IT-AMAZING/SLIT-ANYON.git` | Desktop app (Electron) |
| **Engine** | `https://github.com/SL-IT-AMAZING/anyon-cli.git` | CLI/agent harness (Node.js + Bun) |
| **Submodule config** | `.gitmodules` | Points engine to branch `dev` |

---

## Integration Points & Coupling

### 1. **Git Submodule Coupling** ⚠️ HIGH RISK

**File:** `.gitmodules`
```
[submodule "engine"]
    path = engine
    url = https://github.com/SL-IT-AMAZING/anyon-cli.git
    branch = dev
```

**Issues:**
- `engine/.git` is a file containing `gitdir: ../.git/modules/engine`
- Submodule is pinned to branch `dev`, not a specific commit (unusual)
- Cloning root repo requires `git submodule update --init --recursive`
- Pushing engine changes separately from root (two-step publish)
- CI workflows assume submodule already initialized

**Migration Impact:**
- **MUST** remove `.gitmodules` file
- **MUST** flatten engine into `./engine/` directory within root git history
- **MUST** update CI/checkout steps (no more submodule init)
- **DECISION:** Keep `engine/` at root or move to `./packages/engine/`?

---

### 2. **Package.json Dependencies** 🟡 MEDIUM RISK

**Root Package:** `package.json`
```json
{
  "name": "anyon",
  "version": "1.0.1",
  "description": "AI coding editor by SLIT",
  // NO direct dependency on @anyon-cli/anyon
  // (Because engine is vendored, not installed via npm)
}
```

**Engine Package:** `engine/package.json`
```json
{
  "name": "@anyon-cli/anyon",
  "version": "0.2.4",
  "main": "dist/index.js",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } },
  "scripts": {
    "build": "bun build src/index.ts --outdir dist ... && bun run build:schema",
    "prepublishOnly": "bun run clean && bun run build"
  }
}
```

**Issues:**
- Root app does NOT install `@anyon-cli/anyon` from npm (wouldn't work locally)
- Instead, root uses vendored binaries (downloaded via `fetch-vendor`)
- Engine is published separately to npm registry for external users
- Version mismatch risk: root v1.0.1, engine v0.2.4

**Integration Points in Root Code:**
- `src/ipc/utils/app_scoped_opencode_config.ts` → references `@anyon-cli/anyon@latest`
- `src/ipc/utils/opencode_config_setup.ts` → configures plugin entry

**Migration Impact:**
- Can add `engine` as workspace dependency if needed: `"@anyon-cli/anyon": "workspace:*"`
- OR keep engine as separate npm package (publish step remains unchanged)
- NO code changes required to integrations (they reference published package)

---

### 3. **Vendoring & Binary Fetching** 🔴 CRITICAL

**Script:** `scripts/fetch-vendor-binaries.ts`
```typescript
async function fetchOpenCode(): Promise<string> {
  const version = process.env.OPENCODE_VERSION;
  const baseUrl = `https://github.com/anomalyco/opencode/releases/latest/download`;
  const archiveFilename = `opencode-${platform}-${arch}.${ext}`;
  const outDir = join(VENDOR_DIR, "opencode", "bin");
  // ... downloads OpenCode CLI binary, NOT engine binary
}
```

**What it does:**
- Downloads pre-built **OpenCode** CLI binary (not engine)
- Saves to `vendor/opencode/bin/`
- Stores manifest in `vendor/versions.json`
- Does NOT download engine binaries

**Migration Impact:**
- Vendoring script continues to work unchanged
- Engine's `postinstall.mjs` handles its own platform binary selection
- NO changes needed

---

### 4. **Electron Build & Packaging** 🟡 MEDIUM RISK

**File:** `forge.config.ts` (Electron Forge config)

**Current ignore rules:**
```typescript
const ignore = (file: string) => {
  if (file === "/node_modules") return false;    // Keep node_modules
  if (file.startsWith("/drizzle")) return false; // Keep drizzle migrations
  if (file.startsWith("/scaffold")) return false;
  if (file.startsWith("/workers")) return false;
  if (file.startsWith("/.vite")) return false;
  return true;  // Ignore everything else
};
```

**Issues:**
- Does NOT preserve engine directory (would be ignored)
- Engine is pre-built to `dist/` but that's vendored separately
- Root app doesn't package engine sources (not needed)

**Migration Impact:**
- If engine sources move into monorepo root, add to ignore rules:
  ```typescript
  if (file.startsWith("/engine")) return false; // if keeping engine sources
  ```
- OR if engine is pre-built during monorepo build, no changes needed

---

### 5. **CI/CD Workflows** 🔴 CRITICAL

**File:** `.github/workflows/ci.yml`

**Current flow:**
```yaml
jobs:
  build:
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          # NO submodule initialization — assumes engine already cloned
      
      - name: Install node modules
        run: npm ci --no-audit --no-fund --progress=false
      
      - name: Fetch vendor binaries
        run: npm run fetch-vendor
      
      - name: Build
        run: npm run pre:e2e
```

**Issues:**
- `actions/checkout@v4` does NOT fetch submodule by default
- Workaround: probably using `git config --global url.ssh://git@github.com/.insteadOf https://github.com/`
- OR engine is downloaded separately via other means

**File:** `.github/workflows/release.yml`

**Current flow:**
```yaml
jobs:
  build:
    strategy:
      matrix:
        os: [windows, macos-intel, macos]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Install & build
        run: npm ci && npm run fetch-vendor && npm run pre:e2e
      
      - name: Publish
        run: npm run publish  # Electron Forge publish (GitHub releases)
```

**Issues:**
- Release CI ALSO doesn't fetch submodule
- Suggests submodule cloning happens at git clone time or manually before CI

**Migration Impact:**
- **MUST** update checkout steps to include submodule init:
  ```yaml
  - uses: actions/checkout@v4
    with:
      submodules: recursive  # Remove after migration
  ```
- After migration, remove `submodules` entirely
- CI templates will work without changes once merge is complete

---

### 6. **Development Scripts** 🟡 MEDIUM RISK

**Root package.json scripts:**
```json
{
  "scripts": {
    "dev:free": "cross-env ANYON_BYPASS_ENTITLEMENT=1 npm start",
    "dev:engine": "cross-env ANYON_ENGINE_URL=http://localhost:8080/v1 npm start",
    "fetch-vendor": "npx tsx scripts/fetch-vendor-binaries.ts",
    "build": "npm run pre:e2e",
    "pre:e2e": "cross-env E2E_TEST_BUILD=true npm run package"
  }
}
```

**Current pattern:**
- `npm run dev:engine` allows running root app against local engine at `http://localhost:8080/v1`
- Engine runs on separate port, consumed via HTTP (not local import)

**Migration Impact:**
- Dev scripts work unchanged
- If adding workspace linking, consider:
  ```bash
  npm run dev:engine -- --skip-opencode  # optional convenience flag
  ```

---

### 7. **OpenCode Plugin Configuration** 🟡 MEDIUM RISK

**File:** `src/ipc/utils/app_scoped_opencode_config.ts`
```typescript
const ANYON_PLUGIN_ENTRY = "@anyon-cli/anyon@latest";

// Configures OpenCode to load Anyon plugin
// References published npm package name
```

**File:** `src/ipc/utils/opencode_config_setup.ts`
```typescript
const ANYON_PLUGIN_PACKAGE = "@anyon-cli/anyon";

// Handles OpenCode config merging
// Adds/removes plugin from OpenCode config
```

**Migration Impact:**
- Code continues to reference `@anyon-cli/anyon` (published package name)
- If using workspace, `@anyon-cli/anyon@latest` resolves to workspace version during dev
- Zero code changes required

---

### 8. **E2E Test Fixtures** 🟢 LOW RISK

**Path:** `e2e-tests/fixtures/engine/` (empty directory exists)

**Migration Impact:**
- No current usage; safe to ignore or repurpose

---

## Version Management

| Component | Current Version | Mechanism | Risk |
|-----------|-----------------|-----------|------|
| Root app | 1.0.1 | Manual in `package.json` | Mismatch with engine |
| Engine CLI | 0.2.4 | Manual in `engine/package.json` | Separate npm publish |
| OpenCode | Latest | Downloaded via script | Vendored, independent |

**Migration Consideration:** Should monorepo share a version (e.g., v2.0.0 for both)? Or keep versions independent?

---

## Migration Roadmap: Key Decisions

### Decision 1: Monorepo Structure
**Options:**
- **(A)** Flatten engine to root: `./engine/` stays at root
- **(B)** Move engine to packages: `./packages/engine/`
- **(C)** Reorganize both: `./packages/app/` + `./packages/engine/`

**Recommendation:** **(A)** — Keep `./engine/` at root for minimal disruption.

### Decision 2: Version Management
**Options:**
- **(A)** Unified version: Root + engine share version number
- **(B)** Independent versions: Each maintains own version

**Recommendation:** **(B)** — Engine is published separately to npm; independent versioning is cleaner.

### Decision 3: Dependencies & Workspace
**Options:**
- **(A)** No workspace: Keep `@anyon-cli/anyon` as published npm dependency
- **(B)** NPM workspace: Add `"packages": ["engine"]` to root `package.json`
- **(C)** Yarn/pnpm workspace: Convert to monorepo-friendly package manager

**Recommendation:** **(B)** — Light npm workspace adds convenience for dev, no build overhead.

### Decision 4: CI/CD Workflow Changes
**Changes needed:**
1. Remove submodule initialization from checkout steps
2. Update branch protection rules (single push, not two-repo publish)
3. Add engine build step to CI if not already present
4. Update release pipeline to include engine build

---

## High-Risk Areas Requiring Special Attention

### 🔴 Risk 1: Submodule Git History Loss
**What:** Moving submodule commits into root git history will be lossy
**Mitigation:**
- Preserve engine git history in separate branch before migration
- Use `git subtree` or manual merge to flatten cleanly
- Document migration in git history

### 🔴 Risk 2: CI/CD Breakage During Migration
**What:** Intermediate state where CI expects submodule but finds new structure
**Mitigation:**
- Prepare all CI changes before pushing migration commit
- Coordinate with team to avoid pushes during migration window
- Test CI on migration branch before merging to main

### 🟡 Risk 3: Engine npm Registry Publishing
**What:** Engine is published to npm; monorepo merge affects publish step
**Mitigation:**
- Continue publishing `@anyon-cli/anyon` to npm (unchanged)
- Update `prepublishOnly` script to build from monorepo location
- Add sanity check to verify build output before publishing

### 🟡 Risk 4: Binary Platform Dependencies
**What:** Engine's `postinstall.mjs` selects platform-specific binaries
**Mitigation:**
- Test `npm install` on all platforms (macOS ARM64/x64, Linux, Windows)
- Verify `postinstall.mjs` still finds binaries after migration
- No code changes needed (postinstall is platform-agnostic)

---

## Files That MUST Be Modified or Removed

| File | Current State | Action | Priority |
|------|--------------|--------|----------|
| `.gitmodules` | Submodule config | **DELETE** | 🔴 CRITICAL |
| `.git/modules/engine` | Submodule git dir | **DELETE** | 🔴 CRITICAL |
| `engine/.git` | Submodule marker | **DELETE** (auto) | 🔴 CRITICAL |
| `.github/workflows/ci.yml` | Uses submodule | **UPDATE** (remove `submodules`) | 🔴 CRITICAL |
| `.github/workflows/release.yml` | Uses submodule | **UPDATE** (remove `submodules`) | 🔴 CRITICAL |
| `forge.config.ts` | Ignores engine dir | **OPTIONAL** (add to keep) | 🟡 MEDIUM |
| `.github/dependabot.yml` | If exists | **UPDATE** (add engine) | 🟡 MEDIUM |
| `README.md` | Mentions submodule clone | **UPDATE** (simplify docs) | 🟢 LOW |

---

## Files That DON'T Need Changes

| File | Reason |
|------|--------|
| `package.json` (root) | Doesn't directly depend on engine; uses published npm package |
| `src/ipc/utils/` | References `@anyon-cli/anyon` (unchanged) |
| `scripts/fetch-vendor-binaries.ts` | Fetches OpenCode, not engine |
| `engine/package.json` | Can stay as-is (build process unchanged) |
| `engine/postinstall.mjs` | Platform-agnostic; works in monorepo |
| E2E tests | No engine-specific logic |

---

## Example Migration Commit Structure

```
commit 1: Flatten engine submodule into monorepo
  - Remove .gitmodules
  - Move engine/* to root (preserve history)
  - Update .gitignore if needed

commit 2: Update CI workflows for monorepo
  - Remove submodule checkout steps
  - Add engine build step (if not already present)
  - Update release pipeline

commit 3: Optional: Add npm workspace config
  - Update root package.json to reference engine as workspace

commit 4: Documentation updates
  - Update README with monorepo structure
  - Update CONTRIBUTING.md with new dev setup
```

---

## Success Criteria

✅ Migration is complete when:
1. `.gitmodules` and `.git/modules/engine/` are removed
2. `engine/` directory is part of root git repo with preserved history
3. CI/CD pipelines pass without submodule-related errors
4. Local `npm install && npm run build` works
5. `npm run dev:engine` still points to local server
6. `npm publish` from `engine/` still publishes to npm
7. Release pipeline builds and publishes both app + engine

---

## Next Steps (for Plan Document)

1. **Phase 1: Preparation**
   - Create backup branch: `backup/pre-monorepo-migration`
   - Document current submodule state
   - List all team members + notify them

2. **Phase 2: Git History Flattening**
   - Use `git subtree add` or manual merge to flatten engine
   - Preserve engine commit history in new structure
   - Verify root `.git` doesn't contain engine objects

3. **Phase 3: CI/CD Updates**
   - Update checkout steps in all workflows
   - Test CI on migration branch
   - Update branch protection rules

4. **Phase 4: Validation**
   - Test local dev: `npm install`, `npm run build`, `npm start`
   - Test CI on real branch
   - Test release pipeline
   - Manual QA on all platforms

5. **Phase 5: Deployment & Documentation**
   - Merge to main
   - Update README and contribution guides
   - Tag release
   - Notify stakeholders

---

**Document Status:** Ready for detailed migration plan  
**Prepared by:** Explore Agent (2026-03-10)
