# EXHAUSTIVE EDGE-CASE ANALYSIS: Import Flows (Local + GitHub Repos + GitHub URL)

## System Architecture Quick Reference
- **UI**: `src/components/ImportAppDialog.tsx` (3 tabs: Local Folder, Your GitHub Repos, GitHub URL)
- **IPC Types**: `src/ipc/types/import.ts`, `src/ipc/types/github.ts`, `src/ipc/types/system.ts`
- **Handlers**: `src/ipc/handlers/import_handlers.ts`, `src/ipc/handlers/github_handlers.ts`
- **E2E Tests**: `e2e-tests/import.spec.ts`, `e2e-tests/github-import.spec.ts`, `e2e-tests/import_in_place.spec.ts`

---

## EDGE CASE MATRIX

### A. INPUT PARSING ERRORS

#### A.1 App Name Parsing (Local + GitHub)
| Edge Case | Input | Current Behavior | Path Reference | Consequence | Risk Level |
|-----------|-------|-----------------|-----------------|-------------|-----------|
| **Whitespace-only name** | `"   "` | `customAppName.trim()` returns `""` → fails nameExists check (line 83) | ImportAppDialog:83, checkAppName:250-253 | Empty name prevents import; but dialog allows submission if `selectedPath` null | MEDIUM |
| **Whitespace prefix/suffix** | `"  my-app  "` | Trimmed before check (line 91) via `customAppName` state directly | ImportAppDialog:90-91 | State stores untrimmed, IPC receives trimmed → DB stores trimmed (good) | LOW |
| **Name contains special chars** | `"app@#$%"` | No validation in UI or IPC layer | ImportAppDialog:49, import_handlers.ts:88 | Accepted by DB (Drizzle doesn't restrict), filesystem may fail on Windows | HIGH |
| **Name exceeds filesystem limit** | 255+ chars | No validation in UI or handler | ImportAppDialog:49, getAnyonAppPath() | Silently fails at fs.access() line 89 or copyDirectoryRecursive() | HIGH |
| **Name with path traversal** | `"../../../evil"` | No sanitization | ImportAppDialog:49, github_handlers.ts:1241 | Reaches getAnyonAppPath() which constructs path—potential escape risk | CRITICAL |
| **Unicode/emoji in name** | `"app🚀"` | Accepted as-is | ImportAppDialog:49 | Path creation depends on OS support (ok on modern systems) | LOW |
| **Empty string after extraction** | GitHub URL: `""` after regex fail | `extractRepoNameFromUrl()` returns null (line 142) | ImportAppDialog:140-142 | Regex at line 141: `/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/` → `appName` becomes `repoName` (empty) | MEDIUM |

#### A.2 GitHub URL Parsing
| Edge Case | Input | Current Behavior | Path Reference | Consequence | Risk Level |
|-----------|-------|-----------------|-----------------|-------------|-----------|
| **Malformed URL (no regex match)** | `"not-a-url"` | Handler returns `{ error: "Invalid GitHub URL..." }` (line 1219) | github_handlers.ts:1216-1222 | User sees error toast, import blocked ✓ | LOW |
| **SSH URL instead of HTTPS** | `"git@github.com:owner/repo.git"` | Regex pattern uses `[:/]` so matches `:` (line 1216) | github_handlers.ts:1216 | **Extraction succeeds**; clone attempt uses `github.com/${owner}/${repoName}.git` → incorrect syntax | HIGH |
| **GitHub Enterprise URL** | `"https://github.company.com/owner/repo.git"` | Regex only matches `github.com`, not subdomains | github_handlers.ts:1216 | **Fails extraction** → returns error ✓ | MEDIUM |
| **URL with .git but spaces** | `"https://github.com/owner/repo .git"` | Space breaks regex capture group | github_handlers.ts:1216 | **Fails** → error returned ✓ | LOW |
| **Trailing whitespace in URL** | `"https://github.com/owner/repo.git "` | `.trim()` at line 148 only trims on empty check, not stored value | ImportAppDialog:148 | **Raw URL sent to clone** → clone fails with trailing space | MEDIUM |
| **Uppercase vs lowercase** | `"https://github.com/Owner/Repo.git"` | Case preserved in extraction (line 1224) | github_handlers.ts:1224 | Sent to API correctly; GitHub treats case-insensitively | LOW |

#### A.3 Command String Parsing
| Edge Case | Input | Current Behavior | Path Reference | Consequence | Risk Level |
|-----------|-------|-----------------|-----------------|-------------|-----------|
| **Whitespace-only install cmd** | Install: `"   "`, Start: `"npm start"` | Both `.trim().length > 0` → `hasInstallCommand=false, hasStartCommand=true` | ImportAppDialog:347-349 | `!commandsValid` → **import button disabled** ✓ (prevents half-configured state) | LOW |
| **Both empty (default case)** | Both: `""` | `hasInstallCommand === hasStartCommand` → `true` | ImportAppDialog:349 | **Import enabled** ✓ (delegates to handler default behavior) | LOW |
| **One empty after user input** | User enters install, clears start | Checked on every input change (line 343) | ImportAppDialog:337-345 | **Real-time validation** → disables import ✓ | LOW |
| **Commands with shell metacharacters** | `"npm install; rm -rf /"` | No escaping in UI, passed directly to IPC | ImportAppDialog:151-152 | Reaches DB as-is; executed later via shell—**shell injection risk** | CRITICAL |
| **Newlines in command** | `"npm\ninstall"` | No validation, stored as-is | ImportAppDialog:151-152 | Depends on shell execution handler (not shown here) | HIGH |

---

### B. NAME UNIQUENESS CHECKS (Race Conditions)

#### B.1 Check → Import Race (Local Import)
| Scenario | Timeline | Path Reference | Consequence | Risk Level |
|----------|----------|-----------------|-------------|-----------|
| **Check passes, name taken before import** | (1) `checkAppName` called (line 90) → `exists=false`; (2) Another import uses same name; (3) User clicks Import (line 324) | ImportAppDialog:90-94, import_handlers.ts:66-69 | `importApp` handler checks again (line 99-107) but only via `fs.access()`; **DB check missing** → two apps with same name in DB! | CRITICAL |
| **skipCopy=false, skipCopy=true mismatch** | (1) Check with `skipCopy: !copyToAnyonApps` (line 92); (2) User toggles checkbox → triggers re-check (line 105); (3) Old check in-flight completes with stale value | ImportAppDialog:82-105 | `runNameCheck()` is async but state updates are synchronous → **stale closure over `customAppName`** | MEDIUM |
| **Concurrent name checks from multiple inputs** | User types "app", then quickly "app2"; both trigger async checks (line 88) | ImportAppDialog:87-102 | Later check might complete before earlier one → `setNameExists()` race; **state reflects wrong check result** | MEDIUM |

#### B.2 Check → GitHub Clone Race
| Scenario | Timeline | Path Reference | Consequence | Risk Level |
|----------|----------|-----------------|-------------|-----------|
| **GitHub URL: name passes check, fails clone with duplicate** | (1) User enters repo URL; (2) `handleUrlBlur()` checks name (line 127); (3) Another user creates app with same name; (4) User clicks Import | ImportAppDialog:120-138, github_handlers.ts:1242-1248 | Handler checks DB (line 1242) → throws error ✓ **BUT**: returned as `{ error: "..." }` not thrown; UI shows error but doesn't call `onClose()` → dialog stays open | MEDIUM |
| **GitHub repos list: rapid name conflicts** | (1) `handleGithubAppNameChange()` async check (line 222); (2) User clicks Import immediately (before check completes); (3) Another repo import names app same | ImportAppDialog:216-238, github_handlers.ts:1242-1248 | Same as above—handler catches and returns error object ✓ | LOW |

#### B.3 CopyToAnyonApps Checkbox Toggle
| Scenario | Timeline | Path Reference | Consequence | Risk Level |
|-----------|----------|-----------------|-------------|-----------|
| **Toggle during name check** | (1) Initial check with `skipCopy=true` (not copying); (2) User toggles checkbox to `skipCopy=false`; (3) Previous check completes → `setNameExists()` with wrong flag | ImportAppDialog:82-105 | `useEffect` dependency includes `copyToAnyonApps` (line 105) → **re-check triggered immediately** ✓ Prevents stale state | LOW |
| **Toggle, then import immediately** | (1) Toggle checkbox; (2) New check starts (line 87); (3) User clicks Import before check completes | ImportAppDialog:81-105, 285-317 | `importAppMutation` uses current `copyToAnyonApps` value (line 293) ✓; **but UI shows stale `nameExists` status** → user sees warning that clears when import starts | LOW |

---

### C. DISABLE-STATE MISMATCHES

#### C.1 Button Enable/Disable Logic
| State Combination | Expected | Actual | Path Reference | Issue | Risk Level |
|------------------|----------|--------|-----------------|-------|-----------|
| **Import pending, user types name** | Import button disabled | Button remains disabled (importing=true in mutation) | ImportAppDialog:556-562, 285-317 | `disabled={importAppMutation.isPending \|\| nameExists \|\| !commandsValid}` ✓ Correctly blocks | LOW |
| **Name exists, user clears field** | Import enabled (after name re-check) | Button stays disabled until re-check completes | ImportAppDialog:556-562, 82-105 | `useEffect` re-triggers check (line 105) → `isCheckingName=true`; UI shows spinner (line 472-476) ✓ | LOW |
| **Checkbox disabled during import** | Can't change skipCopy state mid-flight | `disabled={importAppMutation.isPending}` at line 440 | ImportAppDialog:440, 285-317 | ✓ Prevents state inconsistency | LOW |
| **URL with leading/trailing spaces + import** | Import button respects validation | `disabled={importing \|\| !url.trim() \|\| !commandsValid}` (line 767) | ImportAppDialog:767 | ✓ URL trimmed on disable check but **raw URL sent to handler** (line 150) | MEDIUM |
| **GitHub URL: both commands partial** | Import disabled | `!commandsValid` via `hasInstallCommand === hasStartCommand` (line 349) | ImportAppDialog:756-760, 767 | ✓ Correct logic; both must be empty OR both filled | LOW |

#### C.2 Import Button State During GitHub Import
| Scenario | Expected | Actual | Path Reference | Consequence | Risk Level |
|----------|----------|--------|-----------------|-------------|-----------|
| **Click import, dialog closes, user re-opens** | State cleared, fresh start | `onClose()` at line 170; dialog opens fresh via `isOpen` effect (line 70-79) | ImportAppDialog:70-79, 170, 327-335 | State properly reset ✓ | LOW |
| **Import fails, user retries same repo** | Can click Import again | `finally { setImporting(false) }` (line 176, 212) restores button state ✓ | ImportAppDialog:176, 212 | ✓ Correct | LOW |
| **Multiple tab switches during import** | Import UI locked per-tab | `importing` state shared across all tabs (line 63) | ImportAppDialog:62-63, 596, 634, 767 | **Single `importing` flag** → if importing from URL tab, repos tab also disabled ✓ (correct behavior) | LOW |

---

### D. CANCELLATION & CLEANUP

#### D.1 Mid-Flight Cancellation (Local)
| Scenario | Current Behavior | Path Reference | Consequence | Risk Level |
|----------|-----------------|-----------------|-------------|-----------|
| **Cancel button clicked during folder selection** | `selectFolderMutation.isPending=true`; clicking Cancel fires `onClose()` which doesn't abort mutation | ImportAppDialog:549-551, 319-321 | IPC call completes in background; state updates silently discarded (mutations don't track open state) | LOW |
| **Cancel button clicked during name check** | Re-check in-flight still completes; `setNameExists()` updates closed dialog state (no-op) | ImportAppDialog:82-105, 549-551 | React silently ignores state updates on unmounted component ✓ | LOW |
| **Cancel during actual import** | `importAppMutation.isPending=true`; Cancel button disabled (line 550) | ImportAppDialog:550, 285-317 | ✓ Prevents concurrent import attempts | LOW |
| **User closes dialog via X button while importing** | `onOpenChange(onClose)` fires; dialog closes but import continues | ImportAppDialog:352 | IPC mutation completes, tries `navigate()` on closed/unmounted component → React warning | MEDIUM |

