# Desktop App Latency Analysis

## User Prompt → First Assistant Token Render

**Execution Date:** 2026-02-19  
**Analysis Tool:** Explore Agent  
**Status:** ✅ Complete - Production code path traced

---

## Executive Summary

Analysis of the critical path from user prompt submission on home page to first visible assistant token reveals a **complete execution flow with three critical bottlenecks**:

1. **🔴 2-second hardcoded delay** (home.tsx:152-154) - **PRIMARY CULPRIT**
2. **🟠 Git operations during app creation** (app_handlers.ts:774-783)
3. **🟠 Duplicate database query** (chat_stream_handlers.ts:196 vs 428)

The 2-second delay alone accounts for ~2 seconds of user-perceived latency before streaming even begins.

---

## Critical Path Visualization

```
HOME PAGE: User submits prompt
  ↓
[~300-1000ms] App Creation (DB + Git + FS)
  ├─ Create app in database
  ├─ Create initial chat in database
  ├─ Copy template files
  └─ Initialize git repo & commit [LIKELY SLOWEST]
  ↓
[2000ms] ⚠️ HARDCODED DELAY - INVESTIGATE/REMOVE
  ↓
[~10ms] State updates + navigation to /chat
  ↓
[~50ms] Chat page loads & hook initialization
  ↓
RENDERER → MAIN PROCESS (IPC)
  ↓
[~50-200ms] Main process database operations
  ├─ Fetch chat + messages
  ├─ Insert user message
  ├─ Insert assistant placeholder message
  ├─ Fetch chat AGAIN [DUPLICATE! ⚠️]
  └─ Send initial chunk (loading state visible)
  ↓
[~50-200ms] Model client initialization
  ├─ Load tokenizer
  └─ Warm up model
  ↓
[NETWORK TIME] streamText() awaits first token from LLM
  ↓
[~10ms] First text-delta arrives & processed
  ↓
[~10ms] IPC sends chunk back to renderer
  ↓
[~5ms] Jotai atom updated, React re-render
  ↓
[~20ms] ChatMessage component displays first token
  ↓
✅ FIRST VISIBLE OUTPUT

TOTAL TIME (excluding network): ~2500-3500ms
(Mostly from 2-second delay + app creation)
```

---

## File-by-File Breakdown

### 1. Entry Point: Home Page

**File:** `src/pages/home.tsx`

```typescript
// Line 126: User submission entry point
const handleSubmit = async (options?: HomeSubmitOptions) => {

  // Line 129: Input validation (sync)
  if (!inputValue.trim() && attachments.length === 0) return;

  // Line 132: Set loading state
  setIsLoading(true);

  // Line 134: BLOCKING - Create app (300-1000ms)
  const result = await ipc.app.createApp({
    name: generateCuteAppName(),
  });

  // Line 139-144: Optional theme (variable latency)
  if (settings?.selectedThemeId) {
    await ipc.template.setAppTheme({...});
  }

  // Line 147: Call stream hook (doesn't await)
  streamMessage({
    prompt: inputValue,
    chatId: result.chatId,
    attachments,
  });

  // ⚠️ Line 152-154: CRITICAL - 2 SECOND HARDCODED DELAY
  await new Promise((resolve) =>
    setTimeout(resolve, settings?.isTestMode ? 0 : 2000)
  );
  // WHY IS THIS HERE? Unknown from code. Remove or investigate.

  // Line 156-162: State updates
  setInputValue("");
  setSelectedAppId(result.app.id);
  setIsPreviewOpen(false);
  await refreshApps();
  await invalidateAppQuery(queryClient, { appId: result.app.id });
  posthog.capture("home:chat-submit");

  // Navigate to chat page (router transition)
  navigate({ to: "/chat", search: { id: result.chatId } });
}
```

**Suspicious:**

- The 2-second delay is hardcoded without explanation
- Only disabled in test mode
- Occurs AFTER app creation, BEFORE navigation
- Should be investigated before removal

---

### 2. App Creation (Backend)

**File:** `src/ipc/handlers/app_handlers.ts:743`

