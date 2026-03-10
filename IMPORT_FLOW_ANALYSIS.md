# Import Flow Analysis: Edge Cases & UX Failures

## Executive Summary
The local and GitHub import flows have several critical edge cases, UX dead ends, and race condition vulnerabilities that severely impact first-run user experience. This analysis identifies 45+ failure scenarios across three categories: **URL parsing edge cases**, **name validation race conditions**, **loading state mismanagement**, and **cancellation path dead ends**.

---

## 1. URL PARSING FAILURES

### 1.1 Regex Pattern Vulnerabilities (Line 122, 1216)
**Pattern:** `/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/`

| Edge Case | Input | Expected | Actual | Impact |
|-----------|-------|----------|--------|--------|
| **SSH protocol** | `git@github.com:owner/repo.git` | Extract `repo` | Returns `null` | Silent failure, no error toast |
| **HTTPS naked URL** | `https://github.com/owner/repo` | Extract `repo` | Returns `repo` ✓ | Works but not ideal |
| **Trailing slash variants** | `https://github.com/owner/repo/` | Extract `repo` | Returns `null` | Silently fails |
| **URL with query params** | `https://github.com/owner/repo?foo=bar` | Extract `repo` | Returns `null` | User doesn't know why |
| **URL with tree/blob path** | `https://github.com/owner/repo/tree/main` | Extract `repo` | Returns `null` | Copy-paste failure |
| **GitHub Enterprise** | `https://github.acme.com/owner/repo.git` | Extract `repo` | Returns `null` | Enterprise users blocked |
| **Case sensitivity** | `HTTPS://GitHub.Com/Owner/Repo` | Extract `repo` | Returns `null` | Fails on mixed case |
| **Double protocol** | `https://https://github.com/owner/repo` | Reject | Returns `repo` (wrong owner) | Allows malformed URLs |
| **Missing owner** | `https://github.com/repo` | Reject with error | Returns `null` silently | Bad UX |
| **Repo name with dots** | `https://github.com/owner/repo.api.git` | Extract `repo.api` | Returns `repo` | Incorrect name |

### 1.2 URL Parsing UX Dead Ends

**Scenario A: User pastes SSH URL**
```
Path: GitHub URL Tab → Paste "git@github.com:owner/repo.git"
1. URL input accepts the value
2. onBlur triggers → extractRepoNameFromUrl returns null
3. No error message shown ("" !== repoName is falsy)
4. App name input stays empty
5. User sees blank form, no indication of error
6. Clicks Import → Disabled button (no URL validation before IPC)
7. User is confused why nothing happens
```
**Root Cause:** No validation toast for URL parsing failures (line 101-119)

**Scenario B: User copies from GitHub browser tab with tree path**
```
Path: GitHub URL Tab → Paste "https://github.com/owner/repo/tree/main"
1. URL accepts value
2. onBlur triggers → extractRepoNameFromUrl returns null
3. Silent failure - no app name pre-fill
4. User manually types app name
5. Click Import → "Failed to clone repository" (generic error from handler)
6. Root cause hidden from user
```
**Root Cause:** No URL validation before submission, error surfaces only after IPC call

### 1.3 Handler-Side URL Validation Issues (github_handlers.ts:1216)

**Problem:** Handler regex matches component regex, both fail on multiple URL formats
- Component: `/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/`
- Handler: `/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/`
- Both fail on SSH URLs, Enterprise URLs, query params

**Additional Handler Vulnerabilities:**
```typescript
// Line 1224: Destructuring assumes match[0,1,2] exists
const [, owner, repoName] = match;
// If match is null, throws "Cannot read property of null" before controlled error

// Line 1258-1262: Different clone URL logic based on token presence
const cloneUrl = accessToken
  ? IS_TEST_BUILD ? test_url : authenticated_url
  : public_url;
// This means same URL can resolve differently based on auth state
// No normalization between what user entered and what was cloned
```

---

## 2. NAME VALIDATION RACE CONDITIONS

### 2.1 Multi-State Check Races (Component)

**Race Condition A: Concurrent name checks during GitHub import**
```
Sequence:
T0: User types "my-app" → handleGithubAppNameChange calls checkAppName
T1: checkAppName async call starts (isCheckingGithubName = true)
T2: User quickly deletes and types "other-app"
T3: Second checkAppName call starts (overwrites first)
T4: Original response arrives → githubNameExists = false (stale data)
T5: User sees "name available" but it's actually for "other-app"
T6: Clicks Import with "my-app" if it was actually taken
T7: Backend rejects with "app already exists" error (confusing)
```
**Code Location:** Lines 197-217, 106-118
**Missing:** Request cancellation token or debouncing

