import { ipcMain } from "electron";
import { v4 as uuidv4 } from "uuid";
import { chatContracts } from "../types/chat";
import { createTypedHandler } from "./base";

import * as crypto from "node:crypto";
import fs from "node:fs";
import { readFile, unlink, writeFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { findNativeAgent, getDefaultAgent } from "@/agent/runtime/agent_config";
import {
  AgentRuntime,
  type AgentRuntimeParams,
} from "@/agent/runtime/agent_runtime";
import { createPrimaryRunContext } from "@/agent/runtime/run_context";
import { requestNativeToolConsent } from "@/agent/runtime/consent";
import { waitForAgentQuestion } from "@/agent/runtime/question";
import { assembleSystemPrompt } from "@/agent/runtime/system_prompt";
import { createDefaultRegistry } from "@/agent/runtime/tool_registry";
import {
  initializeOmoRuntime,
  cleanupOmoRuntime,
  type OmoRuntimeContext,
} from "@/agent/runtime/omo_initializer";
import {
  getAgentDefinition,
  getAgentDescriptors,
  buildSisyphusPrompt,
} from "@/agent/runtime/agents";
import { readPromptFile as readOmoPromptFile } from "@/agent/runtime/agents/omo_prompt_reader";
import type { StreamCallbacks, ToolContext } from "@/agent/runtime/types";
import type { ChatResponseEnd, ChatStreamParams } from "@/ipc/types";
import { and, eq, isNull } from "drizzle-orm";
import log from "electron-log";
import { db } from "../../db";
import { agentRuns, apps, chats, messages } from "../../db/schema";
import { checkCreditsForModel, reportTokenUsage } from "../../main/entitlement";
import { readSettings } from "../../main/settings";
import { getAnyonAppPath } from "../../paths/paths";
import { getSupabaseAvailableSystemPrompt } from "../../prompts/supabase_prompt";
import {
  ANYON_MCP_TOOLS_PROMPT,
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
import { inArray } from "drizzle-orm";
import { prompts as promptsTable } from "../../db/schema";
import { FileUploadsState } from "../utils/file_uploads_state";
import {
  getCurrentCommitHash,
  getGitUncommittedFiles,
  gitAddAll,
  gitCommit,
} from "../utils/git_utils";
import { replacePromptReference } from "../utils/replacePromptReference";
import { safeSend } from "../utils/safe_sender";
import { parsePlanFile, validatePlanId } from "./planUtils";

const logger = log.scope("chat_stream_handlers");

// Track active streams for cancellation
const activeStreams = new Map<number, AbortController>();
const activeRuntimes = new Map<number, AgentRuntime>();

// OMO runtime contexts per chat session
export const activeOmoContexts = new Map<number, OmoRuntimeContext>();

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

// Ensure the temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
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
        // Inline referenced prompt contents for mentions like @prompt:<id>
        try {
          const matches = Array.from(userPrompt.matchAll(/@prompt:(\d+)/g));
          if (matches.length > 0) {
            const ids = Array.from(new Set(matches.map((m) => Number(m[1]))));
            const referenced = await db
              .select()
              .from(promptsTable)
              .where(inArray(promptsTable.id, ids));
            if (referenced.length > 0) {
              const promptsMap: Record<number, string> = {};
              for (const p of referenced) {
                promptsMap[p.id] = p.content;
              }
              userPrompt = replacePromptReference(userPrompt, promptsMap);
            }
          }
        } catch (e) {
          logger.error("Failed to inline referenced prompts:", e);
        }

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
            content: implementPlanDisplayPrompt ?? userPrompt,
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

          const { modelClient, isNativeAgentMode } = modelClientResult;

          if (isNativeAgentMode) {
            const agentConfig =
              findNativeAgent(settings.selectedAgent ?? "") ??
              getDefaultAgent();

            const aiRules = await readAiRules(chatAppPath);
            const themePrompt = await getFullSystemPrompt(
              chat.app?.designSystemId ?? null,
              chat.app?.themeId ?? null,
            );

            let supabaseContext: string | undefined;

            if (chat.app?.supabaseProjectId && isSupabaseConnected(settings)) {
              const [supabaseClientCode, supabaseCtx] = await Promise.all([
                getSupabaseClientCode({
                  projectId: chat.app.supabaseProjectId,
                  organizationSlug: chat.app.supabaseOrganizationSlug ?? null,
                }),
                getSupabaseContext({
                  supabaseProjectId: chat.app.supabaseProjectId,
                  organizationSlug: chat.app.supabaseOrganizationSlug ?? null,
                }),
              ]);
              supabaseContext = `${getSupabaseAvailableSystemPrompt(supabaseClientCode)}\n\n${supabaseCtx}`;
            }

            const systemPrompt = assembleSystemPrompt({
              modelProvider: settings.selectedModel.provider,
              modelId: settings.selectedModel.name,
              agentConfig,
              appPath: chatAppPath,
              customRules: aiRules ?? undefined,
              themePrompt: themePrompt ?? undefined,
              supabaseContext,
              anyonMcpPrompt: ANYON_MCP_TOOLS_PROMPT,
            });

            const askConsent: ToolContext["askConsent"] = async (params) => {
              const decision = await requestNativeToolConsent({
                toolName: params.toolName,
                riskLevel: params.riskLevel,
                inputPreview: params.inputPreview,
                chatId: req.chatId,
                event,
              });
              return decision === "accept-once" || decision === "accept-always";
            };

            const askQuestion: ToolContext["askQuestion"] = async (params) => {
              const requestId = crypto.randomUUID();
              safeSend(event.sender, "agent:question-request", {
                requestId,
                chatId: req.chatId,
                questions: params.questions,
              });

              const answers = await waitForAgentQuestion(requestId);
              if (!answers) {
                return [];
              }

              return params.questions.map((question, index) => ({
                question: question.question,
                selectedOptions: answers[index] ?? [],
              }));
            };

            const registry = createDefaultRegistry();
            const toolContext: ToolContext = {
              sessionId: chat.id,
              chatId: req.chatId,
              appPath: chatAppPath,
              abort: abortController.signal,
              askConsent,
              askQuestion,
              event,
            };

            // --- Phase 0.7: Create RunContext + persist agentRuns record ---
            const runContext = createPrimaryRunContext({
              chatId: req.chatId,
              agentName: agentConfig.name,
            });
            await db.insert(agentRuns).values({
              runId: runContext.runId,
              rootChatId: runContext.rootChatId,
              chatId: runContext.chatId,
              parentRunId: runContext.parentRunId ?? null,
              agentName: runContext.agentName,
              agentKind: runContext.agentKind,
              status: "running",
            });

            const [maxOutputTokens, temperature] = await Promise.all([
              getMaxTokens(settings.selectedModel),
              getTemperature(settings.selectedModel),
            ]);

            let lastDbSaveAt = 0;
            const callbacks: StreamCallbacks = {
              onTextDelta: (_text) => {},
              onReasoningDelta: (_text) => {},
              onToolCall: (_toolName, _toolCallId, _input) => {},
              onToolResult: (_toolName, _toolCallId, _output) => {},
              onToolError: (_toolName, _toolCallId, _error) => {},
              onStepFinish: (_usage) => {
                const runtime = activeRuntimes.get(req.chatId);
                if (!runtime) {
                  return;
                }

                const responseText = runtime.getAccumulatedResponseText();
                partialResponses.set(req.chatId, responseText);

                const now = Date.now();
                if (now - lastDbSaveAt >= 150) {
                  const currentMessages = [...streamMessages];
                  if (
                    currentMessages.length > 0 &&
                    currentMessages[currentMessages.length - 1].role ===
                      "assistant"
                  ) {
                    currentMessages[currentMessages.length - 1].content =
                      responseText;
                  }
                  safeSend(event.sender, "chat:response:chunk", {
                    chatId: req.chatId,
                    messages: currentMessages,
                  });
                  lastDbSaveAt = now;
                }
              },
              onFinish: (_totalUsage) => {},
              onError: (error) => {
                const message = error.message || String(error);
                logger.error(`Native agent stream error: ${message}`);
                safeSend(event.sender, "chat:response:error", {
                  chatId: req.chatId,
                  error: `${AI_STREAMING_ERROR_MESSAGE_PREFIX}${message}`,
                });
              },
            };

            // --- Phase 9.5: Initialize OMO runtime (hooks, skills, commands, agents) ---
            let omoCtx: OmoRuntimeContext | undefined;
            try {
              omoCtx = await initializeOmoRuntime({
                projectDir: chatAppPath,
                chatId: req.chatId,
                sessionId: chat.id,
              });
              activeOmoContexts.set(req.chatId, omoCtx);
            } catch (omoErr) {
              logger.warn(
                "OMO runtime init failed (continuing without OMO features):",
                omoErr,
              );
            }

            // --- Phase 9.6: Inject OMO agent system prompt ---
            if (omoCtx) {
              // Determine which OMO agent to use (default: sisyphus)
              const omoAgentDef = getAgentDefinition("sisyphus");
              if (omoAgentDef) {
                // 1. Load the agent's base prompt
                const basePrompt = readOmoPromptFile(
                  omoAgentDef.systemPromptFile,
                );
                if (basePrompt) {
                  systemPrompt.push(basePrompt);
                }

                // 2. Build dynamic context (skills, commands, agents)
                const dynamicPrompt = buildSisyphusPrompt({
                  skills: omoCtx.skillLoader.list(),
                  commands: omoCtx.commandRegistry.list(),
                  agents: getAgentDescriptors(),
                  variant: "orchestrator",
                  projectDir: chatAppPath,
                });
                if (dynamicPrompt) {
                  systemPrompt.push(dynamicPrompt);
                }

                logger.info(
                  `Injected OMO agent prompt: ${omoAgentDef.name} (${omoAgentDef.systemPromptFile})`,
                );
              }
            }

            const runtimeParams: AgentRuntimeParams = {
              chatId: req.chatId,
              assistantMessageId: placeholderAssistantMessage.id,
              sessionId: chat.id,
              appPath: chatAppPath,
              model: modelClient.model,
              systemPrompt,
              registry,
              toolContext,
              callbacks,
              agentConfig,
              maxOutputTokens: maxOutputTokens ?? undefined,
              temperature: temperature ?? undefined,
              runContext,
              hookRegistry: omoCtx?.hookRegistry,
              contextCollector: omoCtx?.contextCollector,
            };
            const runtime = new AgentRuntime(runtimeParams);

            activeRuntimes.set(req.chatId, runtime);

            let loopResult: string | undefined;
            try {
              loopResult = await runtime.loop();
              logger.log(
                `Native agent completed: ${loopResult} (chat ${req.chatId})`,
              );
              // Update agentRuns status on success
              void db
                .update(agentRuns)
                .set({
                  status: "completed",
                  endedAt: new Date(),
                })
                .where(eq(agentRuns.runId, runContext.runId))
                .catch((e) =>
                  logger.error("Failed to update agentRuns status", e),
                );
            } catch (runtimeError) {
              // Update agentRuns status on error/abort
              const finalStatus = abortController.signal.aborted
                ? "cancelled"
                : "error";
              void db
                .update(agentRuns)
                .set({
                  status: finalStatus,
                  endedAt: new Date(),
                  abortReason: String(runtimeError),
                })
                .where(eq(agentRuns.runId, runContext.runId))
                .catch((e) =>
                  logger.error("Failed to update agentRuns status", e),
                );
              if (!abortController.signal.aborted) {
                throw runtimeError;
              }
            } finally {
              activeRuntimes.delete(req.chatId);
              // Cleanup OMO runtime for this chat
              const omoToClean = activeOmoContexts.get(req.chatId);
              if (omoToClean) {
                activeOmoContexts.delete(req.chatId);
                void cleanupOmoRuntime(omoToClean).catch((e) =>
                  logger.warn("OMO cleanup failed:", e),
                );
              }
            }

            const tokens = runtime.getCumulativeTokens();
            const totalTokens = tokens.input + tokens.output;
            if (totalTokens > 0) {
              void db
                .update(messages)
                .set({ maxTokensUsed: totalTokens })
                .where(eq(messages.id, placeholderAssistantMessage.id))
                .catch((error) => {
                  logger.error("Failed to save token usage", error);
                });
              void reportTokenUsage(totalTokens, settings.selectedModel.name);
            }

            fullResponse = runtime.getAccumulatedResponseText();

            if (!abortController.signal.aborted && fullResponse) {
              const chatTitle = fullResponse.match(
                /<anyon-chat-summary>(.*?)<\/anyon-chat-summary>/,
              );
              const chatSummary = chatTitle?.[1];
              if (chatSummary) {
                await db
                  .update(chats)
                  .set({ title: chatSummary })
                  .where(and(eq(chats.id, req.chatId), isNull(chats.title)));
              }

              const appNameMatch = fullResponse.match(
                /<anyon-app-name>(.*?)<\/anyon-app-name>/,
              );
              const appDisplayName = appNameMatch?.[1];
              if (appDisplayName && !chat.app.displayName) {
                await db
                  .update(apps)
                  .set({ displayName: appDisplayName })
                  .where(eq(apps.id, chat.app.id));
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

              // Send final chunk with complete response text to renderer
              const finalMessages = [...streamMessages];
              if (
                finalMessages.length > 0 &&
                finalMessages[finalMessages.length - 1].role === "assistant"
              ) {
                finalMessages[finalMessages.length - 1].content = fullResponse;
              }
              safeSend(event.sender, "chat:response:chunk", {
                chatId: req.chatId,
                messages: finalMessages,
              });

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
    const runtime = activeRuntimes.get(chatId);
    if (runtime) {
      runtime.abort();
      activeRuntimes.delete(chatId);
    }

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