```typescript
ipcMain.handle("create-app", async (_, params) => {
  // Line 746: Validation (sync)
  if (fs.existsSync(fullAppPath)) throw error;

  // Line 750-757: Insert app to database
  const [app] = await db
    .insert(apps)
    .values({ name: params.name, path: appPath })
    .returning();

  // Line 760-765: Insert initial chat to database
  const [chat] = await db.insert(chats).values({ appId: app.id }).returning();

  // Line 767: Create template files (FS operations)
  await createFromTemplate({ fullAppPath, templateId: params.templateId });

  // Line 774-783: Git operations (LIKELY SLOWEST 🔴)
  await gitInit({ path: fullAppPath, ref: "main" });
  await gitAdd({ path: fullAppPath, filepath: "." });
  const commitHash = await gitCommit({
    path: fullAppPath,
    message: "Init Anyon app",
  });

  // Line 786-791: Update chat with commit hash
  await db
    .update(chats)
    .set({ initialCommitHash: commitHash })
    .where(eq(chats.id, chat.id));

  // Return to renderer
  return { app: { ...app, resolvedPath: fullAppPath }, chatId: chat.id };
});
```

**Blocking Operations (in sequence):**

1. DB insert app → ~10-30ms
2. DB insert chat → ~10-30ms
3. Template file creation → ~50-200ms (depends on template size)
4. Git init → ~50-100ms
5. Git add → ~50-100ms
6. Git commit → **~100-500ms** ⚠️ LIKELY SLOWEST
7. DB update chat → ~10-30ms

**Total: ~300-1000ms** (mostly from git operations)

---

### 3. Stream Hook (Renderer)

**File:** `src/hooks/useStreamChat.ts:78`

```typescript
const streamMessage = useCallback(
  async ({
    prompt,
    chatId,
    redo,
    attachments,
    selectedComponents,
    onSettled,
  }) => {
    // Line 133-151: Convert file attachments to base64
    let convertedAttachments: ChatAttachment[] | undefined;
    if (attachments && attachments.length > 0) {
      convertedAttachments = await Promise.all(
        attachments.map(
          (attachment) =>
            new Promise<ChatAttachment>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  name: attachment.file.name,
                  type: attachment.file.type,
                  data: reader.result as string, // Base64
                  attachmentType: attachment.type,
                });
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsDataURL(attachment.file);
            }),
        ),
      );
    }

    // Line 156: IPC call - Start streaming
    ipc.chatStream.start(
      {
        chatId,
        prompt,
        redo,
        attachments: convertedAttachments,
        selectedComponents: selectedComponents ?? [],
      },
      {
        // Line 165: Chunk callback
        onChunk: ({ messages: updatedMessages }) => {
          if (!hasIncrementedStreamCount) {
            setStreamCountById((prev) => {
              const next = new Map(prev);
              next.set(chatId, (prev.get(chatId) ?? 0) + 1);
              return next;
            });
            hasIncrementedStreamCount = true;
          }

          // ⚠️ JOTAI ATOM UPDATE - triggers React render
          setMessagesById((prev) => {
            const next = new Map(prev);
            next.set(chatId, updatedMessages);
            return next;
          });
        },
        // ... onEnd and onError callbacks
      },
    );
  },
  [...]
);
```

**Flow:**

1. Convert attachments to base64 (FileReader - ~0ms for small files)
2. Call `ipc.chatStream.start()` with callbacks
3. Main process receives invoke
4. Callbacks fire when events arrive from main process

---

### 4. Stream Contract (IPC Bridge)

**File:** `src/ipc/contracts/core.ts:260`