#### D.2 Mid-Flight Cancellation (GitHub)
| Scenario | Current Behavior | Path Reference | Consequence | Risk Level |
|----------|-----------------|-----------------|-------------|-----------|
| **Cancel URL blur name-check** | No cancel mechanism; check completes even if user leaves field | ImportAppDialog:120-139 | Async check runs to completion; `setGithubNameExists()` updates regardless | LOW |
| **Cancel repo list name-check** | Same as above | ImportAppDialog:216-238 | ✓ Acceptable (name checks are fast) | LOW |
| **Cancel mid-clone (URL or repo)** | No abort signal passed to `gitClone()` | github_handlers.ts:1264-1276 | Clone continues in background; DB insert happens anyway; orphaned files on disk | CRITICAL |
| **Close dialog during repo fetch** | `fetchRepos()` async call continues | ImportAppDialog:107-119 | `setRepos()` updates unmounted component → React warning; repos state lost | LOW |

---

### E. EMPTY INPUT TRANSITIONS

#### E.1 Dialog Open → No Selection
| State | Behavior | Path Reference | Consequence | Risk Level |
|-------|----------|-----------------|-------------|-----------|
| **Dialog opens fresh** | All state reset (line 70-79 for GitHub repos) | ImportAppDialog:70-79 | **Local folder tab state NOT reset!** `selectedPath`, `customAppName`, `copyToAnyonApps` persist | HIGH |
| **Dialog opens, Local tab selected** | `selectedPath=null`, but `customAppName` from previous session remains | ImportAppDialog:47-54 | User sees old app name in text field; if they toggle checkbox without changing name, stale name-check runs | MEDIUM |
| **Tab switch (Local → GitHub URL → Local)** | Local folder state persists across tab switches | ImportAppDialog:47-54, 352-780 | User returns to Local tab, sees old `selectedPath`, old `customAppName` | MEDIUM |

