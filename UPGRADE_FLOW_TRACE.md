# App Upgrade Flow Trace: Main Process Execution

## Overview

This document traces the complete flow from user clicking "Upgrade" in the UI through main process execution, including component-tagger detection and dependency installation logic.

---

## USER INTERACTION → IPC CALL

### Renderer Component: `AppUpgrades.tsx` (src/components/AppUpgrades.tsx)

**Lines 27-61: Upgrade Mutation Definition**

- **Component Purpose**: React component displaying available upgrades for the selected app
- **User Action**: Clicks "Upgrade" button (line 148)
- **Handler**: `handleUpgrade(upgradeId: string)` → calls `executeUpgrade(upgradeId)`
- **IPC Call** (line 37):
  ```typescript
  ipc.upgrade.executeAppUpgrade({
    appId,
    upgradeId,
  });
  ```
- **Mutation Success Callback** (lines 42-56):
  - Invalidates queries to refresh available upgrades
  - Invalidates "capacitor" query if that was the upgrade
  - Invalidates app versions list to reflect changes

**Lines 12-25: Get Upgrades Query Definition**

- **Query Key**: `queryKeys.appUpgrades.byApp({ appId })`
- **IPC Call** (line 22):
  ```typescript
  ipc.upgrade.getAppUpgrades({ appId });
  ```
- **Trigger**: Whenever appId changes (enabled: !!appId)
- **Purpose**: Fetch list of available upgrades with `isNeeded` status

---

## IPC CONTRACT LAYER

### File: `src/ipc/types/upgrade.ts`

**Lines 8-14: AppUpgrade Data Schema**

```typescript
{
  id: string; // "component-tagger" | "capacitor"
  title: string; // Display name
  description: string; // What it does
  manualUpgradeUrl: string; // Fallback docs link
  isNeeded: boolean; // Detection result: true = upgrade available
}
```

**Lines 31-36: getAppUpgrades Contract**

- **Channel**: `"get-app-upgrades"`
- **Input**: `{ appId: number }`
- **Output**: `AppUpgrade[]` (array of upgrades with isNeeded status)
- **Client Export**: `upgradeClient.getAppUpgrades(params)`

**Lines 38-42: executeAppUpgrade Contract**

- **Channel**: `"execute-app-upgrade"`
- **Input**: `{ appId: number; upgradeId: string }`
- **Output**: `void` (no return value, promise resolves when complete)
- **Client Export**: `upgradeClient.executeAppUpgrade(params)`

---

## HANDLER REGISTRATION

### File: `src/ipc/ipc_host.ts`

- **Line 5**: Imports `registerAppUpgradeHandlers`
- **Line 70**: Calls `registerAppUpgradeHandlers()` during IPC initialization
- **Effect**: All upgrade handlers become available to renderer process

---

## HANDLER IMPLEMENTATION

### File: `src/ipc/handlers/app_upgrade_handlers.ts`

#### HANDLER 1: GET-APP-UPGRADES (Lines 307-325)

**Handler Signature**:

```typescript
handle("get-app-upgrades", async (_, { appId }: { appId: number }): Promise<AppUpgrade[]> => {
```

**Execution Flow**:

1. **Line 310**: Get app from database
   - `getApp(appId)` → queries `db.apps` table
   - **Throws** if app not found: `"App with id {appId} not found"`

2. **Line 311**: Resolve full app path
   - `getAnyonAppPath(app.path)`
   - **Behavior**:
     - If `app.path` is absolute → use as-is
     - If relative → append to `~/.anyon-apps` base directory (or test userData)

3. **Lines 313-321**: Iterate through available upgrades and check status

   ```typescript
   availableUpgrades.map((upgrade) => {
     let isNeeded = false;
     if (upgrade.id === "component-tagger") {
       isNeeded = isComponentTaggerUpgradeNeeded(appPath);
     } else if (upgrade.id === "capacitor") {
       isNeeded = isCapacitorUpgradeNeeded(appPath);
     }
     return { ...upgrade, isNeeded };
   });
   ```

