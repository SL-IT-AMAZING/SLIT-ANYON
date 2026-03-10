# oh-my-opencode Removal Audit — Complete Index

**Status**: COMPLETE & READY FOR EXECUTION  
**Date**: March 9, 2026  
**Scope**: Exhaustive enumeration of all oh-my-opencode installation and configuration code paths

---

## 📋 Overview

This audit identifies **7 executable code paths** that install, configure, or reference oh-my-opencode in the ANYON B2C Electron application. All references have been traced to source, documented with exact line numbers, and impact analysis provided.

**Key Finding**: All oh-my-opencode setup is non-critical (async, optional) and can be safely removed without affecting core application functionality.

---

## 📚 Documentation Files

### 1. **OMO_REMOVAL_SUMMARY.txt** ← START HERE
**Purpose**: High-level overview and execution checklist  
**Audience**: Anyone starting the patching process  
**Contains**:
- Findings summary
- Critical files to patch (in order)
- Verification procedure
- Safe deletion checklist
- Next steps

### 2. **OMO_REMOVAL_AUDIT.md** ← DETAILED REFERENCE
**Purpose**: Comprehensive analysis with exact code snippets  
**Audience**: Engineers doing the actual patching  
**Contains**:
- 7 detailed sections for each reference
- Exact line numbers and code snippets
- Call stacks showing data flow
- What each code path does
- How to remove/replace each one

### 3. **OMO_REMOVAL_CALL_CHAINS.txt** ← DEPENDENCY ANALYSIS
**Purpose**: Call graphs and dependency resolution  
**Audience**: Architects/reviewers ensuring no side effects  
**Contains**:
- 6 detailed call chain graphs
- Dependency mapping
- What depends on what
- Safe deletion list
- Impact analysis for each removal

### 4. **OMO_REMOVAL_QUICK_REF.txt** ← FAST LOOKUP
**Purpose**: Quick reference card during patching  
**Audience**: Developers applying patches  
**Contains**:
- File-by-file patch locations
- Line numbers for quick navigation
- Exact code to remove
- Test commands
- Verification search patterns

---

## 🎯 Quick Navigation

### I'm in a hurry
1. Read **OMO_REMOVAL_SUMMARY.txt** (5 min)
2. Apply patches from the checklist
3. Run `npm run build && npm run test`

### I want complete understanding
1. Start with **OMO_REMOVAL_SUMMARY.txt** (overview)
2. Read **OMO_REMOVAL_AUDIT.md** (detailed analysis)
3. Reference **OMO_REMOVAL_CALL_CHAINS.txt** (dependencies)
4. Use **OMO_REMOVAL_QUICK_REF.txt** (during patching)

### I need to review for safety
1. Read **OMO_REMOVAL_CALL_CHAINS.txt** (understand deps)
2. Check **OMO_REMOVAL_AUDIT.md** sections 1-2 (startup paths)
3. Review **OMO_REMOVAL_SUMMARY.txt** (safe deletion list)

---

## 🔧 The 7 Patches Required

| # | File | Size | Changes | Impact |
|---|------|------|---------|--------|
| 1 | `src/main.ts` | 707 lines | 2 | Remove startup initialization |
| 2 | `src/ipc/utils/opencode_config_setup.ts` | 199 lines | DELETE | Remove config setup module |
| 3 | `src/main/entitlement.ts` | 656 lines | 5 | Remove preset logic |
| 4 | `src/ipc/utils/vendor_binary_utils.ts` | 89 lines | 2 | Remove binary path lookup |
| 5 | `scripts/fetch-vendor-binaries.ts` | 352 lines | 3 | Remove OMOC download |
| 6 | `forge.config.ts` | ~50 lines | 1 | Remove bundling conditional |
| 7 | `engine/src/cli/config-manager/detect-current-config.ts` | N/A | 1 | Update plugin filter |

---

## 📊 Coverage Summary

**Total OMOC References Found**: 38 files
- **Executable Code**: 5 files ← PATCH THESE
- **Build Scripts**: 1 file ← PATCH THIS
- **Build Configuration**: 1 file ← PATCH THIS
- **Engine Integration**: 2 files ← PATCH (separate repo)
- **Documentation**: 28+ files ← OPTIONAL

**All Critical Paths Identified**: ✓ Yes  
**All Dependencies Mapped**: ✓ Yes  
**All Line Numbers Provided**: ✓ Yes  
**All Impacts Documented**: ✓ Yes  

---

## ✅ Verification Checklist

After applying all patches:

- [ ] No OMOC references remain in `src/`
- [ ] `npm run ts` passes (type-check)
- [ ] `npm run lint` passes (linting)
- [ ] `npm run build` completes (build)
- [ ] `npm test` passes (unit tests)
- [ ] App starts without errors
- [ ] No OMOC config is created on first run