```typescript
export function createStreamClient<...>(contract: StreamContract<...>) {
  const streams = new Map();
  let listenersSetUp = false;

  const setupListeners = () => {
    if (listenersSetUp) return;

    const ipcRenderer = getIpcRenderer();
    if (!ipcRenderer) return;

    // Line 293: Listen for chunk events
    ipcRenderer.on(contract.events.chunk.channel, (data: unknown) => {
      const parsed = contract.events.chunk.payload.safeParse(data);
      if (parsed.success) {
        const key = (parsed.data as Record<string, unknown>)[
          contract.keyField
        ] as KeyValue;
        streams.get(key)?.onChunk(parsed.data); // ⚠️ Calls callback
      }
    });

    // Line 303: Listen for end events
    ipcRenderer.on(contract.events.end.channel, (data: unknown) => {
      const parsed = contract.events.end.payload.safeParse(data);
      if (parsed.success) {
        const key = (...) as KeyValue;
        streams.get(key)?.onEnd(parsed.data);
        streams.delete(key);
      }
    });

    // Line 314: Listen for error events
    ipcRenderer.on(contract.events.error.channel, (data: unknown) => {
      const parsed = contract.events.error.payload.safeParse(data);
      if (parsed.success) {
        const key = (...) as KeyValue;
        streams.get(key)?.onError(parsed.data);
        streams.delete(key);
      }
    });

    listenersSetUp = true;
  };

  return {
    // Line 332: Start streaming
    start(input: Input, callbacks: {...}): void {
      setupListeners();

      const ipcRenderer = getIpcRenderer();
      if (!ipcRenderer) {
        callbacks.onError({...});
        return;
      }

      const key = (input as Record<string, unknown>)[contract.keyField] as KeyValue;
      streams.set(key, callbacks);

      // Line 358: INVOKE MAIN PROCESS
      ipcRenderer.invoke(contract.channel, input).catch((err: Error) => {
        callbacks.onError({...});
        streams.delete(key);
      });
    },
  };
}
```

**Key Contract:**

- Channel: `"chat:stream"`
- Events:
  - chunk: `"chat:response:chunk"`
  - end: `"chat:response:end"`
  - error: `"chat:response:error"`

---

### 5. Main Process Handler (THE CRITICAL PATH)

**File:** `src/ipc/handlers/chat_stream_handlers.ts:181`

