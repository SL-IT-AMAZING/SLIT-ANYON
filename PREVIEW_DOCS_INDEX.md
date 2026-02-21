# Preview Infrastructure Documentation Index

## 📍 Quick Navigation

### 🎯 I want to...

**Understand the preview system quickly**
→ Read: `README_PREVIEW_INFRASTRUCTURE.md` (Section: Quick Answer Guide)
→ Time: 5 minutes

**Make a decision about template preview approach**
→ Read: `PREVIEW_INFRASTRUCTURE_GUIDE.md` (Section: Architecture Decisions)
→ Time: 10 minutes

**Implement template preview using extended protocol**
→ Read: `PREVIEW_CODE_REFERENCE.md` (Section 1: Protocol Handler)
→ Reference: `PREVIEW_VISUAL_MAP.md` (Section 5: URL Parsing)
→ Time: 30 minutes

**Debug protocol handler issues**
→ Check: `PREVIEW_VISUAL_MAP.md` (Section 6: Security Decision Tree)
→ Reference: `PREVIEW_CODE_REFERENCE.md` (Section: Error Scenarios)
→ Time: 15 minutes

**Add new file types to protocol**
→ Find: `PREVIEW_CODE_REFERENCE.md` (MIME_TYPES mapping in Section 1)
→ Time: 5 minutes

**Understand request flow for srcDoc preview**
→ Read: `PREVIEW_VISUAL_MAP.md` (Section 3: Request Flow - Template)
→ Time: 5 minutes

**Understand request flow for protocol preview**
→ Read: `PREVIEW_VISUAL_MAP.md` (Section 2: Request Flow - Design System)
→ Time: 5 minutes

---

## 📚 Document Directory

### 1. README_PREVIEW_INFRASTRUCTURE.md

**Purpose:** Entry point and navigation guide
**Length:** 6 KB
**Format:** Structured with emojis, tables, quick reference

**Contains:**

- What each document covers and why
- Quick answer FAQ
- File quick reference table
- Getting started guide
- Key concepts
- Learning path
- Architecture decision matrix

**Best for:**

- Beginners
- Quick lookup
- Navigation

---

### 2. PREVIEW_INFRASTRUCTURE_GUIDE.md

**Purpose:** Complete architecture and design documentation
**Length:** 12 KB  
**Format:** Prose with code blocks and examples

**Contains:**

- Executive summary (2 preview systems)
- Architecture decisions (3 options for template preview)
- File locations reference
- How anyon-preview:// protocol works
- How srcDoc template preview works
- Directory structure
- Recommended implementation
- Security model
- Testing checklist
- Migration path
- File summary table

**Best for:**

- Understanding "why"
- Design decisions
- Planning implementation
- Security review

---

### 3. PREVIEW_CODE_REFERENCE.md

**Purpose:** Complete code listings and implementation details
**Length:** 14 KB
**Format:** Code blocks with inline comments

**Contains:**

- Complete `src/main/preview-protocol.ts` source
- Complete `src/ipc/utils/preview_server_manager.ts` source
- Template detail page code excerpt
- Template IPC handler code
- IPC contracts code
- Design systems configuration excerpt
- Main.ts protocol registration
- PreviewIframe component state and rendering
- Message handling patterns (postMessage)
- Design system preview URLs
- File serving examples
- Error scenarios with code
- Integration points

**Best for:**

- Implementation reference
- Code understanding
- Copy-paste snippets
- Integration examples

---

### 4. PREVIEW_VISUAL_MAP.md

**Purpose:** Visual diagrams and flowcharts
**Length:** 30 KB
**Format:** ASCII art diagrams with annotations

**Contains:**

