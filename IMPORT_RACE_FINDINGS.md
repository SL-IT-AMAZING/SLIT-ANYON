# EXHAUSTIVE STALE-RESPONSE & ASYNC STATE RACE ANALYSIS
## ImportAppDialog.tsx + Related IPC Code

---

## 🔴 CRITICAL FINDINGS (Exact Line Numbers)

### FINDING 1: fetchRepos Missing Sequence Guard Initialization
**Location:** `src/components/ImportAppDialog.tsx`, line 98–110
**Pattern:** `fetchRepos()` function uses `fetchReposSeqRef` but never initializes it

```typescript
98:  const fetchRepos = async () => {
99:    setLoading(true);
100:   try {
101:     const fetchedRepos = await ipc.github.listRepos();
102:     setRepos(fetchedRepos);  // ⚠️ NO SEQUENCE CHECK
103:   } catch (err: unknown) {
104:     showError(...);
105:   } finally {
106:     if (fetchSeq === fetchReposSeqRef.current) {  // ⚠️ fetchSeq undefined
107:       setLoading(false);
107:     }
108:   }
109: };
```

**Issue:** Line 106 checks `fetchSeq === fetchReposSeqRef.current` but `fetchSeq` is never defined. This means the check ALWAYS fails and loading state leaks.

**Risk:** 
- `fetchSeq` is undefined → condition always falsy
- `setLoading(false)` never executes
- Dialog appears permanently loading after repo list fetch completes
- Stale response from earlier fetch can still overwrite `setRepos()`

**Minimal Fix:**
```typescript
const fetchRepos = async () => {
  const fetchSeq = ++fetchReposSeqRef.current;  // ← ADD THIS
  setLoading(true);
  try {
    const fetchedRepos = await ipc.github.listRepos();
    if (fetchSeq === fetchReposSeqRef.current) {  // ← NOW WORKS
      setRepos(fetchedRepos);
    }
  } catch (err: unknown) {
    if (fetchSeq === fetchReposSeqRef.current) {  // ← PROTECT ERROR
      showError(...);
    }
  } finally {
    if (fetchSeq === fetchReposSeqRef.current) {
      setLoading(false);
    }
  }
};
```

---

### FINDING 2: selectFolderMutation Missing Sequence Guards for Sequential Awaits
**Location:** `src/components/ImportAppDialog.tsx`, lines 294–315
**Pattern:** Multiple sequential `await` calls without response ordering guards

```typescript
294: const selectFolderMutation = useMutation({
295:   mutationFn: async () => {
296:     const result = await ipc.system.selectAppFolder();           // AWAIT 1
297:     if (!result.path || !result.name) return null;
298:     const aiRulesCheck = await ipc.import.checkAiRules({        // AWAIT 2
301:       path: result.path,
302:     });
303:     setHasAiRules(aiRulesCheck.exists);                          // ⚠️ NO SEQUENCE
304:     setSelectedPath(result.path);                                // ⚠️ NO SEQUENCE
305:     setCustomAppName(result.name);                               // ⚠️ NO SEQUENCE
306:     await checkAppName({ name: result.name, ... });             // AWAIT 3 + INTERNAL CHECKS
307:     return result;
308:   },
309:   onError: (error: Error) => {
310:     showError(error.message);
311:   },
312: });
```

**Issue:**
- Line 303–305: State writes happen after awaits WITHOUT sequence protection
- If user selects folder A, then immediately selects folder B:
  - Folder A's `checkAiRules` completes
  - Line 303 writes aiRulesCheck from A to state
  - Folder B's results may already be partly written
  - Stale AI_RULES check overwrites fresh data

- Line 309: `checkAppName` is awaited but `selectFolderMutation` has no sequence ref at all
- `checkAppName` internally has its own sequence guards, but the outer mutation doesn't

**Risk:**
- Race: `ipc.import.checkAiRules` from request A completes after request B's folder selection
- Stale AI_RULES state from A overwrites B's correct state
- UI shows wrong AI_RULES indicator