**Race Condition B: checkAppName vs skipCopy state change**
```
Sequence:
T0: User with skipCopy=true checks "my-app" → searches DB only
T1: "my-app" doesn't exist in DB, nameExists = false
T2: User unchecks "Copy to anyon-apps" (skipCopy = false)
T3: useEffect re-checks name with skipCopy=false (line 81-85)
T4: Now checks filesystem too, finds collision
T5: But in parallel, handleAppNameChange might have fired again (new keystroke)
T6: Race between useEffect check and onChange check
T7: Final UI state uncertain
```
**Code Location:** Lines 81-85, 316-324
**Missing:** Dependency management in useEffect

**Race Condition C: GitHub repos tab name existence checks**
```
Scenario: User types name in GitHub Repos tab while loading
T0: Selected repos from API → repos.length > 0
T1: User types "test-app"
T2: isCheckingGithubName = true, async checkAppName fires
T3: Meanwhile, user switches to Local Folder tab
T4: onClose fires (dialog closed)
T5: async checkAppName response arrives → state update on unmounted component
T6: Warning: "Can't perform a React state update on an unmounted component"
```
**Code Location:** Lines 69-78, 197-217
**Missing:** Cleanup in useEffect on unmount or dialog close

### 2.2 Handler-Side Name Validation Issues

**Issue A: Database consistency check order (import_handlers.ts:48-71)**
```typescript
// Line 55: Only checks filesystem if skipCopy=false
if (!skipCopy) { /* check filesystem */ }

// Line 66-68: Always checks database
const existingApp = await db.query.apps.findFirst(...)

// Problem: If skipCopy=false but app exists in DB, returns exists=true
// BUT local_import handler (line 99-102) throws error on filesystem collision
// Inconsistent: component says "exists=true" but handler checks filesystem first
// Result: User changes name, clicks Import, still gets "app already exists" error
```

**Issue B: Race between checkAppName and importApp**
```
T0: User enters "new-app", clicks checkAppName → returns exists=false
T1: User clicks Import immediately
T2: importApp IPC call starts
T3: Meanwhile, another instance/process creates "new-app"
T4: importApp throws "app already exists" error
T5: User sees error despite "name was just checked"
```
**Missing:** Transactional guarantee or lock in importApp handler

---

## 3. LOADING STATE MISMANAGEMENT

### 3.1 Multiple Loading Flags Without Synchronization

**Problem A: Orphaned loading states**
```
Component has multiple independent loading flags:
- selectFolderMutation.isPending (local folder selection)
- importAppMutation.isPending (local folder import)
- loading (GitHub repos fetch)
- importing (GitHub import)
- isCheckingName (local folder name validation)
- isCheckingGithubName (GitHub name validation)

No centralized state coordination.
```

**Scenario A: Dialog close during async operation**
```
Path: GitHub URL Tab → Paste URL, click Import
T0: handleImportFromUrl called → setImporting(true)
T1: IPC call in flight
T2: User clicks Cancel button
T3: onClose() fires → dialog closes
T4: Component unmounts
T5: IPC response arrives → showError() called on unmounted component
T6: showSuccess/showError toasts might not display OR persist incorrectly
```
**Root Cause:** No AbortController on IPC calls, no cleanup on unmount

**Scenario B: Tab switching during load**
```
Path: GitHub Repos tab (repos loading), user switches to Local Folder
T0: fetchRepos() in flight (loading = true)
T1: User clicks "Local Folder" tab
T2: GitHub tab unmounts, component still mounted
T3: fetchRepos response arrives → setRepos() updates state
T4: Component tries to render undefined repos
T5: If repos referenced in render: error or blank state
```
**Root Cause:** No cleanup on tab switch, repos state persists

### 3.2 Button Disable Logic Gaps

**Issue A: Import button disabled state doesn't match actual readiness (Local)**
```typescript
// Line 536-541
disabled={
  !selectedPath ||           // Path required ✓
  importAppMutation.isPending ||  // Import in flight ✓
  nameExists ||              // Name taken ✓
  !commandsValid             // Commands valid ✓
}
```
**Missing checks:**
- `customAppName.trim().length === 0` - Empty name allowed!
- Validation that `selectedPath` is actually accessible (could be deleted after selection)
- No check that app name doesn't contain invalid characters

**Scenario A: User selects folder, clears name input, clicks Import**
```
1. User selects folder → customAppName = "folder-name"
2. User selects all in name input and presses Delete → customAppName = ""
3. isCheckingName = false (no check fired)
4. nameExists = false (was checked before, not re-checked)
5. customAppName.trim() === "" but commandsValid = true
6. Import button is ENABLED (shouldn't be)
7. User clicks Import
8. Handler receives appName = "" 
9. Handler should validate and throw, OR creates app with empty name
```
**Root Cause:** No validation for empty name before import

