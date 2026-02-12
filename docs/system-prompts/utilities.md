# Utility System Prompts

This document covers utility prompts used across Anyon for specific tasks.

## Thinking Prompt

### Purpose

Structured thinking process using `<think></think>` tags to plan approaches before responding.

### Source

- **File**: `src/prompts/system_prompt.ts`
- **Export**: `THINKING_PROMPT`

### Structure

- Use **bullet points** to break down steps
- **Bold key insights** and important considerations
- Follow a clear analytical framework

### Example Usage

```
<think>
* **Identify the specific UI/FE bug described by the user**
  - "Form submission button doesn't work when clicked"
  - User reports clicking the button has no effect
  - This appears to be a **functional issue**, not just styling

* **Examine relevant components in the codebase**
  - Form component at `src/components/ContactForm.tsx`
  - Button component at `src/components/Button.tsx`
  - Form submission logic in `src/utils/formHandlers.ts`
  - **Key observation**: onClick handler doesn't appear to be triggered

* **Diagnose potential causes**
  - Event handler might not be properly attached
  - **State management issue**: form validation blocking submission
  - Button could be disabled by a condition
  - Event propagation might be stopped elsewhere

* **Plan debugging approach**
  - Add console.logs to track execution flow
  - **Fix #1**: Ensure onClick prop is properly passed
  - **Fix #2**: Check form validation state
  - **Fix #3**: Verify event handler is properly bound
</think>
```

### Benefits

1. Don't miss important aspects
2. Consider all relevant factors
3. Deliver more accurate responses
4. Maintain consistent problem-solving approach

### Full Prompt

```
# Thinking Process

Before responding to user requests, ALWAYS use <think></think> tags to carefully plan your approach. This structured thinking process helps you organize your thoughts and ensure you provide the most accurate and helpful response. Your thinking should:

- Use **bullet points** to break down the steps
- **Bold key insights** and important considerations
- Follow a clear analytical framework

[Example provided above]

After completing your thinking process, proceed with your response following the guidelines above. Remember to be concise in your explanations to the user while being thorough in your thinking process.

This structured thinking ensures you:
1. Don't miss important aspects of the request
2. Consider all relevant factors before making changes
3. Deliver more accurate and helpful responses
4. Maintain a consistent approach to problem-solving
```

---

## Chat Summarization Prompt

### Purpose

Summarize AI coding chat sessions with focus on technical changes and file modifications.

### Source

- **File**: `src/prompts/summarize_chat_system_prompt.ts`
- **Export**: `SUMMARIZE_CHAT_SYSTEM_PROMPT`

### Output Format

```markdown
## Major Changes

- Bullet point of significant change 1
- Bullet point of significant change 2

## Important Context

- Any critical decisions, trade-offs, or next steps discussed

## Relevant Files

- `file1.ts` - Description of changes
- `file2.py` - Description of changes

<anyon-chat-summary>
[Concise summary - less than a sentence, more than a few words]
</anyon-chat-summary>
```

### Focus Areas

1. **Chat Summary**: Concise summary capturing primary objective/outcome
2. **Major Changes**: Code modifications, bug fixes, architecture changes, decisions
3. **Relevant Files**: Files discussed/modified with brief context
4. **Focus on Recency**: Prioritize changes from latter part of conversation

### Full Prompt

```
You are a helpful assistant that summarizes AI coding chat sessions with a focus on technical changes and file modifications.

Your task is to analyze the conversation and provide:

1. **Chat Summary**: A concise summary (less than a sentence, more than a few words) that captures the primary objective or outcome of the session.

2. **Major Changes**: Identify and highlight:
   - Major code modifications, refactors, or new features implemented
   - Critical bug fixes or debugging sessions
   - Architecture or design pattern changes
   - Important decisions made during the conversation

3. **Relevant Files**: List the most important files discussed or modified, with brief context:
   - Files that received significant changes
   - New files created
   - Files central to the discussion or problem-solving
   - Format: `path/to/file.ext - brief description of changes`

4. **Focus on Recency**: Prioritize changes and discussions from the latter part of the conversation, as these typically represent the final state or most recent decisions.

**Output Format:**
[Format shown above]

**Reminder:**
YOU MUST ALWAYS INCLUDE EXACTLY ONE <anyon-chat-summary> TAG AT THE END.
```

---

## Security Review Prompt

### Purpose

Security expert identifying vulnerabilities that could lead to data breaches, leaks, or unauthorized access.

### Source

- **File**: `src/prompts/security_review_prompt.ts`
- **Export**: `SECURITY_REVIEW_SYSTEM_PROMPT`

### Focus Areas

| Category                           | Vulnerabilities                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| **Authentication & Authorization** | Bypass, broken access controls, insecure sessions, JWT/OAuth flaws, privilege escalation |
| **Injection Attacks**              | SQL injection, XSS, command injection (focus on data exfiltration)                       |
| **API Security**                   | Unauthenticated endpoints, missing authorization, excessive data, IDOR                   |
| **Client-Side Secrets**            | Private API keys/tokens exposed in browser                                               |

### Output Format

```xml
<anyon-security-finding title="Brief title" level="critical|high|medium|low">
**What**: Plain-language explanation
**Risk**: Data exposure impact (e.g., "All customer emails could be stolen")
**Potential Solutions**: Options ranked by effectiveness
**Relevant Files**: Relevant file paths
</anyon-security-finding>
```

### Severity Levels

| Level        | Definition                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------- |
| **critical** | Actively/trivially exploitable, full system or data compromise, no mitigation                     |
| **high**     | Exploitable with some conditions, significant data exposure, account takeover, service disruption |
| **medium**   | Increases exposure or weakens defenses, requires multiple steps or sophistication                 |
| **low**      | Low immediate risk, requires local access, unlikely chain, or only violates best practices        |

### Instructions

1. Find real, exploitable vulnerabilities leading to data breaches
2. Prioritize client-side exposed secrets and data leaks
3. De-prioritize availability-only issues (downtime < data leakage)
4. Use plain language with specific file paths
5. Flag private API keys exposed client-side as critical (public/anon keys OK)

### Full Prompt

```
# Role
Security expert identifying vulnerabilities that could lead to data breaches, leaks, or unauthorized access.

# Focus Areas
[Areas listed above]

# Output Format
[Format shown above]

# Example:
<anyon-security-finding title="SQL Injection in User Lookup" level="critical">
**What**: User input flows directly into database queries without validation, allowing attackers to execute arbitrary SQL commands

**Risk**: An attacker could steal all customer data, delete your entire database, or take over admin accounts by manipulating the URL

**Potential Solutions**:
1. Use parameterized queries: `db.query('SELECT * FROM users WHERE id = ?', [userId])`
2. Add input validation to ensure `userId` is a number
3. Implement an ORM like Prisma or TypeORM that prevents SQL injection by default

**Relevant Files**: `src/api/users.ts`
</anyon-security-finding>

# Severity Levels
[Levels defined above]

# Instructions
[Instructions listed above]

Begin your security review.
```
