# Exhaustive Analysis: Import & GitHub Handlers - Validation Boundaries

## EXECUTIVE SUMMARY

**High-Priority Hardening Needed**: The import and GitHub handlers have multiple validation gaps that could enable:
- Path traversal attacks
- Directory/file conflicts through whitespace manipulation
- Inconsistent error messaging (UX regression)
- AppName collision issues across skipCopy modes
- URL injection in clone flows

---

## CRITICAL VULNERABILITIES

### 1. PATH TRAVERSAL - IMPORT HANDLER (HIGH SEVERITY)

**Location**: `import_handlers.ts` lines 38-44 (check-ai-rules), 79-95 (import-app)

```typescript
// VULNERABLE: No validation of appPath parameter
handle("check-ai-rules", async (_, { path: appPath }: { path: string }) => {
  try {
    await fs.access(path.join(appPath, "AI_RULES.md"));
    return { exists: true };
  } catch {
    return { exists: false };
  }
});
```

**Attack Vector**:
```
appPath: "../../../../../../../etc/passwd"
appPath: "../../sensitive-data"
appPath: "/absolute/path/outside/anyon-apps"
```

**Impact**: 
- Read arbitrary files on system
- Check existence of sensitive paths
- Information leakage about filesystem structure

**Schema Definition (import.ts lines 34-36)**:
```typescript
export const CheckAiRulesParamsSchema = z.object({
  path: z.string(),  // ❌ NO VALIDATION - accepts anything
});
```

---

### 2. PATH TRAVERSAL - IMPORT HANDLER (SOURCEPATH)

**Location**: `import_handlers.ts` lines 75-95

```typescript
handle("import-app", async (_, {
  path: sourcePath,  // ❌ UNCHECKED USER INPUT
  appName,
  installCommand,
  startCommand,
  skipCopy,
}: ImportAppParams): Promise<ImportAppResult> => {
  // Validates existence but NOT that it's safe
  try {
    await fs.access(sourcePath);
  } catch {
    throw new Error("Source folder does not exist");
  }

  // If skipCopy=true, sourcePath used directly in DB as app.path
  const appPath = skipCopy ? sourcePath : getAnyonAppPath(appName);
  // ...later...
  const [app] = await db.insert(apps).values({
    name: appName,
    path: skipCopy ? sourcePath : appName,  // ❌ No sanitization
    // ...
  });
});
```

**Attack Vectors**:
```
sourcePath: "/etc/passwd"  (skipCopy=true) → DB stores "/etc/passwd" as app path
sourcePath: "../../secret" (skipCopy=false) → copyDirectoryRecursive traverses up
sourcePath: "/var/www/../../etc" (normalization bypass)
```

**Impact**:
- Store arbitrary paths in database
- When app operations run on this path, they target wrong locations
- Potential exposure/modification of system files if permissions allow
- Race condition: If `/etc/passwd` doesn't exist at import time but does later, app operations might act on it

---

### 3. APPNAME COLLISION - DOUBLE-WRITE VULNERABILITY

**Location**: `import_handlers.ts` lines 48-72, 75-159

**Scenario**: Race condition between `check-app-name` and `import-app`

```typescript
// Race: User checks name is free...
const result = await importClient.checkAppName({ appName: "myapp" });
// User sees: exists: false

// Meanwhile, another instance/process checks same name...
// Both proceed to import!

// import-app handler:
const appPath = skipCopy ? sourcePath : getAnyonAppPath(appName);
if (!skipCopy) {
  try {
    await fs.access(appPath);  // Both pass this check
    throw new Error("An app with this name already exists");
  } catch (error: any) {
    if (error.message === errorMessage) {
      throw error;
    }
  }
  await copyDirectoryRecursive(sourcePath, appPath);  // BOTH COPY → CONFLICT
}
```

**Vulnerability**: The filesystem check (line 101) only validates against ANYON-MANAGED paths.
**Gap**: No lock exists until AFTER the directory copy attempt.

**Attack**:
```
1. Request: import-app with appName="myapp", skipCopy=false
2. Request: import-app with appName="myapp", skipCopy=false (same name, different time)
3. Both hit copyDirectoryRecursive simultaneously
4. Result: undefined behavior (one fails, partial copy, or both partially succeed)
```

---

### 4. APPNAME NOT TRIMMED OR NORMALIZED

**Location**: All import/GitHub handlers

**Schema** (`import.ts` line 10, `github.ts` line 91):
```typescript
appName: z.string(),  // ❌ No .trim(), no min/max length
repo: z.string(),     // ❌ No validation
owner: z.string(),    // ❌ No validation
```