**Scenario B: GitHub URL Import disable logic (line 752)**
```typescript
disabled={importing || !url.trim() || !commandsValid}

// Missing validations:
// - URL format invalid (not github.com URL)
// - Extract repo name failed (url.trim() is not empty but parsing fails)
// - App name validation hasn't run yet
```

### 3.3 Loading UI Feedback Issues

**Problem: User perceives hang vs. error**
```
Path: GitHub URL tab
1. User pastes URL → onBlur fires
2. isCheckingGithubName spinner shows (line 698-700)
3. Spinner positioned as `absolute right-2 top-1/2`
4. But parent div has `space-y-2` - no `relative` positioning
5. Spinner renders in wrong position (not above input)
6. User sees spinner in unexpected location
```
**Code:** Line 698-700 positioning error

---

## 4. CANCELLATION PATH DEAD ENDS

### 4.1 Dialog Close During Operations

**Scenario A: Dialog close during local import**
```
Path: Local Folder → Select folder → Click Import → Click Cancel before completion
T0: importAppMutation.mutate() called
T1: IPC importApp in flight
T2: User clicks "Cancel" button
T3: onClose() fires → dialog closes
T4: Component unmounts
T5: IPC response arrives
T6: showSuccess or showError called on unmounted component
T7: Toast displays but user can't see it (dialog already closed)
T8: State update warning in console
```
**Root Cause:** No cleanup function in mutation, no abort on dialog close

**Scenario B: User clicks Cancel during name check**
```
Path: Local Folder → Select folder → Type name → onBlur triggers check → Click Cancel
T0: checkAppName IPC in flight (isCheckingName = true)
T1: User clicks Cancel
T2: onClose() fires, dialog closes
T3: Response arrives → showError() called on unmounted component
T4: setState warnings in console
T5: App now in inconsistent state (no way to retry cleanly)
```
**Root Cause:** No AbortController on name check IPC

### 4.2 Mutation Error State Not Reset

**Scenario: Import fails, user wants to retry**
```
Path: Local Folder → Select → Type name → Click Import
T0: importAppMutation fails with error
T1: showError() displays toast
T2: importAppMutation.isPending = false
T3: Import button becomes enabled again ✓
T4: But selectedPath, customAppName, etc. still have values
T5: User clicks Import again
T6: Might fail with same error OR might succeed (confusing)
T7: No indication whether retry was based on changes or same attempt
```
**Code:** Lines 293-295 (onError without state reset)

---

## 5. ADVANCED OPTIONS VALIDATION ISSUES

### 5.1 Command Validation Logic Flaw (Line 328)

**Code:**
```typescript
const commandsValid = hasInstallCommand === hasStartCommand;
```

**Problem: XOR logic allows invalid states**

| Install | Start | hasInstall | hasStart | commandsValid | User sees |
|---------|-------|-----------|----------|--------------|-----------|
| empty | empty | false | false | true ✓ | "Both commands are required" hidden, Import enabled ✓ |
| "npm i" | empty | true | false | false | Error shown ✓ |
| empty | "npm start" | false | true | false | Error shown ✓ |
| "npm i" | "npm start" | true | true | true ✓ | Import enabled ✓ |
| " " (space) | " " (space) | true | true | true ✓ | **BUG:** Import enabled, whitespace commands sent to handler |

**Scenario: User enters only spaces**
```
1. Advanced options → Install: "  ", Start: "  "
2. hasInstallCommand = "  ".trim().length > 0 = false
3. hasStartCommand = "  ".trim().length > 0 = false
4. commandsValid = false === false = true ✓
5. Import button enabled
6. Click Import
7. Handler receives installCommand = "  ", startCommand = "  "
8. Handler might try to execute or ignore (implementation dependent)
```

### 5.2 Advanced Options Visibility Issues

**Issue: GitHub Repos tab shows/hides advanced options conditionally**
```typescript
// Line 626: Advanced options only show if repos.length > 0
{repos.length > 0 && (
  <Accordion>
    {/* advanced options */}
  </Accordion>
)}

Scenario:
1. GitHub Repos tab, authenticated
2. User repo list loading (loading = true)
3. Advanced options not rendered
4. fetchRepos completes (loading = false, repos = [])
5. No repos found for user
6. Advanced options STILL not rendered
7. User can't set custom commands for manual import later
```

---

## 6. STATE CONSISTENCY ISSUES

### 6.1 Dialog Reopening Inconsistency

**Local Folder Tab:**
```typescript
// Line 306-314: handleClear
const handleClear = () => {
  setSelectedPath(null);
  setHasAiRules(null);
  setCustomAppName("");
  setNameExists(false);
  // Missing: reset isCheckingName!
  setInstallCommand("");
  setStartCommand("");
  setCopyToAnyonApps(true);
};

Scenario:
1. Select folder → name check in flight (isCheckingName = true)
2. Click clear button → isCheckingName NOT reset
3. UI shows loading spinner even though no check is running
4. Re-select folder → name check fires again
5. Old and new requests might race
```

