# Validation Findings: Quick Reference

## Schema Definitions - Current State

### ❌ VULNERABLE SCHEMAS

**import.ts**:
```typescript
// Line 8-14: ImportAppParamsSchema
export const ImportAppParamsSchema = z.object({
  path: z.string(),  // ❌ VULNERABLE: No path traversal check
  appName: z.string(),  // ❌ NO TRIM, NO LENGTH LIMIT
  installCommand: z.string().optional(),  // ❌ NO LENGTH LIMIT
  startCommand: z.string().optional(),  // ❌ NO LENGTH LIMIT
  skipCopy: z.boolean().optional(),
});

// Line 34-36: CheckAiRulesParamsSchema  
export const CheckAiRulesParamsSchema = z.object({
  path: z.string(),  // ❌ VULNERABLE: No validation - allows "../../../etc/passwd"
});
```

**github.ts**:
```typescript
// Line 90-95: CloneRepoParamsSchema
export const CloneRepoParamsSchema = z.object({
  url: z.string(),  // ❌ NO LENGTH LIMIT (could be 10MB of text)
  appName: z.string().optional(),  // ❌ INCONSISTENT: sometimes trimmed, sometimes not
  installCommand: z.string().optional(),
  startCommand: z.string().optional(),
});

// Line 141, 146-147, 153-155: Multiple handlers
input: z.object({ owner: z.string(), repo: z.string() }),  // ❌ NO VALIDATION
input: z.object({ org: z.string(), repo: z.string() }),  // ❌ NO VALIDATION
input: z.object({
  org: z.string(),  // ❌ NO VALIDATION - allows "`whoami`"
  repo: z.string(),  // ❌ NO VALIDATION
  appId: z.number(),
  branch: z.string().optional(),  // ❌ NO VALIDATION
}),
```

---

## Handler Code - Vulnerable Patterns

### Pattern 1: Path Traversal Vulnerability

**import_handlers.ts (line 38-44)**:
```typescript
handle("check-ai-rules", async (_, { path: appPath }: { path: string }) => {
  try {
    await fs.access(path.join(appPath, "AI_RULES.md"));
    //                    ↑ appPath not validated! Can be "../../../etc/passwd"
    return { exists: true };
  } catch {
    return { exists: false };
  }
});
```

**What happens**:
- Attacker sends: `{ path: "../../../../../../../etc" }`
- Code checks: `fs.access(path.join("../../../../../../../etc", "AI_RULES.md"))`
- Can check if arbitrary paths exist on system
- **Information disclosure**

---

### Pattern 2: Database Path Injection

**import_handlers.ts (line 95, 141)**:
```typescript
const appPath = skipCopy ? sourcePath : getAnyonAppPath(appName);

const [app] = await db.insert(apps).values({
  name: appName,
  path: skipCopy ? sourcePath : appName,  // ❌ sourcePath stored directly!
  // ...
});
```

**What happens when skipCopy=true**:
```
Input: { sourcePath: "/etc/passwd", appName: "evil-app", skipCopy: true }

Database stores:
  apps.name = "evil-app"
  apps.path = "/etc/passwd"  // ❌ Arbitrary path!

Later when app operations run:
  getAnyonAppPath("/etc/passwd") → returns "/etc/passwd" (absolute path)
  Could lead to reading/writing /etc/passwd
```

---

### Pattern 3: Inconsistent Trimming

**github_handlers.ts (line 1241 vs. import_handlers.ts line 140)**:

✓ Clone handler DOES trim:
```typescript
const finalAppName = appName && appName.trim() ? appName.trim() : repoName;
```

❌ Import handler DOESN'T trim:
```typescript
const [app] = await db.insert(apps).values({
  name: appName,  // Could be "  myapp  " with spaces!
  // ...
});
```

**What happens**:
```
Scenario 1: User imports app "myapp"
  DB: { name: "myapp" }
  
Scenario 2: User imports app "  myapp  " (with spaces)
  DB: { name: "  myapp  " }
  
Result: TWO DIFFERENT APPS, but both displayed as "myapp" to user!
        Collision detection fails
        Weird filesystem path: "/home/user/anyon-apps/  myapp  /"
```

---

### Pattern 4: Race Condition

**import_handlers.ts (lines 48-72, 95-112)**:

```typescript
// Handler 1: check-app-name
handle("check-app-name", async (_, { appName, skipCopy }: ...) => {
  const existingApp = await db.query.apps.findFirst({
    where: eq(apps.name, appName),
  });
  return { exists: !!existingApp };  // Returns FALSE
  // ❌ No lock held! Another request can proceed
});

// Handler 2: import-app
handle("import-app", async (_, { path: sourcePath, appName, skipCopy, ... }: ...) => {
  const appPath = skipCopy ? sourcePath : getAnyonAppPath(appName);
  
  if (!skipCopy) {
    try {
      await fs.access(appPath);
      throw new Error("An app with this name already exists");
    } catch (error: any) {
      if (error.message === errorMessage) {
        throw error;  // ❌ But meanwhile another request is here too!
      }
    }
    await copyDirectoryRecursive(sourcePath, appPath);
    // ❌ Both copy simultaneously → filesystem conflict
  }
  
  const [app] = await db.insert(apps).values({
    name: appName,
    path: skipCopy ? sourcePath : appName,
  }).returning();
});
```