#### E.2 Folder Selection Cancel
| Scenario | Behavior | Path Reference | Consequence | Risk Level |
|----------|----------|-----------------|-------------|-----------|
| **User opens file picker, clicks Cancel** | `selectFolderMutation.mutate()` → handler returns `{ path: null, name: null }` (line 28) | import_handlers.ts:27-29 | Mutation `onError` **not triggered** (no error thrown); no visible feedback to user | MEDIUM |
| **Handler check** | `if (!result.path \|\| !result.name) { return null }` (line 265) | ImportAppDialog:265-268 | Returns null silently; state unchanged ✓ | LOW |

#### E.3 Empty/Invalid Command Cleanup
| Scenario | Behavior | Path Reference | Consequence | Risk Level |
|----------|----------|-----------------|-------------|-----------|
| **User partial-fills advanced options, clears both** | Commands set to `""`, `commandsValid=true` (line 349) | ImportAppDialog:347-349 | Import button **enabled** ✓; handler receives `undefined` for both (line 151-152) | LOW |
| **User fills both, then clears both after toggling** | `hasInstallCommand` and `hasStartCommand` both false → `commandsValid=true` | ImportAppDialog:347-349 | Import enabled, handler gets `undefined` ✓ | LOW |

---

### F. PARSING ERROR PROPAGATION