**Handlers Only Trim in SOME Cases**:

- `clone` handler (line 1241): `const finalAppName = appName && appName.trim() ? appName.trim() : repoName;` ✓
- `check-app-name` handler: NO TRIM ✗
- `import-app` handler: NO TRIM ✗
- `inviteCollaborator` handler (line 1068): `const trimmedUsername = username.trim();` ✓

**Attack Vectors**:
```
appName: "  myapp  " → stored as "  myapp  " (with spaces)
appName: "myapp\n" → stored with newline
appName: "\tmyapp" → stored with tab
Result: Database has "  myapp  " but user sees "myapp" in UI
         Two "myapp" entries possible: "myapp" and "  myapp  "
         Filesystem: anyon-apps/  myapp   / ← weird path
```

**Impact on UX**:
- Duplicate app detection fails
- Confusing app list with similar names
- Filesystem operations on unexpected paths

---

### 5. GITHUB URL INJECTION IN CLONE

**Location**: `github_handlers.ts` lines 1216-1224

```typescript
const urlPattern = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/;
const match = url.match(urlPattern);
if (!match) {
  return {
    error: "Invalid GitHub URL. Expected format: https://github.com/owner/repo.git",
  };
}
const [, owner, repoName] = match;
```

**Issue**: Regex extracts `owner` and `repoName` WITHOUT VALIDATION.

**Attack Vectors**:
```
url: "https://github.com/owner%2F..%2F..%2F/repo.git"
→ owner = "owner%2F..%2F..%2F"
→ Used in: `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/...`
→ Later: `${GITHUB_GIT_BASE}/${owner}/${repoName}.git`

url: "https://github.com/`whoami`/repo.git"
→ repoName = "repo.git"
→ owner = "`whoami`"
→ Stored in DB: githubOrg="`whoami`"
```

**Secondary Issue**: No check that extracted owner/repo match expected GitHub username/repo name patterns.

---

### 6. INCONSISTENT ERROR MESSAGES

**Location**: Multiple handlers

#### Import handler errors:
```typescript
throw new Error("Source folder does not exist");  // ✓ Clear
throw new Error("An app with this name already exists");  // ✓ Clear
```

#### GitHub handlers - MIXED QUALITY:
```typescript
throw new Error("App not found");  // ✗ Generic, unhelpful
throw new Error("Not authenticated with GitHub.");  // ✓ Actionable
throw new Error(err.message || "Failed to list GitHub repositories.");  // Mixed
throw new Error(`Failed to resolve remote branch 'origin/${targetBranch}' to a commit. Ensure 'git fetch' succeeded and the remote branch exists. ${innerErr?.message || String(innerErr)}`);  // ✓ Excellent
```

**Clone handler returns objects**:
```typescript
return { error: "Invalid GitHub URL. Expected format: https://github.com/owner/repo.git" };  // Inconsistent pattern
return { error: err.message || "An unexpected error occurred during cloning." };  // May expose internal errors
```

**UX Impact**:
- Users see "App not found" but don't know which app or why
- Some errors thrown, some returned in objects (inconsistent contract)
- Generic messages hide actual issues

---

### 7. BRANCH NAME NOT VALIDATED

**Location**: `github.ts` line 39, 157, 167

```typescript
export const GitBranchParamsSchema = z.object({
  appId: z.number(),
  branch: z.string(),  // ❌ No validation
});

export const CreateGitBranchParamsSchema = z.object({
  appId: z.number(),
  branch: z.string(),  // ❌ No validation - could be "../refs/heads/main" or ".."
  from: z.string().optional(),
});
```

**Attack Vector**:
```
branch: "../refs/heads/main"
branch: "@"  (special git ref syntax)
branch: "refs/remotes/origin/main"  (confusion with remote refs)
```

**Impact**: 
- Unexpected git behavior
- Remote branch checkouts instead of local
- Branch name confusion in UI vs git

---

### 8. USERNAME VALIDATION ASYMMETRY

**Location**: `github_handlers.ts` lines 1062-1128 (inviteCollaborator)

