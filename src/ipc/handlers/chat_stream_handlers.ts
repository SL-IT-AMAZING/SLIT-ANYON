import {
  type ImagePart,
  type ModelMessage,
  type TextPart,
  type TextStreamPart,
  type ToolSet,
  streamText,
} from "ai";
import { ipcMain } from "electron";
import { v4 as uuidv4 } from "uuid";
import { chatContracts } from "../types/chat";
import { createTypedHandler } from "./base";

import * as crypto from "node:crypto";
import fs from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { AgentTodo, ChatResponseEnd, ChatStreamParams } from "@/ipc/types";
import { and, eq, isNull } from "drizzle-orm";
import log from "electron-log";
import { db } from "../../db";
import { apps, chats, messages } from "../../db/schema";
import { checkCreditsForModel, reportTokenUsage } from "../../main/entitlement";
import { readSettings } from "../../main/settings";
import { getAnyonAppPath } from "../../paths/paths";
import { getSupabaseAvailableSystemPrompt } from "../../prompts/supabase_prompt";
import {
  ANYON_MCP_TOOLS_PROMPT,
  constructSystemPrompt,
  readAiRules,
} from "../../prompts/system_prompt";
import {
  getSupabaseClientCode,
  getSupabaseContext,
} from "../../supabase_admin/supabase_context";
import { getModelClient } from "../utils/get_model_client";
import { getFullSystemPrompt } from "../utils/theme_utils";
import { getMaxTokens, getTemperature } from "../utils/token_utils";
import { streamTestResponse } from "./testing_chat_handlers";
import { getTestResponse } from "./testing_chat_handlers";

import { isSupabaseConnected } from "@/lib/schemas";
import { AI_STREAMING_ERROR_MESSAGE_PREFIX } from "@/shared/texts";
import { sanitizeVisibleOutput } from "../../../shared/sanitizeVisibleOutput";
import { getAnyonWritePlanTags } from "../utils/anyon_tag_parser";
import { cleanFullResponse } from "../utils/cleanFullResponse";
import { FileUploadsState } from "../utils/file_uploads_state";
import {
  getCurrentCommitHash,
  getGitUncommittedFiles,
  gitAddAll,
  gitCommit,
} from "../utils/git_utils";
import { openCodeServer } from "../utils/opencode_server";
import { safeSend } from "../utils/safe_sender";
import { writeWavePlanFile } from "./builder_wave_plan";
import { parsePlanFile, validatePlanId } from "./planUtils";
import { writePlanningArtifactFile } from "./planning_artifact_storage";

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

const logger = log.scope("chat_stream_handlers");

// Track active streams for cancellation
const activeStreams = new Map<number, AbortController>();

// Track partial responses for cancelled streams
const partialResponses = new Map<number, string>();

// Directory for storing temporary files
const TEMP_DIR = path.join(os.tmpdir(), "anyon-attachments");

// Common helper functions
const TEXT_FILE_EXTENSIONS = [
  ".md",
  ".txt",
  ".json",
  ".csv",
  ".js",
  ".ts",
  ".html",
  ".css",
];

async function isTextFile(filePath: string): Promise<boolean> {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_FILE_EXTENSIONS.includes(ext);
}

// Use escapeXmlAttr from shared/xmlEscape for XML escaping

// Safely parse an MCP tool key that combines server and tool names.
// We split on the LAST occurrence of "__" to avoid ambiguity if either
// side contains "__" as part of its sanitized name.
function parseMcpToolKey(toolKey: string): {
  serverName: string;
  toolName: string;
} {
  const separator = "__";
  const lastIndex = toolKey.lastIndexOf(separator);
  if (lastIndex === -1) {
    return { serverName: "", toolName: toolKey };
  }
  const serverName = toolKey.slice(0, lastIndex);
  const toolName = toolKey.slice(lastIndex + separator.length);
  return { serverName, toolName };
}

type TodoLike = {
  id?: unknown;
  content?: unknown;
  status?: unknown;
};

function isTodoStatus(
  status: unknown,
): status is "pending" | "in_progress" | "completed" {
  return (
    status === "pending" || status === "in_progress" || status === "completed"
  );
}

function normalizeTodos(value: unknown): AgentTodo[] | null {
  if (!Array.isArray(value)) return null;

  const result: AgentTodo[] = [];
  for (const [index, item] of value.entries()) {
    const todo = item as TodoLike;
    if (typeof todo.content !== "string" || todo.content.trim().length === 0) {
      continue;
    }
    result.push({
      id:
        typeof todo.id === "string" && todo.id.length > 0
          ? todo.id
          : `todo-${index}-${todo.content}`,
      content: todo.content,
      status: isTodoStatus(todo.status) ? todo.status : "pending",
    });
  }

  return result;
}