**Minimal Fix:**
```typescript
const selectFolderMutation = useMutation({
  mutationFn: async () => {
    const mutationSeq = ++selectFolderMutationSeqRef.current;  // ← ADD REF
    const result = await ipc.system.selectAppFolder();
    if (!result.path || !result.name) {
      selectFolderMutationSeqRef.current = mutationSeq;  // ← CLEAR IF CANCELLED
      return null;
    }
    
    const aiRulesCheck = await ipc.import.checkAiRules({
      path: result.path,
    });
    
    // ← ONLY UPDATE IF STILL LATEST REQUEST
    if (mutationSeq === selectFolderMutationSeqRef.current) {
      setHasAiRules(aiRulesCheck.exists);
      setSelectedPath(result.path);
      setCustomAppName(result.name);
    }
    
    await checkAppName({ name: result.name, skipCopy: !copyToAnyonApps });
    return result;
  },
  onError: (error: Error) => {
    showError(error.message);
  },
});

// ← ADD REF AT COMPONENT TOP
const selectFolderMutationSeqRef = useRef(0);

// ← RESET ON DIALOG OPEN/CLOSE
useEffect(() => {
  if (isOpen) {
    selectFolderMutationSeqRef.current = 0;
  }
}, [isOpen]);
```

---

### FINDING 3: Disabled Buttons Don't Prevent Race with Stale Import Responses
**Location:** `src/components/ImportAppDialog.tsx`, lines 153–195 (handleImportFromUrl) + lines 197–229 (handleSelectRepo)
**Pattern:** Button disabled on `importing || isCheckingGithubName || githubNameExists` but no sequence guard on async result

```typescript
153: const handleImportFromUrl = async () => {
154:   if (importing || isCheckingGithubName || githubNameExists) {
155:     return;  // ⚠️ ONLY CLIENT GUARD, NO SEQUENCE
156:   }
157:   setImporting(true);
158:   try {
159:     const result = await ipc.github.cloneRepoFromUrl({...});  // LONG OPERATION
160:     setSelectedAppId(result.app.id);                          // ⚠️ NO SEQUENCE
161:     const chatId = await ipc.chat.createChat(result.app.id);   // AWAIT 2
162:     navigate({...});                                           // ⚠️ NO SEQUENCE
163:     if (!result.hasAiRules) {
164:       streamMessage({...});                                    // ⚠️ NO SEQUENCE
165:     }
166:     onClose();
167:   } catch (error: unknown) {
168:     showError(...);
169:   } finally {
170:     setImporting(false);
171:   }
172: };
```

**Issue:**
- User clicks Import → setImporting(true) at line 157
- Button now disabled (checking line 154 will prevent new clicks)
- BUT: Response from previous network operation can still arrive late
- If user clicks Import, then (before response):
  1. Cancels dialog or modifies state
  2. Very slow network returns old response
  3. Line 160 executes with stale result
  4. Navigates to wrong chat, selects wrong app ID

**Risk:**
- Button disabled check doesn't stop pending responses from OLD mutations
- No sequence ref to mark which request is "current"
- Late response from cancelled request overwrites fresh state

**Minimal Fix:**
```typescript
const importUrlSeqRef = useRef(0);

const handleImportFromUrl = async () => {
  if (importing || isCheckingGithubName || githubNameExists) {
    return;
  }
  
  const importSeq = ++importUrlSeqRef.current;  // ← CAPTURE REQUEST ID
  setImporting(true);
  try {
    const result = await ipc.github.cloneRepoFromUrl({...});
    
    // ← ONLY PROCEED IF STILL CURRENT REQUEST
    if (importSeq !== importUrlSeqRef.current) return;
    
    setSelectedAppId(result.app.id);
    const chatId = await ipc.chat.createChat(result.app.id);
    
    // ← RE-CHECK AFTER AWAIT
    if (importSeq !== importUrlSeqRef.current) return;
    
    navigate({...});
    if (!result.hasAiRules) {
      streamMessage({...});
    }
    onClose();
  } catch (error: unknown) {
    if (importSeq === importUrlSeqRef.current) {  // ← ONLY SHOW ERROR IF CURRENT
      showError(...);
    }
  } finally {
    if (importSeq === importUrlSeqRef.current) {  // ← ONLY CLEAR IF CURRENT
      setImporting(false);
    }
  }
};

// Reset on dialog open/close
useEffect(() => {
  if (isOpen) {
    importUrlSeqRef.current = 0;
  } else {
    importUrlSeqRef.current = 0;
  }
}, [isOpen]);
```

---

### FINDING 4: handleSelectRepo Missing Sequence Guard (Duplicate Pattern)
**Location:** `src/components/ImportAppDialog.tsx`, lines 197–229
**Pattern:** Identical issue to handleImportFromUrl