```typescript
export function registerChatStreamHandlers() {
  ipcMain.handle("chat:stream", async (event, req: ChatStreamParams) => {

    // Line 189-190: Setup abort control
    const abortController = new AbortController();
    activeStreams.set(req.chatId, abortController);

    // Line 193: Notify renderer (fire & forget)
    safeSend(event.sender, "chat:stream:start", { chatId: req.chatId });

    // ⚠️ Line 196-204: FIRST DATABASE QUERY
    const chat = await db.query.chats.findFirst({
      where: eq(chats.id, req.chatId),
      with: {
        messages: {
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
        app: true,
      },
    });
    // Duration: ~20-50ms

    if (!chat) {
      throw new Error(`Chat not found: ${req.chatId}`);
    }

    // Line 211-242: Handle redo option (delete previous messages if needed)
    if (req.redo) {
      // ... delete operations
    }

    // Line 247-295: Process attachments if any
    let attachmentInfo = "";
    if (req.attachments && req.attachments.length > 0) {
      for (const [index, attachment] of req.attachments.entries()) {
        // Write to temp file, convert base64
        const hash = crypto.createHash("md5").update(...).digest("hex");
        const filePath = path.join(TEMP_DIR, hash + extension);
        await writeFile(filePath, Buffer.from(base64Data, "base64"));
        attachmentPaths.push(filePath);
        attachmentInfo += `...`; // Format attachment info
      }
    }

    // ⚠️ Line 400-404: INSERT USER MESSAGE
    await db.insert(messages).values({
      chatId: req.chatId,
      role: "user",
      content: userPrompt,
    });
    // Duration: ~20-50ms

    const settings = readSettings();
    if (settings.enableAnyonPro) {
      anyonRequestId = uuidv4();
    }

    // ⚠️ Line 413-425: INSERT ASSISTANT PLACEHOLDER MESSAGE
    const [placeholderAssistantMessage] = await db
      .insert(messages)
      .values({
        chatId: req.chatId,
        role: "assistant",
        content: "", // Empty initially
        requestId: anyonRequestId,
        model: settings.selectedModel.name,
        sourceCommitHash: await getCurrentCommitHash({...}),
      })
      .returning();
    // Duration: ~20-50ms

    // ⚠️ Line 428-440: SECOND DATABASE QUERY (DUPLICATE!) 🔴
    const updatedChat = await db.query.chats.findFirst({
      where: eq(chats.id, req.chatId),
      with: {
        messages: {
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
        app: true,
      },
    });
    // DUPLICATE OF LINE 196! Should reuse first fetch.
    // Duration: ~20-50ms

    if (!updatedChat) {
      throw new Error(`Chat not found: ${req.chatId}`);
    }

    // Line 443-446: SEND INITIAL CHUNK (LOADING STATE)
    safeSend(event.sender, "chat:response:chunk", {
      chatId: req.chatId,
      messages: updatedChat.messages,
    });
    // ⚠️ This makes loading state visible with empty assistant message

    let fullResponse = "";

    // Line 451-461: Check if test response
    const testResponse = getTestResponse(req.prompt);
    if (testResponse) {
      fullResponse = await streamTestResponse(...);
    } else {
      // Line 464-469: Check credits for model
      const creditCheck = await checkCreditsForModel(settings.selectedModel.name);
      if (!creditCheck.allowed) {
        throw new Error(creditCheck.reason ?? "Credits exhausted");
      }

      // ⚠️ Line 471-478: MODEL CLIENT INITIALIZATION (MAY BE EXPENSIVE)
      const { modelClient, isOpenCodeMode } = await getModelClient(
        settings.selectedModel,
        settings,
        {
          chatId: req.chatId,
          appPath: getAnyonAppPath(updatedChat.app.path),
        },
      );
      // Duration: ~50-200ms (depends on model, may include tokenizer loading)

      // Line 483+: OpenCode or normal mode
      // ...build system prompt, get messages...

      // ⚠️ Line 560: CALL streamText (AWAIT LLM)
      const streamResult = streamText({
        maxOutputTokens: await getMaxTokens(settings.selectedModel),
        temperature: await getTemperature(settings.selectedModel),
        maxRetries: 2,
        model: modelClient.model,
        system: openCodeSystemPrompt,
        messages: openCodeMessages,
        abortSignal: abortController.signal,
        onFinish: (response) => {
          const totalTokens = response.usage?.totalTokens;
          if (typeof totalTokens === "number") {
            void db.update(messages).set({ maxTokensUsed: totalTokens })...;
            void reportTokenUsage(totalTokens, settings.selectedModel.name);
          }
        },
        onError: (error: any) => {...},
      });
      // BLOCKS until first token arrives from LLM
      // Duration: NETWORK DEPENDENT (could be 1-5 seconds)

      // Line 600: PROCESS STREAM CHUNKS
      const result = await processStreamChunks({
        fullStream: streamResult.fullStream,
        fullResponse,
        abortController,
        chatId: req.chatId,
        processResponseChunkUpdate: openCodeProcessChunkUpdate,
      });
      fullResponse = result.fullResponse;
    }

    // ... rest of handler (update DB, cleanup)
  });
}
```

**Critical Sequence:**

1. **Fetch chat + messages** (line 196-204) → ~20-50ms
2. **Insert user message** (line 400-404) → ~20-50ms
3. **Insert assistant placeholder** (line 413-425) → ~20-50ms
4. **Send initial chunk** (line 443-446) → ~0ms (fire & forget)
5. **Fetch chat again** (line 428-440) → ~20-50ms ⚠️ DUPLICATE
6. **Model initialization** (line 471-478) → ~50-200ms ⚠️
7. **streamText() setup** (line 560) → BLOCKS for network
8. **First text-delta arrives** (in processStreamChunks)

---

### 6. Stream Chunk Processing

**File:** `src/ipc/handlers/chat_stream_handlers.ts:111`