#### F.1 Handler → UI Error Flow
| Error Source | Handler Behavior | IPC Return | UI Handling | Path Reference | Risk Level |
|--------------|-----------------|-----------|-------------|-----------------|-----------|
| **Source path missing (local)** | `throw new Error("Source folder does not exist")` (line 91) | Throws → IPC rejects | `importAppMutation.onError()` (line 314) catches → `showError(error.message)` | import_handlers.ts:88-92, ImportAppDialog:314-316 | LOW |
| **App name already exists (local)** | `throw new Error("An app with this name already exists")` (line 102) | Throws → IPC rejects | Caught by `onError` ✓ | import_handlers.ts:99-107 | LOW |
| **Git init fails (local)** | `await gitInit()` throws → **not caught** → handler throws | IPC rejects | Caught by `onError` ✓ | import_handlers.ts:119-131 | MEDIUM |
| **GitHub clone: invalid URL** | Returns `{ error: "..." }` (line 1219) | Returns union type `{ error } \| { app, hasAiRules }` | UI checks `if ("error" in result)` (line 155) → shows error toast ✓ | github_handlers.ts:1219-1222, ImportAppDialog:155-159 | LOW |
| **GitHub clone: repo not found** | Returns `{ error: "Repository not found..." }` (line 1237) | Returns error object | UI handles `"error" in result` ✓ **BUT** doesn't call `onClose()` → dialog stays open | github_handlers.ts:1235-1239, ImportAppDialog:155-159 | MEDIUM |
| **GitHub clone: name collision (DB)** | Returns `{ error: "An app named..." }` (line 1247) | Returns error object | Handled same as above ✓ | github_handlers.ts:1242-1248 | MEDIUM |
| **Name check handler error** | Throws during DB query (line 66) | IPC rejects | `showError()` toast (line 96-98) ✓ | import_handlers.ts:66, ImportAppDialog:95-98 | LOW |