**GitHub Tabs:**
```typescript
// Line 71-72: Reset on dialog open
useEffect(() => {
  if (isOpen) {
    setGithubAppName("");
    setGithubNameExists(false);
    // Missing: setIsCheckingGithubName(false)!
    // Missing: setInstallCommand(""), setStartCommand("")
  }
}, [isOpen, isAuthenticated]);

Scenario:
1. User imports from GitHub URL with commands set
2. Closes dialog
3. Re-opens dialog
4. Previous commands still there
5. User thinks they need to clear manually
6. Confusing UX
```

---

## 7. MISSING VALIDATIONS SUMMARY

### Local Import Path
- [ ] **Empty app name** - No validation, button enable allows it
- [ ] **App name with invalid characters** - No character whitelist
- [ ] **Selected path accessibility** - Not re-checked before import
- [ ] **Disk space** - No check before copying
- [ ] **Path exists during import** - Could be deleted after selection
- [ ] **Command format** - No validation for shell syntax

### GitHub URL Import
- [ ] **SSH URL format** - Silently fails, no error toast
- [ ] **GitHub Enterprise URLs** - Not supported, silent fail
- [ ] **URL with tree/blob paths** - Silent fail
- [ ] **URL query parameters** - Silent fail
- [ ] **Non-GitHub URLs** - No validation before IPC
- [ ] **Empty GitHub app name** - Falls back to repoName, but no validation shown
- [ ] **Case sensitivity** - URL parsing fails on mixed case

### GitHub Repos Import
- [ ] **Repo no longer exists** - No re-check at import time (could be deleted between selection and import)
- [ ] **App name uniqueness** - Race condition between check and import

### Command Validation
- [ ] **Whitespace-only commands** - Accepted as valid
- [ ] **Command length limit** - No validation
- [ ] **Special characters in commands** - No escaping
- [ ] **Missing executable** - Not validated before import

---

## 8. ERROR MESSAGE DEAD ENDS

### 8.1 Generic Error Messages

| Handler Error | Component Display | User Actionable? |
|---------------|------------------|------------------|
| "Source folder does not exist" | ✓ Clear | ✓ Yes - reselect |
| "An app with this name already exists" | ✓ Clear | ✓ Yes - rename |
| "Failed to clone repository" | ✗ Generic | ✗ No - unclear why |
| "Repository not found or access denied" | ✗ Generic | ✗ No - both are different fixes |
| "Failed to list collaborators" | ✗ Generic | ✗ No context |

---

## 9. EDGE CASES PRIORITY MATRIX

| # | Flow | Edge Case | Severity |
|---|------|-----------|----------|
| 1 | GitHub URL | SSH format | **High** |
| 2 | GitHub URL | Tree path | **High** |
| 3 | Name Check | Rapid typing race | **High** |
| 4 | Name Check | Dialog close during check | **High** |
| 5 | Local Import | Empty name allowed | **High** |
| 6 | Advanced Opts | Whitespace commands | **Medium** |
| 7 | Dialog | Close during import | **Medium** |
| 8 | GitHub URL | Trailing slash | **Medium** |
| 9 | Folder Select | Path deleted after select | **Medium** |
| 10 | GitHub Repos | No repos found, advanced opts hidden | **Low** |

---

## RECOMMENDATIONS

### Critical (Block First-Run UX)
1. **Add URL validation** before IPC call with clear error messages
2. **Add AbortController** to all IPC calls with dialog cleanup
3. **Add empty name validation** for all import methods
4. **Fix isCheckingName reset** on clear and dialog close
5. **Debounce name checks** to prevent races

### High Priority
6. Validate command format and trim whitespace
7. Fix advanced options visibility in GitHub Repos tab
8. Add retry UX for failed imports
9. Normalize URL parsing (handle SSH, enterprise, query params)
10. Add transactional safeguards in importApp handler

### Medium Priority
11. Improve error messages with actionable guidance
12. Add form reset on dialog close consistently
13. Validate selected path accessibility at import time
14. Add comprehensive input validation for all fields
15. Improve loading UI feedback (spinner positioning)

---

## RELATED FILES
- Component: `src/components/ImportAppDialog.tsx` (770 lines)
- IPC Types: `src/ipc/types/import.ts`, `src/ipc/types/github.ts`
- Handlers: `src/ipc/handlers/import_handlers.ts`, `src/ipc/handlers/github_handlers.ts` (1424 lines)
- E2E Tests: `e2e-tests/import.spec.ts`, `e2e-tests/github-import.spec.ts`

---

**Analysis Date:** 2026-03-05
**Status:** Ready for remediation planning