4. **Return**: Array of upgrade objects with detection status

---

#### DETECTION FUNCTION 1: isComponentTaggerUpgradeNeeded (Lines 52-72)

**Purpose**: Check if component-tagger Vite plugin is already installed

**Logic**:

1. **Lines 56-63**: Find vite.config file (TypeScript preferred over JavaScript)
   - Check `vite.config.ts` first
   - Fall back to `vite.config.js`
   - Return `false` if neither exists (not a Vite app)

2. **Lines 65-71**: Read vite.config content
   - Read file content as UTF-8
   - Check if content includes string `"anyon-component-tagger"`
   - **Return**: `true` if NOT found (upgrade needed), `false` if found or read error

**Side Effects**:

- Logs errors if file read fails (does not throw, returns false)
- Uses synchronous `fs.readFileSync` (blocking, safe in main process)

---

#### DETECTION FUNCTION 2: isCapacitorUpgradeNeeded (Lines 74-95)

**Purpose**: Check if Capacitor is already installed in the project

**Logic**:

1. **Line 76**: Verify it's a Vite app first (calls `isViteApp()`)
   - If not Vite → return `false` (Capacitor needs Vite)

2. **Lines 81-92**: Check for Capacitor config files
   - Look for: `capacitor.config.js`, `capacitor.config.ts`, or `capacitor.config.json`
   - **Return**: `false` if ANY config exists (already installed)
   - **Return**: `true` if no config found (upgrade needed)

---

#### HANDLER 2: EXECUTE-APP-UPGRADE (Lines 327-345)

**Handler Signature**:

```typescript
handle("execute-app-upgrade", async (_, { appId, upgradeId }: { appId: number; upgradeId: string }) => {
```

**Validation & Setup** (Lines 330-335):

1. **Line 330-332**: Validate upgradeId
   - **Throws**: `"upgradeId is required"` if empty/missing

2. **Line 334**: Get app from database (same as get-app-upgrades)
   - **Throws**: `"App with id {appId} not found"`

3. **Line 335**: Resolve full app path

**Execution Dispatch** (Lines 337-344):

```typescript
if (upgradeId === "component-tagger") {
  await applyComponentTagger(appPath);
} else if (upgradeId === "capacitor") {
  await applyCapacitor({ appName: app.name, appPath });
} else {
  throw new Error(`Unknown upgrade id: ${upgradeId}`);
}
```

- Routes to appropriate upgrade function
- **Throws** if upgradeId not recognized

---

## COMPONENT-TAGGER UPGRADE EXECUTION

### Function: applyComponentTagger (Lines 149-251)

**Purpose**: Install Vite plugin, dependencies, and update vite.config

**Step 1: Locate & Validate Vite Config (Lines 150-160)**

- Find vite.config.ts or vite.config.js
- **Throws**: `"Could not find vite.config.js or vite.config.ts"` if missing
- Store full path for later edits

**Step 2: Create Plugin Directory (Lines 162-163)**

```typescript
const pluginsDir = path.join(appPath, "plugins");
await fs.promises.mkdir(pluginsDir, { recursive: true });
```

- Creates `{appPath}/plugins/` directory

**Step 3: Write Plugin File (Lines 165-171)**