```typescript
export async function handleInviteCollaborator(
  event: IpcMainInvokeEvent,
  { appId, username }: { appId: number; username: string },
): Promise<void> {
  try {
    const trimmedUsername = username.trim();  // ✓ Trimmed
    if (!trimmedUsername) {
      throw new Error("Username cannot be empty.");
    }
    if (trimmedUsername.length > 39) {
      throw new Error("GitHub username cannot exceed 39 characters.");  // ✓ Validated
    }
    if (trimmedUsername.length === 1) {
      if (!/^[a-zA-Z0-9]$/.test(trimmedUsername)) {
        throw new Error(...);  // ✓ Validated
      }
    } else {
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmedUsername)) {
        throw new Error(...);  // ✓ Validated
      }
    }
    // ✓ Good validation
  }
}
```

**Contrast with Clone**:
```typescript
const finalAppName = appName && appName.trim() ? appName.trim() : repoName;
// ❌ No length check, no character validation, no normalization
```

**Issue**: Username gets strict validation, but appName does not.
**Why It Matters**: Both affect database integrity and UI.

---

### 9. SKIPKILL TRUSTS EXTERNAL PATH

**Location**: `import_handlers.ts` lines 94-112

```typescript
const appPath = skipCopy ? sourcePath : getAnyonAppPath(appName);

if (!skipCopy) {
  // Only validates app doesn't exist IF copying
  const errorMessage = "An app with this name already exists";
  try {
    await fs.access(appPath);
    throw new Error(errorMessage);
  } catch (error: any) {
    if (error.message === errorMessage) {
      throw error;
    }
  }
  await copyDirectoryRecursive(sourcePath, appPath);
}
```

**Issue When skipCopy=true**:
- No conflict check happens
- `sourcePath` stored directly in DB
- If two users import with skipCopy=true and same sourcePath, database stores duplicates
- When operations run, which app gets which path?

**Attack**:
```
user1: import-app with sourcePath="/home/user1/projects/myapp", skipCopy=true, appName="app1"
user2: import-app with sourcePath="/home/user1/projects/myapp", skipCopy=true, appName="app2"
Result: Two apps in DB pointing to SAME filesystem location → writes clash
```

---

## MISSING VALIDATIONS

### String Length Constraints

**Schemas lacking maxLength/minLength**:
- `appName` in `ImportAppParamsSchema` (line 10)
- `path` in `ImportAppParamsSchema` (line 9)
- `path` in `CheckAiRulesParamsSchema` (line 35)
- `branch` in `GitBranchParamsSchema` (line 39)
- `repo` in `isRepoAvailable` (line 147)
- `owner` in `isRepoAvailable` (line 146)
- `url` in `CloneRepoParamsSchema` (line 91)

**Recommended**:
```typescript
appName: z.string().trim().min(1).max(255),
path: z.string().min(1).max(1024),  // Reasonable filesystem path limit
repo: z.string().trim().min(1).max(100),
branch: z.string().trim().min(1).max(255),
```

### Path Normalization

**Missing**:
```typescript
// No check that sourcePath doesn't contain:
// - ".." (parent directory references)
// - "//" (double slashes)
// - Symlinks
// - Absolute paths that escape anyon-apps (if not skipCopy=true explicitly intended)
```

### GitHub Handle Validation

**Missing** for owner/repo extraction:
```typescript
const [, owner, repoName] = match;
// Should validate:
// - owner: GitHub username rules (alphanumeric + hyphens, 1-39 chars, start/end alphanumeric)
// - repoName: No special URL characters, valid identifier rules
```

---

## UX/ERROR MESSAGE ISSUES

### Inconsistent Contract Patterns

**import-app**: Throws Error
```typescript
throw new Error("Source folder does not exist");
```

**clone-repo-from-url**: Returns error object
```typescript
return { error: "Invalid GitHub URL. Expected format: ..." };
```

**User Impact**: Inconsistent error handling in UI, some errors caught as thrown exceptions, others need to check return object.

### Vague Error Messages

| Error | Issue | Should Be |
|-------|-------|-----------|
| "App not found" | Generic, no context | "App with ID {appId} not found in database" |
| "Failed to list GitHub repositories." | Lost actual GitHub error | Include `${errorData.message}` |
| "Failed to clone repository. Please check the URL and try again." | Hides actual clone error | Log detailed error, show summary to user |

---

## RACE CONDITIONS

### Import App Name Collision (skipCopy=false)

```
Time T1: check-app-name("myapp") → exists: false
Time T1+1ms: Another process checks same name → exists: false
Time T1+2ms: First process: fs.access(appPath) → ENOENT (good)
Time T1+3ms: Second process: fs.access(appPath) → ENOENT (good, both continue!)
Time T1+4ms: First process: copyDirectoryRecursive(sourcePath, appPath) → IN PROGRESS
Time T1+5ms: Second process: copyDirectoryRecursive(sourcePath, appPath) → CONFLICTS
```