```typescript
197: const handleSelectRepo = async (repo: GithubRepository) => {
198:   if (importing || isCheckingGithubName || githubNameExists) {
199:     return;  // ⚠️ CLIENT GUARD ONLY
200:   }
201:   setImporting(true);
202:   try {
203:     const result = await ipc.github.cloneRepoFromUrl({...});  // LONG OP
204:     setSelectedAppId(result.app.id);                          // ⚠️ NO SEQUENCE
205:     const chatId = await ipc.chat.createChat(result.app.id);   // AWAIT 2
206:     navigate({...});                                           // ⚠️ NO SEQUENCE
207:     if (!result.hasAiRules) {
208:       streamMessage({...});
209:     }
210:     onClose();
211:   } catch (error: unknown) {
212:     showError(...);
213:   } finally {
214:     setImporting(false);
215:   }
216: };
```

**Risk:** Same as FINDING 3 — stale response can overwrite fresh state

**Minimal Fix:** Add `selectRepoSeqRef` and implement same guards as handleImportFromUrl fix above.

---

### FINDING 5: selectFolderMutation Reset Gap — checkAppName State Leaks
**Location:** `src/components/ImportAppDialog.tsx`, lines 72–96 (useEffect reset logic)
**Pattern:** Dialog reset clears some state but not the mutation sequence

```typescript
72: useEffect(() => {
73:   if (isOpen) {
74:     setSelectedPath(null);
75:     setHasAiRules(null);
76:     setCustomAppName("");
77:     setNameExists(false);
78:     setInstallCommand("");
79:     setStartCommand("");
80:     setCopyToAnyonApps(true);
81:     setUrl("");
82:     setGithubAppName("");
83:     setGithubNameExists(false);
84:     setIsCheckingGithubName(false);
85:     setIsCheckingName(false);
86:     localNameCheckSeqRef.current = 0;    // ← EXISTS
87:     githubNameCheckSeqRef.current = 0;  // ← EXISTS
88:     // ⚠️ selectFolderMutationSeqRef NOT RESET (doesn't exist yet)
89:     // ⚠️ fetchReposSeqRef NOT RESET (doesn't exist yet)
90:     // ⚠️ importUrlSeqRef NOT RESET (doesn't exist yet)
91:     // ⚠️ selectRepoSeqRef NOT RESET (doesn't exist yet)
92:     if (isAuthenticated) {
93:       fetchRepos();
94:     }
95:   } else {
96:     localNameCheckSeqRef.current = 0;
97:     githubNameCheckSeqRef.current = 0;
98:   }
99: }, [isOpen, isAuthenticated]);
```

**Issue:** Once the missing refs are added (per Findings 1–4), they must be reset here too.

**Minimal Fix:**
```typescript
useEffect(() => {
  if (isOpen) {
    // ... existing resets ...
    selectFolderMutationSeqRef.current = 0;  // ← ADD
    fetchReposSeqRef.current = 0;             // ← ADD
    importUrlSeqRef.current = 0;              // ← ADD
    selectRepoSeqRef.current = 0;             // ← ADD
    if (isAuthenticated) {
      fetchRepos();
    }
  } else {
    localNameCheckSeqRef.current = 0;
    githubNameCheckSeqRef.current = 0;
    selectFolderMutationSeqRef.current = 0;   // ← ADD
    fetchReposSeqRef.current = 0;             // ← ADD
    importUrlSeqRef.current = 0;              // ← ADD
    selectRepoSeqRef.current = 0;             // ← ADD
  }
}, [isOpen, isAuthenticated]);
```

---

### FINDING 6: copyToAnyonApps Checkbox Race with checkAppName
**Location:** `src/components/ImportAppDialog.tsx`, lines 457–471
**Pattern:** Checkbox change triggers checkAppName without sequence protection

```typescript
457: <Checkbox
458:   id="copy-to-anyon-apps"
459:   checked={copyToAnyonApps}
460:   onCheckedChange={(checked) => {
461:     const shouldCopy = checked === true;
462:     setCopyToAnyonApps(shouldCopy);
463:     if (customAppName.trim() && selectedPath) {
463:       void checkAppName({              // ⚠️ VOID CAST = NO AWAIT
464:         name: customAppName,
465:         skipCopy: !shouldCopy,
466:       });
467:     }
468:   }}
469: />
```