---

## 🚀 Execution Steps

1. **Preparation**
   - Read this index file
   - Review OMO_REMOVAL_SUMMARY.txt

2. **Patching**
   - Apply patches 1-7 in order (see OMO_REMOVAL_QUICK_REF.txt)
   - Reference exact line numbers from OMO_REMOVAL_AUDIT.md as needed

3. **Verification**
   - Type-check: `npm run ts`
   - Lint: `npm run lint`
   - Build: `npm run build`
   - Test: `npm test`

4. **Commit**
   - Review changes: `git diff`
   - Commit: `git commit -m "Remove oh-my-opencode default plugin installation"`
   - Push to branch

---

## 📖 How to Use Each Document

### OMO_REMOVAL_SUMMARY.txt
```
Read this FIRST if you:
- Just want the overview
- Need to understand scope
- Want quick execution checklist
- Need verification procedures
```

### OMO_REMOVAL_AUDIT.md
```
Read this for:
- Complete context on each reference
- Exact code snippets to understand flow
- Impact analysis for each section
- Deep-dive into how OMOC is configured
```

### OMO_REMOVAL_CALL_CHAINS.txt
```
Read this for:
- Understanding dependencies
- Verifying no hidden impacts
- Dependency graphs
- Safe deletion confirmation
```

### OMO_REMOVAL_QUICK_REF.txt
```
Use this DURING patching for:
- Quick file/line lookup
- Exact code to delete
- Test commands
- Search patterns for verification
```

---

## 🔍 Key Findings

### 1. Runtime Initialization
- **File**: `src/ipc/utils/opencode_config_setup.ts`
- **When**: App startup (async, fire-and-forget)
- **What**: Initializes OMOC config, runs `oh-my-opencode install --no-tui --claude=yes`
- **Impact**: Non-critical; app works without it
- **Remove**: YES

### 2. Entitlement-Driven Config
- **File**: `src/main/entitlement.ts`
- **When**: After plan sync
- **What**: Applies PRO/LIGHT model presets to OMOC
- **Impact**: Only affects OMOC; doesn't affect core app
- **Remove**: YES

### 3. Vendor Binary Fetching
- **File**: `scripts/fetch-vendor-binaries.ts`
- **When**: `npm run fetch-vendor`
- **What**: Downloads OMOC binary from npm
- **Impact**: Only affects build setup; not runtime
- **Remove**: YES

### 4. Build Bundling
- **File**: `forge.config.ts`
- **When**: `npm run build`
- **What**: Includes OMOC binary in app resources
- **Impact**: App doesn't need it to run
- **Remove**: YES

### 5. Binary Path Resolution
- **File**: `src/ipc/utils/vendor_binary_utils.ts`
- **When**: App startup
- **What**: Looks for bundled OMOC binary
- **Impact**: Logs warning if not found; non-blocking
- **Remove**: YES

---

## ⚠️ Important Notes

### Nothing is Hidden
- All 38 files identified through exhaustive grep
- No runtime-only code missed
- No test fixtures creating OMOC configs
- All references traced to source

### All Safe to Delete
- No other code depends on OMOC setup
- All OMOC functions are self-contained
- Deletion won't cause side effects
- App functionality unaffected

### Easy to Verify
- Grep pattern provided: `grep -r "oh-my-opencode\|omoc\|OMOC" src/`
- Should return zero matches after patching
- Exact verification commands in each document

---

## 📞 Questions?

Refer to the appropriate document:

**"How do I start?"** → OMO_REMOVAL_SUMMARY.txt  
**"What exactly happens?"** → OMO_REMOVAL_AUDIT.md  
**"Is it safe to delete?"** → OMO_REMOVAL_CALL_CHAINS.txt  
**"Show me exact line numbers"** → OMO_REMOVAL_QUICK_REF.txt  

---

## 🎓 Learning Path

1. **Overview Phase** (10 min)
   - Read this index
   - Skim OMO_REMOVAL_SUMMARY.txt

2. **Understanding Phase** (30 min)
   - Read OMO_REMOVAL_AUDIT.md sections 1-2
   - Review OMO_REMOVAL_CALL_CHAINS.txt

3. **Execution Phase** (30 min)
   - Use OMO_REMOVAL_QUICK_REF.txt
   - Apply patches in order
   - Run verification

4. **Validation Phase** (15 min)
   - Run test suite
   - Verify no OMOC references
   - Commit changes

---

**Generated**: March 9, 2026  
**Status**: Complete and Ready  
**Next Action**: Read OMO_REMOVAL_SUMMARY.txt