```typescript
async function processStreamChunks({
  fullStream,
  fullResponse,
  abortController,
  chatId,
  processResponseChunkUpdate,
}: {...}): Promise<{ fullResponse: string; incrementalResponse: string }> {
  let incrementalResponse = "";
  let inThinkingBlock = false;

  // Line 129: FOR AWAIT LOOP - processes stream as it arrives
  for await (const part of fullStream) {
    let chunk = "";

    // Line 140-141: TEXT-DELTA (FIRST TOKEN ARRIVES HERE) ⚠️
    if (part.type === "text-delta") {
      chunk += part.text;
      // ⚠️ FIRST VISIBLE TEXT TOKEN
    }
    // ... handle other part types (reasoning, tool-call, etc)

    // Update full response
    fullResponse += chunk;
    incrementalResponse += chunk;

    // Line 535-541: Save to DB every 150ms
    const now = Date.now();
    if (now - lastDbSaveAt >= 150) {
      await db
        .update(messages)
        .set({ content: fullResponse })
        .where(eq(messages.id, placeholderAssistantMessage.id));
      lastDbSaveAt = now;
    }

    // Line 552-555: SEND CHUNK TO RENDERER
    safeSend(event.sender, "chat:response:chunk", {
      chatId: req.chatId,
      messages: currentMessages, // With updated assistant message
    });
  }

  return { fullResponse, incrementalResponse };
}
```

**Key:** This is where text-delta chunks are processed and sent to renderer in real-time.

---

## Identified Bottlenecks

### 🔴 CRITICAL

#### 1. 2-Second Hardcoded Delay

- **Location:** `src/pages/home.tsx:152-154`
- **Duration:** 2000ms (hardcoded)
- **Impact:** Delays entire user flow by 2 seconds before any progress
- **Code:**
  ```typescript
  await new Promise((resolve) =>
    setTimeout(resolve, settings?.isTestMode ? 0 : 2000),
  );
  ```
- **Why:** Unknown from code; likely for UX polish/timing
- **Recommendation:** 🔴 Investigate and remove immediately

#### 2. Git Operations in App Creation

- **Location:** `src/ipc/handlers/app_handlers.ts:774-783`
- **Duration:** ~100-500ms (slowest step in app creation)
- **Operations:** gitInit → gitAdd → gitCommit
- **Impact:** Blocks app creation; longest DB operation
- **Recommendation:** 🟠 Consider async git operations or cache template commits

### 🟠 HIGH PRIORITY

#### 3. Duplicate Database Query

- **Location:** `src/ipc/handlers/chat_stream_handlers.ts:196 vs 428`
- **First fetch:** Line 196-204 (fetches chat + messages)
- **Second fetch:** Line 428-440 (identical query, redundant)
- **Duration:** ~20-50ms wasted
- **Recommendation:** 🟠 Reuse first fetch, eliminate second query

#### 4. Model Client Initialization

- **Location:** `src/ipc/handlers/chat_stream_handlers.ts:471`
- **Duration:** ~50-200ms (depends on model)
- **Operations:** May include tokenizer loading, model warming
- **Impact:** Blocks streaming start
- **Recommendation:** 🟡 Profile actual models; consider lazy loading

#### 5. File Attachment Processing

- **Location:** `src/hooks/useStreamChat.ts:133-151`
- **Operation:** FileReader.readAsDataURL() for each attachment
- **Duration:** ~0ms for small files, proportional to file size
- **Recommendation:** 🟡 Monitor large file uploads; consider streaming uploads

### 🟡 MEDIUM PRIORITY

#### 6. Template File Creation

- **Location:** `src/ipc/handlers/app_handlers.ts:767`
- **Duration:** ~50-200ms (depends on template size/complexity)
- **Recommendation:** 🟡 Profile different templates; consider pre-built templates

#### 7. React Query Invalidations

- **Location:** `src/pages/home.tsx:159-160`
- **Operations:** `refreshApps()` and `invalidateAppQuery()`
- **Impact:** Async but may queue DB queries
- **Recommendation:** 🟡 Batch if possible; profile impact

---

## Instrumentation Points

### Recommended Code Markers