**Missing**: App-level mutex on appName during import.

---

## SUMMARY TABLE: VALIDATION GAPS

| # | Issue | Severity | Location | Attack | Impact |
|---|-------|----------|----------|--------|--------|
| 1 | Path traversal in check-ai-rules | HIGH | import.ts:34-36 | appPath="../../../etc/passwd" | Read arbitrary files |
| 2 | Path traversal in sourcePath | HIGH | import.ts:9 | sourcePath="/etc/passwd" + skipCopy=true | Store unsafe paths in DB |
| 3 | AppName not trimmed | MEDIUM | import.ts:10, github.ts:91 | appName="  app  " | Duplicate entries, collision failures |
| 4 | AppName no length validation | MEDIUM | import.ts:10 | appName=[2000 chars] | DB field overflow, filesystem issues |
| 5 | Race condition in check-app-name | MEDIUM | import_handlers.ts:48-72 | Concurrent imports same name | Double-write to filesystem |
| 6 | skipCopy doesn't validate path safety | MEDIUM | import_handlers.ts:94-112 | skipCopy=true + absolute path | Unexpected app path locations |
| 7 | GitHub owner/repo not validated | MEDIUM | github_handlers.ts:1216-1224 | owner with special chars | Invalid GitHub API calls, DB corruption |
| 8 | Branch name not validated | MEDIUM | github.ts:39 | branch="../refs/heads/main" | Git operation confusion |
| 9 | Username validation asymmetry | LOW | github_handlers.ts:1062-1128 | appName="@#$%^&*()" | Inconsistent validation standards |
| 10 | Inconsistent error messages | LOW | Multiple | Error messages generic | Poor UX, harder debugging |
| 11 | Inconsistent error contract | LOW | import vs clone | Some throw, some return | Inconsistent error handling in UI |

---

## CONCRETE RECOMMENDATIONS

### IMMEDIATE (Critical)

1. **Path Sanitization** - Add to schemas:
   ```typescript
   path: z.string()
     .refine(p => !p.includes(".."), "Path cannot contain ..")
     .refine(p => !p.startsWith("/"), "Path must not be absolute (in non-skipCopy mode)")
     .refine(p => !p.includes("\\"), "Path cannot contain backslashes")
   ```

2. **AppName Normalization**:
   ```typescript
   appName: z.string()
     .trim()
     .min(1, "App name required")
     .max(255, "App name too long")
     .regex(/^[a-zA-Z0-9-_]+$/, "App name can only contain alphanumeric, hyphens, underscores")
   ```

3. **Add Mutex for Import**:
   ```typescript
   // Use withLock(appId, ...) pattern already established in github handlers
   // Or use appName-based lock
   await withLock(`import:${appName}`, async () => {
     // Prevent concurrent imports of same name
   });
   ```

### SHORT-TERM (High Priority)

1. **Branch Validation**:
   ```typescript
   branch: z.string()
     .trim()
     .min(1)
     .max(255)
     .regex(/^[a-zA-Z0-9._/-]+$/, "Invalid branch name characters")
     .refine(b => !b.startsWith("."), "Branch cannot start with .")
     .refine(b => !b.startsWith("-"), "Branch cannot start with -")
   ```

2. **GitHub Handle Validation**:
   ```typescript
   owner: z.string()
     .trim()
     .min(1)
     .max(39)
     .regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, "Invalid GitHub owner name"),
   repo: z.string()
     .trim()
     .min(1)
     .max(255)
     .regex(/^[a-zA-Z0-9._-]+$/, "Invalid repository name")
   ```

3. **Consistent Error Messages**:
   - All import/clone handlers should throw, not return error objects
   - Or standardize on union return type across all handlers
   - Error messages must be actionable (include context)

4. **SkipCopy Path Validation**:
   ```typescript
   if (skipCopy) {
     // Validate sourcePath is outside anyon-apps but real
     const realPath = path.resolve(sourcePath);
     const anyonBase = getAnyonAppsBaseDirectory();
     if (realPath.startsWith(anyonBase)) {
       throw new Error("Cannot skipCopy for paths inside anyon-apps directory");
     }
   }
   ```

### LONGER-TERM (Hardening)

1. Create centralized `validateAppPath()` utility for all path inputs
2. Add input sanitization tests for each handler
3. Schema refactoring to match inviteCollaborator's strict approach across all string inputs
4. Consider Zod superRefine for cross-field validation (e.g., skipCopy + path logic)
5. Add E2E tests for race conditions and edge cases