function parseJsonCandidate(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {}
  }

  const firstBrace = trimmed.indexOf("{");
  const firstBracket = trimmed.indexOf("[");
  const starts = [firstBrace, firstBracket].filter((x) => x >= 0);
  if (starts.length === 0) return null;

  const start = Math.min(...starts);
  const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (end <= start) return null;

  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}

function extractTodosFromOpenCodeToolContent(
  content: string,
): AgentTodo[] | null {
  const parsed = parseJsonCandidate(content);
  if (!parsed) return null;

  const direct = normalizeTodos(parsed);
  if (direct) return direct;

  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  return (
    normalizeTodos(record.todos) ??
    normalizeTodos(
      (record.input as Record<string, unknown> | undefined)?.todos,
    ) ??
    normalizeTodos(
      (record.metadata as Record<string, unknown> | undefined)?.todos,
    )
  );
}

function extractLatestTodosFromAssistantMessage(
  content: string,
): AgentTodo[] | null {
  const regex = /<opencode-tool\s+([^>]*)>([\s\S]*?)<\/opencode-tool>/gi;
  const matches: Array<{ attrs: string; body: string }> = [];
  let match: RegExpExecArray | null;
  for (;;) {
    match = regex.exec(content);
    if (match === null) break;
    matches.push({ attrs: match[1] ?? "", body: match[2] ?? "" });
  }

  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const attrs = matches[index].attrs;
    const toolName = attrs.match(/\bname="([^"]+)"/i)?.[1]?.toLowerCase();
    if (toolName !== "todowrite" && toolName !== "todoread") {
      continue;
    }
    const todos = extractTodosFromOpenCodeToolContent(matches[index].body);
    if (todos) return todos;
  }

  return null;
}

// Ensure the temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper function to process stream chunks
async function processStreamChunks({
  fullStream,
  fullResponse,
  abortController,
  chatId,
  processResponseChunkUpdate,
}: {
  fullStream: AsyncIterableStream<TextStreamPart<ToolSet>>;
  fullResponse: string;
  abortController: AbortController;
  chatId: number;
  processResponseChunkUpdate: (params: {
    fullResponse: string;
  }) => Promise<string>;
}): Promise<{ fullResponse: string; incrementalResponse: string }> {
  let incrementalResponse = "";
  let inThinkingBlock = false;

  for await (const part of fullStream) {
    let chunk = "";
    if (
      inThinkingBlock &&
      !["reasoning-delta", "reasoning-end", "reasoning-start"].includes(
        part.type,
      )
    ) {
      chunk = "</think>";
      inThinkingBlock = false;
    }
    if (part.type === "text-delta") {
      chunk += part.text;
    } else if (part.type === "reasoning-delta") {
      if (!inThinkingBlock) {
        chunk = "<think>";
        inThinkingBlock = true;
      }

      chunk += escapeAnyonTags(part.text);
    } else if (part.type === "tool-call") {
      const { serverName, toolName } = parseMcpToolKey(part.toolName);
      const content = escapeAnyonTags(JSON.stringify(part.input));
      chunk = `<anyon-mcp-tool-call server="${serverName}" tool="${toolName}">\n${content}\n</anyon-mcp-tool-call>\n`;
    } else if (part.type === "tool-result") {
      const { serverName, toolName } = parseMcpToolKey(part.toolName);
      const content = escapeAnyonTags(part.output);
      chunk = `<anyon-mcp-tool-result server="${serverName}" tool="${toolName}">\n${content}\n</anyon-mcp-tool-result>\n`;
    }

    if (!chunk) {
      continue;
    }

    fullResponse += chunk;
    incrementalResponse += chunk;
    fullResponse = cleanFullResponse(fullResponse);
    fullResponse = sanitizeVisibleOutput(fullResponse);
    fullResponse = await processResponseChunkUpdate({
      fullResponse,
    });

    // If the stream was aborted, exit early
    if (abortController.signal.aborted) {
      logger.log(`Stream for chat ${chatId} was aborted`);
      break;
    }
  }

  return { fullResponse, incrementalResponse };
}