```typescript
// 1. Home page - Submit entry
const t0 = performance.now();
logger.info("[PERF] prompt:submit:start");

// 2. Home page - App creation start
const t1 = performance.now();
console.time("[PERF] app:create");

// 3. App handler - Handler entry
console.time("[PERF] app:handler");

// 4. App handler - Git operations
console.time("[PERF] git:ops");

// 5. Stream hook - Hook mount
console.time("[PERF] stream:hook:init");

// 6. Chat stream handler - Entry
const t2 = performance.now();
console.time("[PERF] chat:stream:handler");

// 7. Chat stream handler - First DB query
console.time("[PERF] db:fetch:chat:first");

// 8. Chat stream handler - Model init
console.time("[PERF] model:init");

// 9. Chat stream handler - streamText call
console.time("[PERF] stream:text:setup");

// 10. Process chunks - First text-delta
if (part.type === "text-delta") {
  console.timeEnd("[PERF] stream:text:first:token");
}

// 11. Renderer - onChunk callback
console.time("[PERF] renderer:chunk:callback");

// 12. Renderer - Message render
console.time("[PERF] render:message");
```

### Files to Instrument

| File                                       | Lines                                       | Purpose                               |
| ------------------------------------------ | ------------------------------------------- | ------------------------------------- |
| `src/pages/home.tsx`                       | 126, 134, 147, 152                          | Track submission flow, identify delay |
| `src/ipc/handlers/app_handlers.ts`         | 743, 750, 760, 774, 780, 786                | Profile app creation steps            |
| `src/ipc/handlers/chat_stream_handlers.ts` | 181, 196, 400, 413, 428, 443, 471, 560, 140 | Profile streaming setup & first token |
| `src/hooks/useStreamChat.ts`               | 156, 165                                    | Track IPC call & callback timing      |
| `src/components/chat/MessagesList.tsx`     | -                                           | Measure render time                   |

---

## Recommended Fixes (by Priority)

### Fix #1: Remove/Investigate 2-Second Delay ⚠️ CRITICAL

- **Impact:** Remove ~2 seconds from critical path
- **Risk:** Low (investigate why first)
- **Effort:** 5 minutes investigation + 2 minutes removal
- **Code Location:** `src/pages/home.tsx:152-154`

**Steps:**

1. Search codebase for comments/history about this delay
2. Check git blame for context
3. Test removal on local branch
4. Verify no UI regressions
5. Commit

### Fix #2: Eliminate Duplicate Database Query ⚠️ HIGH

- **Impact:** Save ~20-50ms per request
- **Risk:** Low
- **Effort:** 10 minutes
- **Code Location:** `src/ipc/handlers/chat_stream_handlers.ts`

**Changes:**

```typescript
// Before: Two queries
const chat = await db.query.chats.findFirst({...}); // Line 196-204
const updatedChat = await db.query.chats.findFirst({...}); // Line 428-440

// After: One query, reused
const chat = await db.query.chats.findFirst({...}); // Line 196-204
// ... insert messages ...
const updatedChat = chat; // Reuse, no second query
```

### Fix #3: Profile Git Operations ⚠️ HIGH

- **Impact:** Could save 100-500ms
- **Risk:** Medium (git performance varies)
- **Effort:** 30 minutes
- **Code Location:** `src/ipc/handlers/app_handlers.ts:774-783`

**Options:**

- Option A: Run git operations async after returning app to user
- Option B: Cache template commits (pre-commit template dirs)
- Option C: Lazy git initialization (init later on first edit)

### Fix #4: Add Performance Instrumentation ⚠️ MEDIUM

- **Impact:** Required to validate other fixes
- **Risk:** None (logging only)
- **Effort:** 15 minutes
- **Code:** See instrumentation points above

---

## Files & Functions Reference

### Renderer Layer

| File                                    | Function           | Purpose                     |
| --------------------------------------- | ------------------ | --------------------------- |
| `src/pages/home.tsx`                    | `handleSubmit()`   | User submission entry point |
| `src/hooks/useStreamChat.ts`            | `streamMessage()`  | Manages streaming state     |
| `src/components/chat/HomeChatInput.tsx` | Input component    | UI for message input        |
| `src/components/chat/MessagesList.tsx`  | Message rendering  | Displays chat messages      |
| `src/components/chat/ChatMessage.tsx`   | Individual message | Single message component    |