**Issue:**
- Line 463: `void checkAppName(...)` means we don't await
- If user unchecks checkbox rapidly:
  - First check: `skipCopy: false` → IPC call
  - Second check: `skipCopy: true` → IPC call
  - Response 1 (false) arrives AFTER response 2 (true)
  - Line 280 in `checkAppName` writes stale `nameExists` value

**Risk:**
- User changes skipCopy, name checking races
- Shows "app exists" when it doesn't (based on wrong skipCopy value)
- Block import button incorrectly

**Minimal Fix:**
```typescript
const checkAppNameRef = useRef<{ seq: number }>({ seq: 0 });

<Checkbox
  id="copy-to-anyon-apps"
  checked={copyToAnyonApps}
  onCheckedChange={(checked) => {
    const shouldCopy = checked === true;
    setCopyToAnyonApps(shouldCopy);
    if (customAppName.trim() && selectedPath) {
      const checkSeq = ++checkAppNameRef.current.seq;
      checkAppName({
        name: customAppName,
        skipCopy: !shouldCopy,
        checkSeq,  // ← PASS SEQUENCE
      });
    }
  }}
/>

const checkAppName = async ({
  name,
  skipCopy,
  checkSeq,  // ← RECEIVE SEQUENCE
}: {
  name: string;
  skipCopy?: boolean;
  checkSeq?: number;
}): Promise<void> => {
  const mySeq = checkSeq ?? ++localNameCheckSeqRef.current;  // ← USE PASSED OR INCREMENT
  setIsCheckingName(true);
  try {
    const result = await ipc.import.checkAppName({ appName: name, skipCopy });
    if (mySeq === localNameCheckSeqRef.current) {
      setNameExists(result.exists);
    }
  } catch (error: unknown) {
    if (mySeq === localNameCheckSeqRef.current) {
      showError(...);
    }
  } finally {
    if (mySeq === localNameCheckSeqRef.current) {
      setIsCheckingName(false);
    }
  }
};
```

---

## 📋 SUMMARY TABLE

| Finding | File | Lines | Issue | Severity |
|---------|------|-------|-------|----------|
| 1 | ImportAppDialog.tsx | 98–110 | Missing `fetchSeq` declaration; guard always fails | 🔴 CRITICAL |
| 2 | ImportAppDialog.tsx | 294–315 | No mutation sequence ref; stale state writes after sequential awaits | 🔴 CRITICAL |
| 3 | ImportAppDialog.tsx | 153–195 | No sequence guard on late cloneRepoFromUrl response | 🔴 CRITICAL |
| 4 | ImportAppDialog.tsx | 197–229 | Duplicate of #3 in handleSelectRepo | 🔴 CRITICAL |
| 5 | ImportAppDialog.tsx | 72–96 | Missing ref resets in useEffect (depends on 1, 2, 3, 4) | 🔴 CRITICAL |
| 6 | ImportAppDialog.tsx | 460–467 | Rapid checkbox changes race with checkAppName responses | 🟠 HIGH |

---

## 🎯 IMPLEMENTATION PRIORITY

1. **First:** Add missing `fetchReposSeqRef` ref declaration (Finding 1) — enables repo list to work
2. **Second:** Add sequence guards to `handleImportFromUrl` & `handleSelectRepo` (Findings 3–4) — prevents app ID/chat ID confusion
3. **Third:** Add `selectFolderMutation` sequence guard (Finding 2) — prevents AI_RULES state corruption
4. **Fourth:** Update useEffect reset logic (Finding 5) — ensures clean state on dialog reopen
5. **Fifth:** Protect checkAppName from rapid checkbox changes (Finding 6) — prevents UI blocking on false name conflicts

---

## 🔐 EXISTING SAFEGUARDS (Already in Place)

- ✅ `localNameCheckSeqRef` & `githubNameCheckSeqRef` exist and are reset
- ✅ `checkAppName` function correctly uses sequence guards
- ✅ `handleGithubAppNameChange` & `handleAppNameChange` correctly implement sequence checks
- ✅ `handleUrlBlur` correctly implements sequence checks
- ✅ Button disable logic prevents NEW clicks (but not late responses)

---

## 🚨 NOT IN SCOPE (Already Tested/External)

- IPC handler response validation (import_handlers.ts, github_handlers.ts) — these throw correctly
- TanStack Query mutation state management — useMutation handles isPending correctly
- React state batching — modern React 18 handles correctly