export function registerChatStreamHandlers() {
  ipcMain.handle("chat:stream", async (event, req: ChatStreamParams) => {
    void (async () => {
      const attachmentPaths: string[] = [];
      try {
        const fileUploadsState = FileUploadsState.getInstance();
        // Clear any stale state from previous requests for this chat
        fileUploadsState.clear(req.chatId);
        let anyonRequestId: string | undefined;
        // Create an AbortController for this stream
        const abortController = new AbortController();
        activeStreams.set(req.chatId, abortController);

        // Notify renderer that stream is starting
        safeSend(event.sender, "chat:stream:start", { chatId: req.chatId });

        // Get the chat to check for existing messages
        const chat = await db.query.chats.findFirst({
          where: eq(chats.id, req.chatId),
          with: {
            messages: {
              orderBy: (messages, { asc }) => [asc(messages.createdAt)],
            },
            app: true, // Include app information
          },
        });

        if (!chat) {
          throw new Error(`Chat not found: ${req.chatId}`);
        }

        const streamBaseMessages = [...chat.messages];

        // Handle redo option: remove the most recent messages if needed
        if (req.redo) {
          // Find the most recent user message
          let lastUserMessageIndex = streamBaseMessages.length - 1;
          while (
            lastUserMessageIndex >= 0 &&
            streamBaseMessages[lastUserMessageIndex].role !== "user"
          ) {
            lastUserMessageIndex--;
          }

          if (lastUserMessageIndex >= 0) {
            // Delete the user message
            await db
              .delete(messages)
              .where(
                eq(messages.id, streamBaseMessages[lastUserMessageIndex].id),
              );
            streamBaseMessages.splice(lastUserMessageIndex, 1);

            // If there's an assistant message after the user message, delete it too
            if (
              lastUserMessageIndex < streamBaseMessages.length &&
              streamBaseMessages[lastUserMessageIndex].role === "assistant"
            ) {
              await db
                .delete(messages)
                .where(
                  eq(messages.id, streamBaseMessages[lastUserMessageIndex].id),
                );
              streamBaseMessages.splice(lastUserMessageIndex, 1);
            }
          }
        }

        // Process attachments if any
        let attachmentInfo = "";
        const imageAttachments: { data: string; mediaType: string }[] = [];

        if (req.attachments && req.attachments.length > 0) {
          attachmentInfo = "\n\nAttachments:\n";

          for (const [index, attachment] of req.attachments.entries()) {
            // Generate a unique filename
            const hash = crypto
              .createHash("md5")
              .update(attachment.name + Date.now())
              .digest("hex");
            const fileExtension = path.extname(attachment.name);
            const filename = `${hash}${fileExtension}`;
            const filePath = path.join(TEMP_DIR, filename);

            // Extract the base64 data (remove the data:mime/type;base64, prefix)
            const base64Data = attachment.data.split(";base64,").pop() || "";

            await writeFile(filePath, Buffer.from(base64Data, "base64"));
            attachmentPaths.push(filePath);

            if (attachment.attachmentType === "upload-to-codebase") {
              // For upload-to-codebase, create a unique file ID and store the mapping
              const fileId = `ANYON_ATTACHMENT_${index}`;

              fileUploadsState.addFileUpload(
                { chatId: req.chatId, fileId },
                {
                  filePath,
                  originalName: attachment.name,
                },
              );

              // Add instruction for AI to use anyon-write tag
              attachmentInfo += `\n\nFile to upload to codebase: ${attachment.name} (file id: ${fileId})\n`;
            } else {
              // For chat-context, use the existing logic
              attachmentInfo += `- ${attachment.name} (${attachment.type})\n`;
              // Collect image data for multimodal AI messages
              if (attachment.type.startsWith("image/")) {
                imageAttachments.push({
                  data: attachment.data,
                  mediaType: attachment.type,
                });
              }
              // If it's a text-based file, try to include the content
              if (await isTextFile(filePath)) {
                try {
                  attachmentInfo += `<anyon-text-attachment filename="${attachment.name}" type="${attachment.type}" path="${filePath}">
                </anyon-text-attachment>
                \n\n`;
                } catch (err) {
                  logger.error(`Error reading file content: ${err}`);
                }
              }
            }
          }
        }

        // Add user message to database with attachment info
        let userPrompt = req.prompt + (attachmentInfo ? attachmentInfo : "");

        // Expand /implement-plan= into full implementation prompt
        // Keep the original short form for display in the UI; the expanded
        // content is only injected into the AI message history.
        let implementPlanDisplayPrompt: string | undefined;
        const implementPlanMatch = userPrompt.match(/^\/implement-plan=(.+)$/);
        if (implementPlanMatch) {
          try {
            implementPlanDisplayPrompt = userPrompt;
            const planSlug = implementPlanMatch[1];
            validatePlanId(planSlug);
            const appPath = getAnyonAppPath(chat.app.path);
            const planFilePath = path.join(
              appPath,
              ".anyon",
              "plans",
              `${planSlug}.md`,
            );
            const raw = await fs.promises.readFile(planFilePath, "utf-8");
            const { meta, content } = parsePlanFile(raw);

            const planPath = `.anyon/plans/${planSlug}.md`;

            userPrompt = `Please implement the following plan:

## ${meta.title || "Implementation Plan"}

${content}

Start implementing this plan now. Follow the steps outlined and create/modify the necessary files.
You may update the plan at \`${planPath}\` to mark your progress.`;
          } catch (e) {
            implementPlanDisplayPrompt = undefined;
            logger.error("Failed to expand /implement-plan= prompt:", e);
          }
        }

        let implementArtifactDisplayPrompt: string | undefined;
        const implementArtifactMatch = userPrompt.match(
          /^\/(implement-brief|implement-spec)=(.+)$/,
        );
        if (implementArtifactMatch) {
          try {
            implementArtifactDisplayPrompt = userPrompt;
            const command = implementArtifactMatch[1];
            const artifactSlug = implementArtifactMatch[2];
            validatePlanId(artifactSlug);

            const appPath = getAnyonAppPath(chat.app.path);
            const directoryName =
              command === "implement-brief" ? "briefs" : "specs";
            const artifactFilePath = path.join(
              appPath,
              ".anyon",
              directoryName,
              `${artifactSlug}.md`,
            );
            const rawArtifact = await fs.promises.readFile(artifactFilePath, "utf-8");
            const { meta: artifactMeta, content: artifactContent } =
              parsePlanFile(rawArtifact);

            const linkedChatId = artifactMeta.chatId;
            let internalSpecBlock = "";
            let internalSpecContent = "";
            if (linkedChatId) {
              const specsDir = path.join(appPath, ".anyon", "specs");
              try {
                const specFiles = (await fs.promises.readdir(specsDir))
                  .filter((file) => file.endsWith(".md"))
                  .filter((file) => file.startsWith(`chat-${linkedChatId}-`))
                  .sort();
                const latestSpec = specFiles.at(-1);
                if (latestSpec) {
                  const rawSpec = await fs.promises.readFile(
                    path.join(specsDir, latestSpec),
                    "utf-8",
                  );
                  const { content: specContent } = parsePlanFile(rawSpec);
                  internalSpecContent = specContent;
                  internalSpecBlock = `\n\n## Internal Build Spec\n\n${specContent}`;
                }
              } catch (e) {
                logger.warn("Failed to read linked internal build spec:", e);
              }
            }

            const wavePlan = await writeWavePlanFile({
              appPath,
              chatId: linkedChatId || req.chatId,
              title: artifactMeta.title || "Approved Builder Artifact",
              summary: artifactMeta.summary,
              artifactType:
                command === "implement-brief"
                  ? "founder_brief"
                  : "internal_build_spec",
              artifactId: artifactSlug,
              artifactContent,
              internalSpecContent,
            });

            userPrompt = `Please turn the approved planning artifacts into an executable first build wave and begin implementation.\n\n## Approved Artifact\n\n## ${artifactMeta.title || "Approved Builder Artifact"}\n\n${artifactContent}${internalSpecBlock}\n\nCreate or update a wave 1 execution plan in \`.anyon/plans/\` that is traceable to the documented user flows, then start implementing it now. Keep the founder-facing intent intact while using the execution plan to track progress.`;
            userPrompt = `Please implement the approved Builder wave plan now.\n\n## Approved Artifact\n\n## ${artifactMeta.title || "Approved Builder Artifact"}\n\n${artifactContent}${internalSpecBlock}\n\n## Execution Plan\n\nThe executable wave plan has been created at \`${wavePlan.relativePath}\`.\n\nFollow that wave plan as the implementation source of truth, keep it updated as you progress, and preserve the founder-approved user flows while building the first wave now.`;
          } catch (e) {
            implementArtifactDisplayPrompt = undefined;
            logger.error("Failed to expand Builder implementation prompt:", e);
          }
        }

        const componentsToProcess = req.selectedComponents || [];

        if (componentsToProcess.length > 0) {
          userPrompt += "\n\nSelected components:\n";

          for (const component of componentsToProcess) {
            let componentSnippet = "[component snippet not available]";
            try {
              const componentFileContent = await readFile(
                path.join(
                  getAnyonAppPath(chat.app.path),
                  component.relativePath,
                ),
                "utf8",
              );
              const lines = componentFileContent.split(/\r?\n/);
              const selectedIndex = component.lineNumber - 1;

              // Let's get one line before and three after for context.
              const startIndex = Math.max(0, selectedIndex - 1);
              const endIndex = Math.min(lines.length, selectedIndex + 4);

              const snippetLines = lines.slice(startIndex, endIndex);
              const selectedLineInSnippetIndex = selectedIndex - startIndex;

              if (snippetLines[selectedLineInSnippetIndex]) {
                snippetLines[selectedLineInSnippetIndex] =
                  `${snippetLines[selectedLineInSnippetIndex]} // <-- EDIT HERE`;
              }

              componentSnippet = snippetLines.join("\n");
            } catch (err) {
              logger.error(
                `Error reading selected component file content: ${err}`,
              );
            }

            userPrompt += `\n${componentsToProcess.length > 1 ? `${componentsToProcess.indexOf(component) + 1}. ` : ""}Component: ${component.name} (file: ${component.relativePath})

Snippet:
\`\`\`
${componentSnippet}
\`\`\`
`;
          }
        }

        const [insertedUserMessage] = await db
          .insert(messages)
          .values({
            chatId: req.chatId,
            role: "user",
            content:
              implementPlanDisplayPrompt ??
              implementArtifactDisplayPrompt ??
              userPrompt,
          })
          .returning();
        const settings = readSettings();
        const testResponse = getTestResponse(req.prompt);
        const chatAppPath = getAnyonAppPath(chat.app.path);

        const modelClientPromise = testResponse
          ? null
          : getModelClient(settings.selectedModel, settings, {
              chatId: req.chatId,
              appPath: chatAppPath,
            });
        const creditCheckPromise = testResponse
          ? null
          : checkCreditsForModel(settings.selectedModel.name);
        const sourceCommitHashPromise = getCurrentCommitHash({
          path: chatAppPath,
        });

        // Only ANYON Pro requests have request ids.
        if (settings.enableAnyonPro) {
          // Generate requestId early so it can be saved with the message
          anyonRequestId = uuidv4();
        }

        // Add a placeholder assistant message immediately
        const [placeholderAssistantMessage] = await db
          .insert(messages)
          .values({
            chatId: req.chatId,
            role: "assistant",
            content: "", // Start with empty content
            requestId: anyonRequestId,
            model: settings.selectedModel.name,
            sourceCommitHash: await sourceCommitHashPromise,
          })
          .returning();

        const streamMessages = [
          ...streamBaseMessages,
          insertedUserMessage,
          placeholderAssistantMessage,
        ];

        // Send the messages right away so that the loading state is shown for the message.
        safeSend(event.sender, "chat:response:chunk", {
          chatId: req.chatId,
          messages: streamMessages,
        });

        let fullResponse = "";

        if (testResponse) {
          // For test prompts, use the dedicated function
          fullResponse = await streamTestResponse(
            event,
            req.chatId,
            testResponse,
            abortController,
            { messages: streamMessages },
          );
        } else {
          // Normal AI processing for non-test prompts
          if (!creditCheckPromise || !modelClientPromise) {
            throw new Error("Failed to initialize streaming dependencies");
          }

          const [creditCheck, modelClientResult] = await Promise.all([
            creditCheckPromise,
            modelClientPromise,
          ]);

          if (!creditCheck.allowed) {
            throw new Error(creditCheck.reason ?? "Credits exhausted");
          }

          const { modelClient, isOpenCodeMode } = modelClientResult;

          // OpenCode mode: skip all Anyon-specific processing (codebase extraction,
          // history assembly, system prompt construction, post-response file processing).
          // OpenCode handles everything internally via its own tools and sessions.
          if (isOpenCodeMode) {
            const aiRules = await readAiRules(chatAppPath);
            const themePrompt = await getFullSystemPrompt(
              chat.app?.designSystemId ?? null,
              chat.app?.themeId ?? null,
            );
            let openCodeSystemPrompt = constructSystemPrompt({
              aiRules,
              themePrompt,
              selectedAgent: settings.selectedAgent,
              language: settings.language,
            });

            // Append Supabase context so OpenCode's AI knows about
            // the connected project, tables, and client code.
            if (chat.app?.supabaseProjectId && isSupabaseConnected(settings)) {
              const [supabaseClientCode, supabaseContext] = await Promise.all([
                getSupabaseClientCode({
                  projectId: chat.app.supabaseProjectId,
                  organizationSlug: chat.app.supabaseOrganizationSlug ?? null,
                }),
                getSupabaseContext({
                  supabaseProjectId: chat.app.supabaseProjectId,
                  organizationSlug: chat.app.supabaseOrganizationSlug ?? null,
                }),
              ]);
              openCodeSystemPrompt += `\n\n${getSupabaseAvailableSystemPrompt(supabaseClientCode)}\n\n${supabaseContext}`;
            }

            openCodeSystemPrompt += `\n\n${ANYON_MCP_TOOLS_PROMPT}`;
            openCodeSystemPrompt += `\n\nCurrent app context:\n- appId: ${chat.app.id}\n- appName: ${chat.app.name}`;

            if (settings.enableBooster) {
              userPrompt = `ulw\n\n${userPrompt}`;
            }

            // Send only the current user prompt — no codebase, no history.
            // OpenCode manages its own session history and reads files via tools.
            // Build user message content – include image parts when present
            // so the model receives them as multimodal vision input.
            const openCodeContent: string | (TextPart | ImagePart)[] =
              imageAttachments.length > 0
                ? [
                    { type: "text", text: userPrompt },
                    ...imageAttachments.map(
                      (img): ImagePart => ({
                        type: "image",
                        image: img.data,
                        mediaType: img.mediaType,
                      }),
                    ),
                  ]
                : userPrompt;

            const openCodeMessages: ModelMessage[] = [
              { role: "user", content: openCodeContent },
            ];

            let lastDbSaveAt = 0;
            let lastTodosSignature = "";
            const openCodeProcessChunkUpdate = async ({
              fullResponse,
            }: {
              fullResponse: string;
            }) => {
              partialResponses.set(req.chatId, fullResponse);
              const now = Date.now();
              if (now - lastDbSaveAt >= 150) {
                await db
                  .update(messages)
                  .set({ content: fullResponse })
                  .where(eq(messages.id, placeholderAssistantMessage.id));
                lastDbSaveAt = now;
              }

              const currentMessages = [...streamMessages];
              if (
                currentMessages.length > 0 &&
                currentMessages[currentMessages.length - 1].role === "assistant"
              ) {
                currentMessages[currentMessages.length - 1].content =
                  fullResponse;
              }

              safeSend(event.sender, "chat:response:chunk", {
                chatId: req.chatId,
                messages: currentMessages,
              });

              const todos =
                extractLatestTodosFromAssistantMessage(fullResponse);
              if (todos) {
                const signature = JSON.stringify(todos);
                if (signature !== lastTodosSignature) {
                  lastTodosSignature = signature;
                  safeSend(event.sender, "agent-tool:todos-update", {
                    chatId: req.chatId,
                    todos,
                  });
                }
              }

              return fullResponse;
            };

            try {
              const [maxOutputTokens, temperature] = await Promise.all([
                getMaxTokens(settings.selectedModel),
                getTemperature(settings.selectedModel),
              ]);

              const streamResult = streamText({
                maxOutputTokens,
                temperature,
                maxRetries: 2,
                model: modelClient.model,
                system: openCodeSystemPrompt,
                messages: openCodeMessages,
                abortSignal: abortController.signal,
                onFinish: (response) => {
                  const totalTokens = response.usage?.totalTokens;
                  if (typeof totalTokens === "number") {
                    void db
                      .update(messages)
                      .set({ maxTokensUsed: totalTokens })
                      .where(eq(messages.id, placeholderAssistantMessage.id))
                      .catch((error) => {
                        logger.error(
                          "Failed to save total tokens for assistant message",
                          error,
                        );
                      });
                    // Report token usage to Polar for credit metering
                    void reportTokenUsage(
                      totalTokens,
                      settings.selectedModel.name,
                    );
                  }
                },
                onError: (error: any) => {
                  const errorMessage = (error as any)?.error?.message;
                  const message = errorMessage || JSON.stringify(error);
                  logger.error(`Stream error: ${message}`);
                  event.sender.send("chat:response:error", {
                    chatId: req.chatId,
                    error: `${AI_STREAMING_ERROR_MESSAGE_PREFIX}${message}`,
                  });
                  activeStreams.delete(req.chatId);
                },
              });

              const result = await processStreamChunks({
                fullStream: streamResult.fullStream,
                fullResponse,
                abortController,
                chatId: req.chatId,
                processResponseChunkUpdate: openCodeProcessChunkUpdate,
              });
              fullResponse = result.fullResponse;
            } catch (streamError) {
              if (abortController.signal.aborted) {
                const partialResponse = partialResponses.get(req.chatId);
                if (partialResponse) {
                  await db
                    .update(messages)
                    .set({
                      content: `${partialResponse}\n\n[Response cancelled by user]`,
                    })
                    .where(eq(messages.id, placeholderAssistantMessage.id));
                  partialResponses.delete(req.chatId);
                }
                return req.chatId;
              }
              throw streamError;
            }

            if (!abortController.signal.aborted) {
              let chatSummary: string | undefined;
              let appDisplayName: string | undefined;

              if (fullResponse) {
                const chatTitle = fullResponse.match(
                  /<anyon-chat-summary>(.*?)<\/anyon-chat-summary>/,
                );
                chatSummary = chatTitle?.[1];
                if (chatSummary) {
                  await db
                    .update(chats)
                    .set({ title: chatSummary })
                    .where(and(eq(chats.id, req.chatId), isNull(chats.title)));
                }

                const appNameMatch = fullResponse.match(
                  /<anyon-app-name>(.*?)<\/anyon-app-name>/,
                );
                appDisplayName = appNameMatch?.[1];
                if (appDisplayName && !chat.app.displayName) {
                  await db
                    .update(apps)
                    .set({ displayName: appDisplayName })
                    .where(eq(apps.id, chat.app.id));
                }

                await db
                  .update(messages)
                  .set({ content: fullResponse })
                  .where(eq(messages.id, placeholderAssistantMessage.id));

                const writePlanTags = getAnyonWritePlanTags(fullResponse).filter(
                  (tag) => tag.complete !== "false",
                );

                for (const tag of writePlanTags) {
                  const artifactType = tag.artifactType ?? "founder_brief";

                  await writePlanningArtifactFile({
                    appPath: chatAppPath,
                    chatId: req.chatId,
                    artifactType,
                    title: tag.title,
                    summary: tag.summary,
                    content: tag.content,
                    metadata: {
                      status: "draft",
                      source: "builder-stream",
                    },
                  });

                  if (!tag.artifactType) {
                    await writePlanningArtifactFile({
                      appPath: chatAppPath,
                      chatId: req.chatId,
                      artifactType: "user_flow_spec",
                      title: `${tag.title} User Flows`,
                      summary: tag.summary,
                      content: tag.content,
                      metadata: {
                        status: "draft",
                        source: "builder-stream-derived",
                        sourceArtifactType: "founder_brief",
                      },
                    });

                    await writePlanningArtifactFile({
                      appPath: chatAppPath,
                      chatId: req.chatId,
                      artifactType: "internal_build_spec",
                      title: `${tag.title} Internal Build Spec`,
                      summary: tag.summary,
                      content: tag.content,
                      metadata: {
                        status: "draft",
                        source: "builder-stream-derived",
                        sourceArtifactType: "founder_brief",
                      },
                    });
                  }
                }

                try {
                  const uncommittedFiles = await getGitUncommittedFiles({
                    path: chatAppPath,
                  });
                  if (uncommittedFiles.length > 0) {
                    await gitAddAll({ path: chatAppPath });
                    const commitHash = await gitCommit({
                      path: chatAppPath,
                      message: `[anyon] ${chatSummary ?? "AI changes"} — ${uncommittedFiles.length} file(s)`,
                    });
                    await db
                      .update(messages)
                      .set({ commitHash })
                      .where(eq(messages.id, placeholderAssistantMessage.id));
                    logger.log(
                      `Git commit: ${commitHash} (${uncommittedFiles.length} files)`,
                    );
                  }
                } catch (gitError) {
                  logger.error("Git commit failed:", gitError);
                }
              }

              safeSend(event.sender, "chat:response:end", {
                chatId: req.chatId,
                updatedFiles: false,
                chatSummary,
                appDisplayName,
              } satisfies ChatResponseEnd);
            }

            return req.chatId;
          }

          return req.chatId;
        }

        return req.chatId;
      } catch (error) {
        logger.error("Error calling LLM:", error);
        safeSend(event.sender, "chat:response:error", {
          chatId: req.chatId,
          error: `Sorry, there was an error processing your request: ${error}`,
        });

        return "error";
      } finally {
        // Clean up the abort controller
        activeStreams.delete(req.chatId);

        // Notify renderer that stream has ended
        safeSend(event.sender, "chat:stream:end", { chatId: req.chatId });

        // Clean up any temporary files
        if (attachmentPaths.length > 0) {
          for (const filePath of attachmentPaths) {
            try {
              // We don't immediately delete files because they might be needed for reference
              // Instead, schedule them for deletion after some time
              setTimeout(
                async () => {
                  if (fs.existsSync(filePath)) {
                    await unlink(filePath);
                    logger.log(`Deleted temporary file: ${filePath}`);
                  }
                },
                30 * 60 * 1000,
              ); // Delete after 30 minutes
            } catch (error) {
              logger.error(`Error scheduling file deletion: ${error}`);
            }
          }
        }
      }
    })();

    return req.chatId;
  });

  // Handler to cancel an ongoing stream
  createTypedHandler(chatContracts.cancelStream, async (event, chatId) => {
    const abortController = activeStreams.get(chatId);

    if (abortController) {
      // Abort the stream
      abortController.abort();
      activeStreams.delete(chatId);
      logger.log(`Aborted stream for chat ${chatId}`);
    } else {
      logger.warn(`No active stream found for chat ${chatId}`);
    }

    // Send the end event to the renderer
    safeSend(event.sender, "chat:response:end", {
      chatId,
      updatedFiles: false,
    } satisfies ChatResponseEnd);

    // Also emit stream:end so cleanup listeners (e.g., pending agent consents) fire
    safeSend(event.sender, "chat:stream:end", { chatId });

    return true;
  });

  createTypedHandler(
    chatContracts.replyToQuestion,
    async (_event, { requestID, answers }) => {
      const serverInfo = await openCodeServer.ensureRunning();
      const credentials = Buffer.from(
        `opencode:${serverInfo.password}`,
      ).toString("base64");
      const response = await fetch(
        `${serverInfo.url}/question/${requestID}/reply`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answers }),
        },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to reply to question: ${response.status} ${response.statusText}`,
        );
      }
      return true;
    },
  );
}

export function formatMessagesForSummary(
  messages: { role: string; content: string | undefined }[],
) {
  if (messages.length <= 8) {
    // If we have 8 or fewer messages, include all of them
    return messages
      .map((m) => `<message role="${m.role}">${m.content}</message>`)
      .join("\n");
  }

  // Take first 2 messages and last 6 messages
  const firstMessages = messages.slice(0, 2);
  const lastMessages = messages.slice(-6);

  // Combine them with an indicator of skipped messages
  const combinedMessages = [
    ...firstMessages,
    {
      role: "system",
      content: `[... ${messages.length - 8} messages omitted ...]`,
    },
    ...lastMessages,
  ];

  return combinedMessages
    .map((m) => `<message role="${m.role}">${m.content}</message>`)
    .join("\n");
}

export function removeProblemReportTags(text: string): string {
  const problemReportRegex =
    /<anyon-problem-report[^>]*>[\s\S]*?<\/anyon-problem-report>/g;
  return text.replace(problemReportRegex, "").trim();
}

export function removeAnyonTags(text: string): string {
  const anyonRegex = /<anyon-[^>]*>[\s\S]*?<\/anyon-[^>]*>/g;
  return text.replace(anyonRegex, "").trim();
}

export function hasUnclosedAnyonWrite(text: string): boolean {
  // Find the last opening anyon-write tag
  const openRegex = /<anyon-write[^>]*>/g;
  let lastOpenIndex = -1;
  let match: RegExpExecArray | null = openRegex.exec(text);

  while (match !== null) {
    lastOpenIndex = match.index;
    match = openRegex.exec(text);
  }

  // If no opening tag found, there's nothing unclosed
  if (lastOpenIndex === -1) {
    return false;
  }

  // Look for a closing tag after the last opening tag
  const textAfterLastOpen = text.substring(lastOpenIndex);
  const hasClosingTag = /<\/anyon-write>/.test(textAfterLastOpen);

  return !hasClosingTag;
}

function escapeAnyonTags(text: string): string {
  // Escape anyon tags in reasoning content
  // We are replacing the opening tag with a look-alike character
  // to avoid issues where thinking content includes anyon tags
  // and are mishandled by:
  // 1. FE markdown parser
  // 2. Main process response processor
  return text.replace(/<anyon/g, "＜anyon").replace(/<\/anyon/g, "＜/anyon");
}