#### F.2 Async/Await Error Handling Gaps
| Code Path | Error Handling | Path Reference | Issue | Risk Level |
|-----------|----------------|-----------------|-------|-----------|
| **`handleAppNameChange()` async check** | `await checkAppName()` (line 343) inside async function | ImportAppDialog:337-345 | **No catch block**; if check throws, error propagates uncaught to React | HIGH |
| **`handleUrlBlur()` name check** | `try/catch` wraps IPC call (line 125-137) | ImportAppDialog:120-139 | ✓ Proper error handling | LOW |
| **`handleImportFromUrl()` chat creation** | `const chatId = await ipc.chat.createChat()` (line 162) | ImportAppDialog:144-178 | **No try/catch** → if createChat throws, caught by outer catch (line 171) ✓ | LOW |
| **`handleSelectRepo()` chat creation** | Same as above (line 198) | ImportAppDialog:180-214 | ✓ Outer catch handles | LOW |
| **Folder selection mutation error** | `onError` handler defined (line 280-282) | ImportAppDialog:280-282 | ✓ Proper error handling | LOW |
| **Import mutation error** | `onError` handler defined (line 314-316) | ImportAppDialog:314-316 | ✓ Proper error handling | LOW |

---

### G. SPECIAL CASES

#### G.1 AI Rules Detection
| Scenario | Behavior | Path Reference | Consequence | Risk Level |
|----------|----------|-----------------|-------------|-----------|
| **Local import: AI_RULES.md exists** | Detected via `ipc.import.checkAiRules()` (line 269) | ImportAppDialog:269-272 | `hasAiRules=true` → no auto-generation prompt ✓ | LOW |
| **Local import: AI_RULES.md missing** | `hasAiRules=false` → shows warning (line 521-533) | ImportAppDialog:521-533 | User warned; success message says "...automatically generate one after importing" (line 299-300) | LOW |
| **GitHub clone: AI_RULES.md check** | Handler checks filesystem directly (line 1277) | github_handlers.ts:1277-1278 | ✓ Accurate detection via `fs.existsSync()` | LOW |
| **GitHub clone: warning not shown** | No warning in GitHub import flow | ImportAppDialog:180-214, 144-178 | **Gap**: User not warned about AI_RULES generation (only in local flow) | MEDIUM |

#### G.2 Copy vs In-Place (skipCopy)
| Scenario | Expected | Actual | Path Reference | Issue | Risk Level |
|----------|----------|--------|-----------------|-------|-----------|
| **skipCopy=true (in-place)** | App registered with full `sourcePath` | `path: skipCopy ? sourcePath : appName` (line 141) | ✓ Full path stored in DB | LOW |
| **skipCopy=false (copy)** | App registered with app name only (relative) | `path: appName` (line 141) | ✓ Name-based path used; `getAnyonAppPath(appName)` resolves it | LOW |
| **skipCopy: path validation missing** | No check that `sourcePath` is writable/accessible | import_handlers.ts:88-92 only checks read access before copy | If user selects dir where they lack write access and skipCopy=true, app registers but future writes fail | MEDIUM |
| **skipCopy: name check skipped** | Check still runs if `skipCopy=false` but not if `skipCopy=true` | import_handlers.ts:54-62 | When in-place: **filesystem check skipped, only DB checked** → two apps could have same name if both in-place (different paths) | MEDIUM |