**Timeline of Disaster**:
```
T+0ms: Request A: check-app-name("myapp") → exists: false ✓
T+1ms: Request B: check-app-name("myapp") → exists: false ✓
T+2ms: Request A: fs.access("/home/user/anyon-apps/myapp") → ENOENT ✓ (good)
T+3ms: Request B: fs.access("/home/user/anyon-apps/myapp") → ENOENT ✓ (good!)
T+4ms: Request A: copyDirectoryRecursive(src, dest) → COPYING...
T+5ms: Request B: copyDirectoryRecursive(src, dest) → COPY CONFLICT!
T+6ms: Request A: DB INSERT → app created
T+7ms: Request B: DB INSERT → UNIQUE CONSTRAINT? Maybe succeeds anyway if name not unique key
```

**Result**: Filesystem corruption or partial copy, database in inconsistent state.

---

### Pattern 5: GitHub Owner/Repo Injection

**github_handlers.ts (line 1216-1224)**:
```typescript
const urlPattern = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/;
const match = url.match(urlPattern);
if (!match) {
  return { error: "Invalid GitHub URL. Expected format: ..." };
}
const [, owner, repoName] = match;
// ❌ owner and repoName are RAW from regex, no validation
```

**Attack**: 
```
Input URL: "https://github.com/$(whoami)/my-repo.git"
Extracted: owner = "$(whoami)", repoName = "my-repo"

Later used in:
  `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/...`
  
Database stores:
  githubOrg: "$(whoami)"
  githubRepo: "my-repo"
```

**While encodeURIComponent saves from URL injection, the database now contains
malicious-looking data that breaks assumptions.**

---

### Pattern 6: Branch Name Can Be Anything

**github.ts (line 39), github_handlers.ts (used throughout)**:

```typescript
export const GitBranchParamsSchema = z.object({
  appId: z.number(),
  branch: z.string(),  // ❌ NO VALIDATION
});
```

**Attack**:
```
Input: { appId: 1, branch: "../refs/heads/main" }

git command might interpret as parent directory reference.
Or: branch: "@"  (special git reference)
Or: branch: "refs/remotes/origin/main"  (remote branch instead of local)
```

---

## Key Discrepancies: Good vs Bad Examples

### Good Example: inviteCollaborator (lines 1062-1128)

```typescript
export async function handleInviteCollaborator(
  event: IpcMainInvokeEvent,
  { appId, username }: { appId: number; username: string },
): Promise<void> {
  try {
    const trimmedUsername = username.trim();  // ✓ TRIMMED
    if (!trimmedUsername) {
      throw new Error("Username cannot be empty.");  // ✓ VALIDATED
    }
    if (trimmedUsername.length > 39) {
      throw new Error("GitHub username cannot exceed 39 characters.");  // ✓ LENGTH CHECK
    }
    if (trimmedUsername.length === 1) {
      if (!/^[a-zA-Z0-9]$/.test(trimmedUsername)) {
        throw new Error("Invalid GitHub username format...");  // ✓ FORMAT CHECK
      }
    } else {
      if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmedUsername)) {
        throw new Error("Invalid GitHub username format...");  // ✓ FORMAT CHECK
      }
    }
    
    // ...rest of handler
  }
}
```

**Why this is good**:
- ✓ Trim whitespace
- ✓ Length validation (1-39 chars, matches GitHub)
- ✓ Character validation (alphanumeric + hyphens, specific rules)
- ✓ Clear error messages

---

### Bad Example: Clone Handler (line 1241)

```typescript
const finalAppName = appName && appName.trim() ? appName.trim() : repoName;
// ✓ TRIM present
// ❌ But that's it - no length check, no character validation
// ❌ Unlike username validation which has all checks
```

---

## Testing These Vulnerabilities

### Test Case 1: Path Traversal
```typescript
// Attack check-ai-rules
await importClient.checkAiRules({ path: "../../../../etc/passwd" });
// Expected: Error or safe behavior
// Actual: May check if /etc/passwd exists
```

### Test Case 2: AppName Collision
```typescript
// Simultaneously import with same name
Promise.all([
  importClient.importApp({ path: "/tmp/app1", appName: "test", skipCopy: true }),
  importClient.importApp({ path: "/tmp/app2", appName: "test", skipCopy: true }),
]);
// Expected: One succeeds, one fails
// Actual: Both might succeed or filesystem corruption occurs
```

### Test Case 3: AppName Trimming
```typescript
await importClient.importApp({ path: "/tmp/app", appName: "  myapp  ", skipCopy: true });
// Check DB: is apps.name "myapp" or "  myapp  "?
// Expected: trimmed
// Actual: ❌ "  myapp  " with spaces
```

### Test Case 4: GitHub URL Injection
```typescript
await githubClient.cloneRepoFromUrl({
  url: "https://github.com/$(whoami)/test-repo.git",
  appName: "test",
});
// Check DB: githubOrg value should be validated
// Actual: ❌ "$(whoami)" stored as-is
```

---

## Summary: Why These Matter

| Issue | Why Critical | Who's Affected | What You Can Do |
|-------|-------------|----------------|-----------------|
| Path traversal | Can read system files | All users | Add .refine() to schemas |
| AppName collision | Data loss, corruption | Multi-user scenarios | Add withLock() to handlers |
| No trimming | Duplicate entries | All users | Add .trim() to all schemas |
| No length limits | DB overflow, path errors | All users | Add .max() to all schemas |
| Race conditions | Silent failures | High-concurrency apps | Use mutex, locks |
| Branch validation | Unexpected git ops | All git users | Add .regex() validation |

---

## Files Involved

- `src/ipc/types/import.ts` - Define schemas
- `src/ipc/types/github.ts` - Define schemas  
- `src/ipc/handlers/import_handlers.ts` - Implement handlers
- `src/ipc/handlers/github_handlers.ts` - Implement handlers
- `src/ipc/utils/lock_utils.ts` - Use for race condition fix

---

*Analysis Date: 2026-03-05*
*Status: NO EDITS MADE - Analysis Only*
