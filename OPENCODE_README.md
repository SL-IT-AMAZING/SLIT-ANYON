# OpenCode Chat Rendering - Parity Analysis & Implementation Plan

**Status**: ✅ Complete reconnaissance and analysis complete
**Created**: March 10, 2025
**Scope**: Chat turn rendering, reasoning display, markdown, auto-scroll, streaming indicators

---

## 📚 Documentation Index

### 1. **OPENCODE_PARITY_IMPACT_MAP.md** (14KB, 309 lines)
The comprehensive reference for understanding what affects chat rendering.

**Use this to**:
- Understand the complete architecture
- See which files impact which features
- Identify exact gaps OpenCode must fill
- Reference line numbers for code locations

**Sections**:
- TIER 1: Core Rendering Surfaces (SessionTurn, AssistantMessage, Thread, etc.)
- TIER 2: Streaming & State Management (useStreamChat, chatAtoms)
- TIER 3: Auto-Scroll & Virtualization (ChatPanel, MessagesList)
- TIER 4: Animation & Visual Indicators (LogoSpinner, ScrambleText)
- TIER 5: Markdown Rendering (AnyonMarkdownParser, MarkdownContent)
- TIER 6: Message Fetching & IPC
- Parity Checklist (18 features to support)
- Integration Points Summary (10 files to update)
- File Impact Summary Table

**Read time**: 10-15 minutes for overview, 30+ for deep dive

---

### 2. **OPENCODE_IMPLEMENTATION_GUIDE.md** (7KB, 238 lines)
The tactical guide for actually implementing OpenCode parity.

**Use this to**:
- Understand the implementation phases
- Learn the critical integration points
- See code examples for changes
- Get testing checklist
- Know the gotchas

**Sections**:
- Quick Summary (two architecture paths)
- Implementation Sequence (3 phases, 5-9 hours)
- Critical Integration Points (code samples)
- Reasoning Display Strategy (ephemeral behavior)
- Auto-Scroll Handling
- Tool Grouping
- Markdown Rendering Decision (Option A vs B)
- Testing Checklist (16 items)
- Known Gotchas (6 items)
- Success Criteria (8 items)

**Read time**: 5-10 minutes for overview, 20+ for implementation

---

### 3. **OPENCODE_FILE_BY_FILE_SUMMARY.md** (9KB, 344 lines)
The quick reference for implementation work.

**Use this to**:
- Find specific files you need to change
- See line numbers for changes
- Understand what each file does
- Get implementation checklist
- See props flow diagram

**Sections**:
- Quick Lookup Tables (must change, should use, deprecate, works as-is)
- Detailed File Impact (with code examples)
- Implementation Checklist (4 phases)
- Props Flow Diagram
- Quick Commands
- Success Signals

**Read time**: 5 minutes for lookup, 15+ for understanding

---

## 🎯 Quick Start Guide

### If you have **5 minutes**:
1. Read the Key Findings section in this README
2. Skim OPENCODE_FILE_BY_FILE_SUMMARY.md Quick Lookup Tables
3. Check the Success Criteria section

### If you have **30 minutes**:
1. Read OPENCODE_FILE_BY_FILE_SUMMARY.md completely
2. Skim OPENCODE_IMPLEMENTATION_GUIDE.md for the overview
3. Review the Detailed File Impact section

### If you have **1 hour**:
1. Read OPENCODE_FILE_BY_FILE_SUMMARY.md completely
2. Read OPENCODE_IMPLEMENTATION_GUIDE.md completely
3. Review relevant sections of OPENCODE_PARITY_IMPACT_MAP.md

### If you're **implementing**:
1. Start with OPENCODE_FILE_BY_FILE_SUMMARY.md Implementation Checklist
2. Reference OPENCODE_IMPLEMENTATION_GUIDE.md for each phase
3. Use OPENCODE_PARITY_IMPACT_MAP.md for deep dives on specific files

---

## 📊 Key Findings Summary

### Files that MUST be changed (3)
1. **useStreamChat.ts** (355 lines) — Parse reasoning + tools from stream
   - Change location: Lines 156-180 (onChunk handler)
   - Complexity: 🔴 High (requires step parsing logic)

2. **chatAtoms.ts** (25 lines) — Add per-turn state atoms
   - Change location: Add new atoms for turn status
   - Complexity: 🟢 Low (just atom definitions)

3. **MessagesList.tsx** (891 lines) — Render SessionTurn instead of ChatMessage
   - Change location: Around line ~850 (render function)
   - Complexity: 🟡 Medium (prop threading)

**Total effort**: 3-5 files, 5-9 hours, Medium difficulty

### Files that are READY TO USE (8)
All fully built in chat-v2 directory, no changes needed:
- SessionTurn.tsx (424 lines)
- MarkdownContent.tsx (179 lines)
- LogoSpinner.tsx (452 lines)
- BasicTool.tsx (162 lines)
- Composer.tsx (100 lines)
- UserMessage.tsx (35 lines)
- Thread.tsx (103 lines)
- ActionBar.tsx (93 lines)

### Files that WORK AS-IS (3)
No changes needed, already support new flow:
- ChatPanel.tsx (auto-scroll works)
- AnyonMarkdownParser.tsx (keep for tag parsing)
- globals.css (animations available)

---

## 🔧 Implementation Roadmap

### Phase 1: Wire Streaming State (1-2 hours)
**Goal**: Get `working` + `statusText` + `steps` flowing through render tree