- System architecture diagram
- Request flow: Design system preview (anyon-preview://)
- Request flow: Template preview (srcDoc)
- File organization tree
- Protocol URL parsing flowchart
- Security check decision tree
- Component communication diagram
- Memory comparison charts

**Best for:**

- Visual learners
- Understanding flow
- Decision trees
- Debugging (following the flow)

---

## 🔗 Document Relationships

```
README_PREVIEW_INFRASTRUCTURE.md (Entry)
    ├─→ PREVIEW_INFRASTRUCTURE_GUIDE.md (Architecture)
    │   └─→ PREVIEW_CODE_REFERENCE.md (Implementation)
    │       └─→ PREVIEW_VISUAL_MAP.md (Visualization)
    │
    ├─→ Quick Answer Guide → Specific documents
    │
    └─→ Learning Path → Different documents per task
```

---

## 🎓 Reading Paths by Role

### Role: Product Manager / Architect

1. README_PREVIEW_INFRASTRUCTURE.md (all sections)
2. PREVIEW_INFRASTRUCTURE_GUIDE.md (sections 1-3, 7)
3. PREVIEW_VISUAL_MAP.md (sections 1, 2, 3)
   **Time: 30 minutes**

### Role: Implementation Engineer

1. README_PREVIEW_INFRASTRUCTURE.md (Quick Answer Guide)
2. PREVIEW_INFRASTRUCTURE_GUIDE.md (sections 4-7)
3. PREVIEW_CODE_REFERENCE.md (sections 1-5)
4. PREVIEW_VISUAL_MAP.md (sections 5-7)
   **Time: 45 minutes**

### Role: Security Reviewer

1. PREVIEW_INFRASTRUCTURE_GUIDE.md (Security Model)
2. PREVIEW_CODE_REFERENCE.md (full)
3. PREVIEW_VISUAL_MAP.md (sections 5-6)
   **Time: 30 minutes**

### Role: Debugger

1. README_PREVIEW_INFRASTRUCTURE.md (FAQ)
2. PREVIEW_VISUAL_MAP.md (sections 2, 3, 5, 6)
3. PREVIEW_CODE_REFERENCE.md (Error Scenarios)
   **Time: 20 minutes**

---

## 📋 Content Map by Topic

### anyon-preview:// Protocol

- **Overview:** README_PREVIEW_INFRASTRUCTURE.md → Key Concepts
- **Architecture:** PREVIEW_INFRASTRUCTURE_GUIDE.md → Section 1
- **Code:** PREVIEW_CODE_REFERENCE.md → Section 1
- **Flow:** PREVIEW_VISUAL_MAP.md → Sections 2, 5
- **Security:** PREVIEW_VISUAL_MAP.md → Section 6

### Template Preview (Current - srcDoc)

- **Overview:** README_PREVIEW_INFRASTRUCTURE.md → Quick Answer Guide
- **Architecture:** PREVIEW_INFRASTRUCTURE_GUIDE.md → Section 6
- **Code:** PREVIEW_CODE_REFERENCE.md → Section 3
- **Flow:** PREVIEW_VISUAL_MAP.md → Section 3, 7

### Template Preview (Recommended - Extended Protocol)

- **Decision:** PREVIEW_INFRASTRUCTURE_GUIDE.md → Section 4
- **Implementation:** PREVIEW_INFRASTRUCTURE_GUIDE.md → Section 7
- **Code:** PREVIEW_CODE_REFERENCE.md → Section 1, 6
- **Visual:** PREVIEW_VISUAL_MAP.md → Sections 4, 5

### Design Systems

- **List:** README_PREVIEW_INFRASTRUCTURE.md → Key Concepts
- **Config:** PREVIEW_CODE_REFERENCE.md → Section 6
- **Directory:** PREVIEW_VISUAL_MAP.md → Section 4

### Security

- **Overview:** README_PREVIEW_INFRASTRUCTURE.md → Security Features
- **Detailed:** PREVIEW_INFRASTRUCTURE_GUIDE.md → Security Model
- **Code:** PREVIEW_CODE_REFERENCE.md → Full protocol code
- **Decision Tree:** PREVIEW_VISUAL_MAP.md → Section 6

### File Serving

- **How it works:** PREVIEW_INFRASTRUCTURE_GUIDE.md → Protocol section
- **URL Parsing:** PREVIEW_VISUAL_MAP.md → Section 5
- **Examples:** PREVIEW_CODE_REFERENCE.md → File Serving Examples

### IPC Integration

- **Contracts:** PREVIEW_CODE_REFERENCE.md → Section 5
- **Handlers:** PREVIEW_CODE_REFERENCE.md → Section 4
- **Communication:** PREVIEW_VISUAL_MAP.md → Section 7

---

## 🔍 Search Guide

Looking for...

**"registerPreviewScheme"** → PREVIEW_CODE_REFERENCE.md (Section 1)
**"MIME_TYPES"** → PREVIEW_CODE_REFERENCE.md (Section 1)
**"path.normalize"** → PREVIEW_VISUAL_MAP.md (Section 5)
**"protocol.handle"** → PREVIEW_CODE_REFERENCE.md (Section 1)
**"srcDoc"** → PREVIEW_INFRASTRUCTURE_GUIDE.md (Section 6)
**"design decision"** → PREVIEW_INFRASTRUCTURE_GUIDE.md (Section 4)
**"anyon-preview://"** → All documents
**"security"** → PREVIEW_INFRASTRUCTURE_GUIDE.md + PREVIEW_VISUAL_MAP.md (Section 6)
**"error handling"** → PREVIEW_CODE_REFERENCE.md (Error Scenarios)
**"memory overhead"** → PREVIEW_INFRASTRUCTURE_GUIDE.md (Section 6) + PREVIEW_VISUAL_MAP.md (Section 8)

---

## 📊 Document Statistics

| Document                         | Size      | Pages  | Code %  | Diagrams |
| -------------------------------- | --------- | ------ | ------- | -------- |
| README_PREVIEW_INFRASTRUCTURE.md | 6 KB      | 1      | 20%     | 10       |
| PREVIEW_INFRASTRUCTURE_GUIDE.md  | 12 KB     | 2      | 30%     | 0        |
| PREVIEW_CODE_REFERENCE.md        | 14 KB     | 3      | 80%     | 0        |
| PREVIEW_VISUAL_MAP.md            | 30 KB     | 4      | 10%     | 8        |
| **TOTAL**                        | **62 KB** | **10** | **40%** | **18**   |

---

## ✅ Verification Checklist

Before starting implementation, ensure you've:

- [ ] Read README_PREVIEW_INFRASTRUCTURE.md completely
- [ ] Understood the 3 template preview options
- [ ] Made a decision on implementation approach
- [ ] Located all key files in `src/`
- [ ] Reviewed PREVIEW_VISUAL_MAP.md section 5 (URL parsing)
- [ ] Understood security checks (PREVIEW_VISUAL_MAP.md section 6)
- [ ] Identified all existing MIME types
- [ ] Planned your template directory structure

---

## 🚀 Implementation Checklist

Before committing code:

- [ ] Protocol registration order verified (scheme before ready)
- [ ] Path traversal protection implemented
- [ ] ID validation against whitelist
- [ ] MIME types for all assets covered
- [ ] Error handling for all scenarios
- [ ] Tests written and passing
- [ ] Security boundary verified
- [ ] Documentation updated

---

## 📞 When to Use Which Document

| Question                    | Document             | Section                |
| --------------------------- | -------------------- | ---------------------- |
| Where is the protocol?      | README               | Key Concepts           |
| Why extend vs new protocol? | INFRASTRUCTURE_GUIDE | Architecture Decisions |
| Show me the code            | CODE_REFERENCE       | 1-6                    |
| How does URL parsing work?  | VISUAL_MAP           | 5                      |
| What security checks exist? | VISUAL_MAP           | 6                      |
| What are error scenarios?   | CODE_REFERENCE       | Error Scenarios        |
| How do I debug?             | README + VISUAL_MAP  | FAQ + Sections 2,3,5,6 |
| What's the migration path?  | INFRASTRUCTURE_GUIDE | Migration Path         |
| Quick facts?                | README               | Quick Answer Guide     |

---

**Last Updated:** February 2025
**Status:** Complete