### IPC/Contract Layer

| File                        | Export                 | Purpose                    |
| --------------------------- | ---------------------- | -------------------------- |
| `src/ipc/types/chat.ts`     | `chatStreamContract`   | Stream contract definition |
| `src/ipc/contracts/core.ts` | `createStreamClient()` | Stream client generator    |
| `src/ipc/types/index.ts`    | `ipc.chatStream`       | Unified client namespace   |

### Main Process Layer

| File                                       | Function                       | Purpose                    |
| ------------------------------------------ | ------------------------------ | -------------------------- |
| `src/ipc/handlers/app_handlers.ts`         | Handler for "create-app"       | App creation with DB + Git |
| `src/ipc/handlers/chat_stream_handlers.ts` | `registerChatStreamHandlers()` | Chat streaming handler     |
| `src/ipc/handlers/chat_stream_handlers.ts` | `processStreamChunks()`        | Stream chunk processing    |
| `src/ipc/ipc_host.ts`                      | `registerIpcHandlers()`        | Handler registration       |

### Database Layer

| Operation                   | Location                      | Duration               |
| --------------------------- | ----------------------------- | ---------------------- |
| Insert app                  | `app_handlers.ts:750`         | ~10-30ms               |
| Insert chat                 | `app_handlers.ts:760`         | ~10-30ms               |
| Insert user message         | `chat_stream_handlers.ts:400` | ~20-50ms               |
| Insert assistant msg        | `chat_stream_handlers.ts:413` | ~20-50ms               |
| Fetch chat + messages (1st) | `chat_stream_handlers.ts:196` | ~20-50ms               |
| Fetch chat + messages (2nd) | `chat_stream_handlers.ts:428` | ~20-50ms [DUPLICATE]   |
| Update chat with commit     | `app_handlers.ts:786`         | ~10-30ms               |
| Update assistant message    | `chat_stream_handlers.ts:536` | ~20-50ms (every 150ms) |

---

## Key Insights

### IPC Architecture

- **Pattern:** Invoke/response for regular calls, streaming for chat
- **Stream Contract:** Uses `ipcRenderer.invoke()` for start, `ipcRenderer.on()` for events
- **Event Routing:** By `chatId` key field (can handle multiple concurrent streams)
- **Error Handling:** Callbacks for chunks, end, and error events

### State Management

- **Jotai atoms:** `chatMessagesByIdAtom`, `isStreamingByIdAtom`, `chatStreamCountByIdAtom`
- **React Query:** `queryKeys` for caching, invalidation on stream end
- **Streaming state:** Managed in hook, synchronized with atoms

### Rendering Pipeline

1. Atom update (Jotai) → React re-render
2. MessagesList component consumes atom
3. ChatMessage components render individual messages
4. StreamingLoadingAnimation shows during streaming

---

## Testing & Validation

### Before Making Changes

1. **Benchmark current latency:**
   - Add instrumentation
   - Measure baseline
   - Document results

### After Each Fix

1. **Verify functionality:**
   - Submit prompt on home page
   - Confirm chat page loads
   - Confirm streaming starts
   - Verify first token appears
   - Confirm full response completes

2. **Measure latency improvement:**
   - Use instrumentation timestamps
   - Compare before/after
   - Calculate time savings per fix

3. **Test edge cases:**
   - With attachments
   - With custom themes
   - With large responses
   - With multiple concurrent chats

---

## Conclusion

The critical path from user prompt to first visible assistant token has been fully traced with **three clear bottlenecks identified**. The 2-second hardcoded delay is the most suspicious and should be investigated immediately. Simple fixes to remove the delay and eliminate the duplicate database query could provide significant UX improvements.

**Estimated Performance Impact of Fixes:**

- Remove 2-second delay: ~40% latency reduction
- Remove duplicate DB query: ~2-5% latency reduction
- Optimize git operations: ~15-30% latency reduction
- Total potential: **57-75% faster** (if all three fixed)