Files to modify:
- chatAtoms.ts — Add per-turn state atoms
- useStreamChat.ts — Parse reasoning/tools from stream
- MessagesList.tsx — Extract `working` state per turn

### Phase 2: Component Integration (2-3 hours)
**Goal**: Render SessionTurn in production chat

Files to modify:
- MessagesList.tsx — Import SessionTurn, use instead of ChatMessage
- SessionTurn.tsx — Verify MarkdownContent import
- AnyonMarkdownParser.tsx — Reuse markdownComponents

### Phase 3: Polish & Motion (1 hour)
**Goal**: Smooth animations and visual polish

Files to verify:
- SessionTurn.tsx — Fade-in animations
- BasicTool.tsx — Accordion animations
- globals.css — Animations available

---

## ✅ Parity Requirements Covered

- ✅ Turn Rendering (SessionTurn container)
- ✅ Reasoning Display (ephemeral, collapsible, markdown)
- ✅ Streaming Status (LogoSpinner, throttled text, animated spinner)
- ✅ Markdown Rendering (code copy, tables, GFM, custom links)
- ✅ Auto-Scroll (stream start, during streaming, stream end)
- ✅ Tool/Tag Support (30+ Anyon tags, grouping, icons)
- ✅ Composer (send/stop toggle, streaming state sync)

---

## 🎯 Success Criteria

When implemented, you should see:

✓ New turn rendered with user message in sticky bubble
✓ Assistant turn shows "Thinking..." with LogoSpinner animation
✓ Step accordion appears with collapsible tools
✓ Reasoning section hidden when stream ends
✓ Tools auto-grouped: context/edit/verify
✓ Status text updates (max every 2.5s)
✓ Auto-scroll keeps viewport at bottom during streaming
✓ Code blocks have copy button
✓ No visual regressions vs legacy ChatMessage
✓ Smooth 1000+ message chats (no jank)

---

## 🚀 Implementation Tips

### Highest Priority
1. **SessionTurn.tsx** — Already complete, lowest integration effort
2. **chatAtoms.ts** — Smallest change, lowest risk
3. **useStreamChat.ts** — Most complex but highest impact

### Common Pitfalls
1. **Reasoning ephemeral** — Must hide when `working=false`, not just collapse
2. **Status text throttling** — Only update every 2.5s during streaming
3. **Step grouping** — Complex logic, don't re-implement (use existing)
4. **Tool icons** — 30+ types, use getToolIcon() helper
5. **Auto-scroll** — Don't touch ChatPanel, it already works

### Code Patterns to Follow
- Use Jotai atoms for per-chat state
- Map<chatId, value> for per-turn tracking
- `useEffect` for streaming lifecycle
- `useMemo` for expensive computations
- Pass `working` + `steps` props for turn rendering

---

## 📞 Quick Reference Commands

```bash
# View full impact map
cat OPENCODE_PARITY_IMPACT_MAP.md

# View implementation guide
cat OPENCODE_IMPLEMENTATION_GUIDE.md

# View file-by-file summary
cat OPENCODE_FILE_BY_FILE_SUMMARY.md

# Find files that import SessionTurn
grep -r "SessionTurn" src --include="*.tsx" --include="*.ts"

# Find streaming hook usage
grep -r "useStreamChat" src --include="*.tsx" --include="*.ts"

# Check for think tags (reasoning)
grep -r "<think>" src --include="*.tsx" --include="*.ts"

# Find step extraction logic
grep -n "extractSteps\|StepItem" src/components/chat/MessagesList.tsx
```

---

## 📈 Metrics

**Total Documentation**: 891 lines across 3 files
- Impact Map: 309 lines (6 tiers, 42 sections)
- Implementation Guide: 238 lines (33 sections, 25 checklists)
- File Summary: 344 lines (27 sections, 23 checklists)

**Code Coverage**: 16 files analyzed in detail
- 3 files must change
- 8 files ready to use
- 3 files need no changes

**Effort Estimate**: 5-9 hours, Medium difficulty

---

## 🔗 Related Documentation

- `src/components/chat-v2/SessionTurn.tsx` — Turn rendering component
- `src/components/chat-v2/MarkdownContent.tsx` — Markdown renderer
- `src/hooks/useStreamChat.ts` — Streaming orchestration
- `src/atoms/chatAtoms.ts` — Chat state atoms
- `src/components/chat/MessagesList.tsx` — Turn list container

---

## 📝 Document History

- **2025-03-10**: Initial reconnaissance and analysis complete
  - 891 lines of documentation
  - 16 files analyzed
  - 3 implementation guides created

---

## ❓ FAQ

**Q: How long will implementation take?**
A: 5-9 hours depending on familiarity with the codebase. Phase 1 (state) is fastest, Phase 2 (components) is most complex.

**Q: Do I need to change ChatPanel.tsx?**
A: No. Auto-scroll is already implemented and works with SessionTurn.

**Q: Should I use MarkdownContent or AnyonMarkdownParser?**
A: Use AnyonMarkdownParser for final message content (30+ Anyon tags). MarkdownContent is for reasoning/text steps.

**Q: Can I deprecate legacy components immediately?**
A: No. Keep ChatMessage.tsx as fallback for simple messages. Deprecate after SessionTurn is stable.

**Q: What about performance with Virtuoso?**
A: ChatPanel.tsx handles Virtuoso integration. Just ensure MessagesList passes correct props.

---

**Last Updated**: March 10, 2025  
**Status**: ✅ Analysis Complete - Ready for Implementation