#### G.3 GitHub vs Local App Paths
| Type | Path Stored | Path Resolution | Reference | Issue |
|------|-------------|-----------------|-----------|-------|
| **Local copy** | `appName` | `getAnyonAppPath(appName)` | import_handlers.ts:141, app.ts | ✓ Normalized |
| **Local in-place** | `sourcePath` (absolute) | Stored path used directly | import_handlers.ts:141 | **Inconsistency**: one app has relative, one absolute in DB |
| **GitHub clone** | `finalAppName` | `getAnyonAppPath(finalAppName)` | github_handlers.ts:1285 | ✓ Normalized |
| **Path consistency** | Apps have inconsistent storage format | Resolved at read time | app_handlers.ts (not shown) | May cause bugs if code assumes relative paths |

---

### H. CONCURRENCY & LOCKING

#### H.1 Import Handler Concurrency
| Scenario | Current | Path Reference | Consequence | Risk Level |
|----------|---------|-----------------|-------------|-----------|
| **Two users import same app simultaneously** | No locking in `importApp` handler | import_handlers.ts:75-159 | Race: both pass uniqueness check → both insert to DB; second insert fails via unique constraint or succeeds (depends on DB) | MEDIUM |
| **GitHub clone: simultaneous clones of same repo** | No locking in `handleCloneRepoFromUrl()` | github_handlers.ts:1208-1317 | Both pass uniqueness check (line 1242) → both try to clone to same appPath (line 1250) → disk conflict | CRITICAL |
| **Local import: concurrent copyDirectoryRecursive** | No locking on filesystem operations | import_handlers.ts:111 | Multiple imports of same source → file copy race condition | HIGH |
| **Name check: race before import** | Check is separate IPC call (no transaction) | import_handlers.ts:48-72 vs import_handlers.ts:75-159 | Classic TOCTOU (Time-of-Check-Time-of-Use): name free at check, taken by another user before import | CRITICAL |

#### H.2 Mutations in Dialog
| Scenario | Current | Path Reference | Consequence | Risk Level |
|----------|---------|-----------------|-------------|-----------|
| **User rapidly switches tabs, clicks Import on both** | No coordination; each mutation independent | ImportAppDialog:262-317, 285-317 | Second mutation overwrites first in-flight → both may succeed to DB with different states | LOW (rare in practice due to UI blocking) |
| **User closes dialog, re-opens, triggers same import** | Dialog state reset (line 70-79 for GitHub) but not Local folder tab | ImportAppDialog:70-79, 47-54 | Old state persists; user might click old "Import" from previous session | MEDIUM |

---

### I. VALIDATOR SCHEMA GAPS (Zod)

#### I.1 Import Contracts
| Schema | Field | Validation | Gap | Reference | Risk |
|--------|-------|-----------|-----|-----------|------|
| `ImportAppParamsSchema` | `path` | `z.string()` | No path format checks; accepts `""` | import.ts:9 | MEDIUM |
| `ImportAppParamsSchema` | `appName` | `z.string()` | No length limit; no char validation | import.ts:10 | HIGH |
| `ImportAppParamsSchema` | `installCommand` | `z.string().optional()` | No shell-safety validation | import.ts:11 | CRITICAL |
| `ImportAppParamsSchema` | `startCommand` | `z.string().optional()` | No shell-safety validation | import.ts:12 | CRITICAL |
| `CheckAppNameParamsSchema` | `appName` | `z.string()` | Empty string passes; no length limits | import.ts:26 | MEDIUM |
| `CloneRepoParamsSchema` | `url` | `z.string()` | No URL format validation (done in handler instead) | github.ts:91 | MEDIUM |
| `CloneRepoParamsSchema` | `appName` | `z.string().optional()` | Optional; empty allowed | github.ts:92 | LOW (fallback to repoName) |

#### I.2 Validation Timing
| Check Type | Where | When | Gap | Risk |
|-----------|-------|------|-----|------|
| **App name** | Handler (`checkAppName`) | On every keystroke (async) | Validation async; button can enable/disable mid-check | MEDIUM |
| **URL parsing** | Handler (`cloneRepoFromUrl`) | During import | Only after user clicks Import | Can waste time if URL invalid | LOW |
| **Shell commands** | Never | — | **No validation at all**; commands passed directly to execution layer | CRITICAL |