- Determine file extension (`.ts` if vite.config is TypeScript, else `.js`)
- Write plugin code to `{appPath}/plugins/anyon-component-tagger.ts|js`
- Plugin code (lines 97-147): Babel-based AST transformer that:
  - Parses JSX/TSX files
  - Walks AST to find JSXOpeningElements
  - Injects `data-anyon-id` and `data-anyon-name` attributes
  - Only runs in `serve` mode, before other plugins (`enforce: "pre"`)
  - Skips node_modules and non-JSX/TSX files
  - Gracefully handles parse errors (logs warnings, doesn't fail)

**Step 4: Update Vite Config with Import (Lines 173-190)**

- Read existing vite.config content
- Find last `import` statement (works backwards from end)
- Insert new line after imports:
  ```typescript
  import anyonComponentTagger from "./plugins/anyon-component-tagger";
  ```
- Handles both `"anyon-component-tagger"` being present/absent

**Step 5: Add Plugin to plugins Array (Lines 192-203)**

- Find `plugins: [` in config
- Replace with `plugins: [anyonComponentTagger(), `
- **Throws**: `"Could not find 'plugins: [' in vite.config.ts. Manual installation required."` if not found
- This is a fragile check that requires exact `plugins: [` string

**Step 6: Write Updated Config (Line 205)**

- Write modified vite.config back to file

**Step 7: Install Dependencies (Lines 207-235)**

- **Command Decision Tree**:
  ```
  Try: pnpm add -D "@babel/parser" "estree-walker@^2.0.2" "magic-string"
  If pnpm not available or fails:
    Try: npm install --save-dev --legacy-peer-deps (same packages)
  ```
- **Execution**:
  - Spawn child process with `shell: true`
  - Capture stdout/stderr, log all output
  - **Line 221-229**: On successful exit (code 0):
    - Log success message
    - Resolve promise
  - **Line 226-227**: On non-zero exit:
    - Log error with exit code
    - Reject with: `"Failed to install component tagger dependencies"`
  - **Line 231-234**: On spawn error:
    - Log error
    - Reject with spawn error

**Step 8: Optional Git Commit (Lines 237-250)**

- **Wrapped in try-catch** (does not throw, only logs warnings on failure)
- **If git available**:
  1. Stage all files: `gitAddAll({ path: appPath })`
  2. Commit with message: `"[anyon] add Anyon component tagger"`
  3. Log success
- **If git fails**:
  - Log warning (not error)
  - Message: `"Failed to commit changes. This may happen if the project is not in a git repository, or if there are no changes to commit."`
  - **Does NOT throw** → upgrade succeeds even if git fails

---

## CAPACITOR UPGRADE EXECUTION

### Function: applyCapacitor (Lines 253-304)

**Purpose**: Install Capacitor framework for mobile app support

**Step 1: Install Capacitor Dependencies (Lines 261-267)**

- **Command**:
  ```
  pnpm add @capacitor/{core,cli,ios,android}@7.4.4
  or npm install (with --legacy-peer-deps)
  ```
- **Function**: `simpleSpawn()`
  - Success message: `"Capacitor dependencies installed successfully"`
  - Error prefix: `"Failed to install Capacitor dependencies"`

**Step 2: Initialize Capacitor (Lines 270-275)**

- **Command**: `npx cap init "{appName}" "com.example.{appNameNormalized}" --web-dir=dist`
- Creates `capacitor.config.json` with:
  - App name and bundle ID
  - Web directory set to `dist/`

**Step 3: Add Mobile Platforms (Lines 278-283)**

- **Command**: `npx cap add ios && npx cap add android`
- Creates platform-specific directories for iOS and Android native code

**Step 4: Optional Git Commit (Lines 286-303)**

- **NOT wrapped in try-catch** (throws on git failure)
- **If git available**:
  1. Stage all files
  2. Commit with message: `"[anyon] add Capacitor for mobile app support"`
- **If git fails**:
  - **Throws error**: `"Failed to commit Capacitor changes. Please commit them manually. Error: {err}"`
  - **Upgrade fails** (unlike component-tagger)

---

## UTILITY FUNCTIONS

### Git Operations (src/ipc/utils/git_utils.ts)

**gitAddAll (Lines 409-417)**

- **Input**: `{ path: string }`
- **Action**: Stage all changes in working directory
- **Native Git**: `git add .`
- **Fallback**: isomorphic-git `git.add()`
- **Throws**: Error message on failure

**gitCommit (Lines 262-293)**

- **Input**: `{ path, message, amend? }`
- **Action**: Create commit with author credentials
- **Native Git**: `git -c user.name= -c user.email= commit -m "{message}"`
- **Fallback**: isomorphic-git `git.commit()`
- **Returns**: Commit hash
- **Throws**: Error on failure

---

### Process Spawning (src/ipc/utils/simpleSpawn.ts)

**simpleSpawn (Lines 6-60)**

- **Spawns child process** with `shell: true` (enables piping, command chains)
- **Pipes stdout/stderr** to logger (lines 31-41)
- **Returns Promise**:
  - **Resolves** on exit code 0
  - **Rejects** on non-zero exit code with combined stdout/stderr
  - **Rejects** on spawn error
- **Used by**: Capacitor dependency installation and platform addition

---

### Handler Wrapper (src/ipc/handlers/safe_handle.ts)

**createLoggedHandler (Lines 5-30)**

- **Wraps IPC handler** with error catching and logging
- **Logs**: Channel name, input args, output (first 100 chars)
- **Error Handling**:
  - Catches any thrown error
  - Re-throws with prefix: `"[{channel}] {error}"`
  - Logs error to logger
- **Used by**: All upgrade handlers via `const handle = createLoggedHandler(logger)`

---

## ERROR HANDLING SUMMARY

### Errors That Throw (Handler Fails Upgrade):

| Condition                          | Error Message                                                                     | Handler                               | Component   |
| ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------- | ----------- |
| App not found                      | `"App with id {appId} not found"`                                                 | get-app-upgrades, execute-app-upgrade | getApp()    |
| upgradeId missing                  | `"upgradeId is required"`                                                         | execute-app-upgrade                   | Line 330    |
| Unknown upgradeId                  | `"Unknown upgrade id: {upgradeId}"`                                               | execute-app-upgrade                   | Line 342    |
| No vite.config found               | `"Could not find vite.config.js or vite.config.ts"`                               | applyComponentTagger                  | Line 159    |
| No plugins array                   | `"Could not find 'plugins: [' in vite.config.ts. Manual installation required."`  | applyComponentTagger                  | Line 200    |
| Dependency install fails           | `"Failed to install component tagger dependencies"`                               | applyComponentTagger                  | Line 227    |
| Capacitor dependency install fails | `"Failed to install Capacitor dependencies (exit code {code})"`                   | applyCapacitor                        | simpleSpawn |
| Capacitor init fails               | `"Failed to initialize Capacitor"`                                                | applyCapacitor                        | simpleSpawn |
| Capacitor add platforms fails      | `"Failed to add iOS and Android platforms"`                                       | applyCapacitor                        | simpleSpawn |
| Capacitor git commit fails         | `"Failed to commit Capacitor changes. Please commit them manually. Error: {err}"` | applyCapacitor                        | Line 299    |

### Errors That Are Logged But Don't Fail:

| Condition                         | Log Level | Component                      | Behavior                             |
| --------------------------------- | --------- | ------------------------------ | ------------------------------------ |
| Git config read error             | error     | isComponentTaggerUpgradeNeeded | Returns false (not needed)           |
| Component-tagger git commit fails | warn      | applyComponentTagger           | Upgrade succeeds despite git failure |

---

## SIDE EFFECTS & FILESYSTEM CHANGES

### For Component-Tagger Upgrade:

1. **Created Files**:
   - `{appPath}/plugins/anyon-component-tagger.ts|.js` - Vite plugin

2. **Modified Files**:
   - `{appPath}/vite.config.ts|.js` - Added import and plugin registration

3. **Installed Dependencies** (package.json changes):
   - `@babel/parser` (dev dependency)
   - `estree-walker@^2.0.2` (dev dependency)
   - `magic-string` (dev dependency)

4. **Git Changes** (if git available):
   - Staged all changes
   - Created commit: `"[anyon] add Anyon component tagger"`

### For Capacitor Upgrade:

1. **Created Files**:
   - `{appPath}/capacitor.config.json` - Capacitor configuration
   - `{appPath}/ios/` - iOS platform files
   - `{appPath}/android/` - Android platform files

2. **Installed Dependencies** (package.json changes):
   - `@capacitor/core@7.4.4`
   - `@capacitor/cli@7.4.4`
   - `@capacitor/ios@7.4.4`
   - `@capacitor/android@7.4.4`

3. **Git Changes** (required, throws if unavailable):
   - Staged all changes
   - Created commit: `"[anyon] add Capacitor for mobile app support"`

---

## PATH RESOLUTION DETAILS

### getAnyonAppPath() Flow (src/paths/paths.ts, Lines 15-22):

```
Input: app.path (from database)
  ↓
Is app.path absolute?
  ├─ YES → return app.path as-is
  └─ NO → append to base directory
          ↓
          Is TEST_BUILD?
            ├─ YES → base = "{electron.app.userData}/anyon-apps"
            └─ NO → base = "~/{getAnyonAppsBaseDirectory()}"
```

**Result**: Full filesystem path to app directory

---

## QUERY KEY INVALIDATION (Renderer Sync)

After successful upgrade execution:

```typescript
// Line 43-45
queryClient.invalidateQueries({
  queryKey: queryKeys.appUpgrades.byApp({ appId }),
});

// Line 46-51 (Capacitor-specific)
if (upgradeId === "capacitor") {
  queryClient.invalidateQueries({
    queryKey: queryKeys.appUpgrades.isCapacitor({ appId }),
  });
}

// Line 53-55 (General)
queryClient.invalidateQueries({
  queryKey: queryKeys.versions.list({ appId }),
});
```

**Effect**: Triggers re-fetch of upgrades list (detect remaining upgrades), re-fetch version list

---

## TIMING & CONCURRENCY

- **Component-Tagger**: ~5-30 seconds (depends on package manager speed)
  - Vite config update: synchronous, <100ms
  - Dependency install: 5-30 seconds
  - Git commit: <1 second
- **Capacitor**: ~20-60 seconds (more complex setup)
  - Dependency install: 10-30 seconds
  - Capacitor init: 2-5 seconds
  - Add platforms: 5-20 seconds (downloads native SDKs)
  - Git commit: <1 second

- **No locking**: Main process handlers are async, multiple upgrades could theoretically run in parallel
  - Risk: Race conditions on vite.config modification
  - Mitigation: Unlikely users will click multiple upgrades simultaneously

---

## LOGGING

**Logger Scope**: `"app_upgrade_handlers"` (electron-log)

**Component-Tagger Logs**:

- `"Created anyon-component-tagger plugin file"` (info)
- `"Installing anyon-component-tagger dependencies"` (info)
- Dependency install stdout/stderr (info/error)
- `"Component tagger dependencies installed successfully"` (info) OR exit code error (error)
- `"Staging and committing changes"` (info)
- `"Successfully committed changes"` (info)
- Git failure warnings (warn)

**Capacitor Logs**:

- simpleSpawn logs for each step (info)
- `"Staging and committing Capacitor changes"` (info)
- `"Successfully committed Capacitor changes"` (info)
- Git failure with error details (error/warn)

---

## SUMMARY DECISION TREE

```
User clicks "Upgrade" in AppUpgrades.tsx
  ↓
Component calls ipc.upgrade.executeAppUpgrade({ appId, upgradeId })
  ↓
IPC routes to "execute-app-upgrade" handler
  ↓
Handler validates inputs → get app from DB → resolve full path
  ↓
Route by upgradeId:
  ├─ "component-tagger"
  │   ├─ Find vite.config (ts or js)
  │   ├─ Create plugins/ directory
  │   ├─ Write plugin transformer code
  │   ├─ Add import statement to vite.config
  │   ├─ Add plugin to plugins array
  │   ├─ Install @babel/parser, estree-walker, magic-string
  │   ├─ Stage and commit (optional, git may not exist)
  │   └─ Resolve or throw
  │
  └─ "capacitor"
      ├─ Install @capacitor/* dependencies
      ├─ Run cap init with app name + bundle ID
      ├─ Run cap add ios && cap add android
      ├─ Stage and commit (required, throws if git fails)
      └─ Resolve or throw

  ↓
Handler returns → Promise resolves/rejects
  ↓
Renderer mutation.onSuccess/onError → invalidate queries
  ↓
Query refetch → getAppUpgrades called again
  ↓
Detection functions run → component-tagger now found, isNeeded: false
  ↓
Component re-renders → upgrade no longer appears in list
```