---

## SUMMARY VULNERABILITY MATRIX

### Critical Issues (MUST FIX)
1. **Shell Injection Risk** (A.3): Commands with metacharacters executed unsanitized
2. **Path Traversal Risk** (A.1): App name `"../../../evil"` not sanitized before `getAnyonAppPath()`
3. **Clone Abort Missing** (D.2): No way to cancel mid-clone; orphaned repos on disk
4. **Concurrent Clone Race** (H.2): Two simultaneous clones to same path; disk corruption
5. **TOCTOU Race (DB Uniqueness)** (H.1, B.1): Name check → import has unprotected gap; duplicate names in DB

### High Issues (SHOULD FIX)
1. **Filename Length** (A.1): No validation of >255 char names
2. **Special Characters in Names** (A.1): `@#$%` etc. accepted, may break filesystems
3. **SSH URL Not Supported** (A.2): SSH URLs match regex but clone will fail
4. **Async Error Handling Gap** (F.2, D.1): `handleAppNameChange()` has no catch block
5. **Local Tab State Persistence** (E.1): State not cleared on dialog reopen

### Medium Issues (COULD FIX)
1. **GitHub URL with Trailing Space** (A.2): Space preserved; clone fails
2. **Stale Name Check** (B.1): Race between check completion and state update
3. **Tab-Scoped State** (E.1): Switching tabs shows old app name
4. **Copy Path Inconsistency** (G.3): In-place stores absolute, copy stores relative
5. **In-Place Uniqueness Gap** (G.2): Two in-place apps could share name (different paths)
6. **Error Recovery** (F.1): GitHub clone errors don't close dialog
7. **Repo Fetch Error** (D.2): No cancel on repo list fetch errors

---

## RECOMMENDED TEST CASES

### Parsing Error Tests
- [ ] App name: `"../../../etc/passwd"` → should reject or sanitize
- [ ] App name: 260+ char string → should error or truncate
- [ ] App name: `"app@#$%^&*()"` on Windows → validate filesystem compatibility
- [ ] GitHub URL: `"git@github.com:owner/repo.git"` → should error or convert
- [ ] Commands: `"npm install && rm -rf /"` → should error or escape

### Race Condition Tests
- [ ] Click "Select Folder", immediately toggle `copyToAnyonApps` → name check uses correct flag
- [ ] Name check in-flight, click Import before completion → uses stale or new result?
- [ ] Simultaneous `importApp` from two IPC clients → database constraint enforced
- [ ] Two GitHub clones of same repo URL simultaneously → only one succeeds or error

### Cancellation Tests
- [ ] Cancel dialog during folder selection → no orphaned state
- [ ] Cancel during name check → async check doesn't update closed component
- [ ] Cancel during GitHub clone → no orphaned directory on disk
- [ ] Close tab during import → no `navigate()` on closed window

### State Cleanup Tests
- [ ] Open dialog, select folder, close dialog → reopen shows fresh state
- [ ] Open Local tab, switch to GitHub URL → return to Local → see old folder path
- [ ] Fill advanced options, toggle checkbox → commands preserved/cleared correctly
- [ ] Import fails, retry same config → state allows retry

---

## EDGE CASE REMEDIATION PRIORITY

**Tier 0 (Before Production)**:
- Shell injection: Add shell quoting/escaping
- Path traversal: Validate app name is filename-safe
- Clone abort: Add AbortController to git operations
- Concurrent clone: Add locking around clone/insert
- TOCTOU: Use DB transaction or add unique constraint + retry logic

**Tier 1 (High Priority)**:
- Filename length: Validate ≤255 chars
- SSH URL support: Expand regex or convert ssh→https
- Dialog state: Reset Local tab on reopen
- Async error handling: Add catch blocks

**Tier 2 (Medium Priority)**:
- Trailing whitespace: `.trim()` URL before sending
- Stale checks: Add race-safe check ID/version
- GitHub tab warning: Add AI_RULES warning to GitHub flows
- Path consistency: Use relative paths everywhere

