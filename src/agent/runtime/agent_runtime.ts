import type { LanguageModel, ModelMessage } from "ai";
import { streamText } from "ai";
import { eq } from "drizzle-orm";
import log from "electron-log";

import { db } from "@/db";
import { messages as messagesTable } from "@/db/schema";
import { getAiMessagesJsonIfWithinLimit } from "@/ipc/utils/ai_messages_utils";

import { applyContextLimit, loadChatMessages } from "./message_converter";
import { StreamBridge } from "./stream_bridge";
import { readPromptFile } from "./system_prompt";
import type { ToolRegistry } from "./tool_registry";
import type {
  AgentConfig,
  LoopResult,
  StreamCallbacks,
  ToolContext,
} from "./types";

const logger = log.scope("agent-runtime");

const DEFAULT_CONTEXT_WINDOW = 128_000;
const DEFAULT_MAX_STEPS = 100;

export interface AgentRuntimeParams {
  chatId: number;
  assistantMessageId: number;
  sessionId: number;
  appPath: string;
  model: LanguageModel;
  systemPrompt: string[];
  registry: ToolRegistry;
  toolContext: ToolContext;
  callbacks: StreamCallbacks;
  agentConfig: AgentConfig;
  contextWindowTokens?: number;
  maxOutputTokens?: number;
  temperature?: number;
}

export class AgentRuntime {
  private step = 0;
  private abortController: AbortController;
  private cumulativeTokens = { input: 0, output: 0 };
  private accumulatedResponseText = "";
  private allResponseMessages: ModelMessage[] = [];
  private activeBridge: StreamBridge | null = null;

  constructor(private params: AgentRuntimeParams) {
    this.abortController = new AbortController();
  }

  async loop(): Promise<LoopResult> {
    const maxSteps =
      this.params.agentConfig.steps > 0
        ? this.params.agentConfig.steps
        : DEFAULT_MAX_STEPS;
    const contextWindow =
      this.params.contextWindowTokens ?? DEFAULT_CONTEXT_WINDOW;

    while (true) {
      // 1. Load all session messages from DB
      const dbMessages = await loadChatMessages(this.params.chatId);

      // 2. Apply context window limits
      const messages = applyContextLimit(dbMessages, contextWindow);

      // 3. Increment step, check if last
      this.step++;
      const isLastStep = this.step >= maxSteps;

      logger.log(
        `Step ${this.step}/${maxSteps} for chat ${this.params.chatId}`,
      );

      // 4. Resolve tools (empty on last step to force text-only response)
      const tools = isLastStep
        ? {}
        : this.params.registry.resolveTools(
            this.params.agentConfig.tools,
            this.params.toolContext,
          );

      // 5. If last step, inject MAX_STEPS assistant prefill
      const finalMessages = isLastStep
        ? this.injectMaxStepsPrompt(messages)
        : messages;

      // 6. Call streamText
      const streamResult = streamText({
        model: this.params.model,
        system: this.params.systemPrompt.join("\n\n"),
        messages: finalMessages,
        tools,
        maxOutputTokens: this.params.maxOutputTokens,
        temperature: this.params.temperature,
        maxRetries: 2,
        abortSignal: this.abortController.signal,
      });

      // 7. Process stream via StreamBridge
      const nativeToolIds = new Set(
        this.params.registry.list().map((t) => t.id),
      );
      const bridge = new StreamBridge(this.params.callbacks, nativeToolIds);
      this.activeBridge = bridge;

      const bridgeResult = await bridge.processStream(
        streamResult.fullStream,
        this.abortController.signal,
      );
      this.activeBridge = null;

      // 8. Accumulate response text
      this.accumulatedResponseText += bridgeResult.fullResponseText;

      // 9. Get finish metadata (these are PromiseLike, resolve after stream consumed)
      const [finishReason, totalUsage, response] = await Promise.all([
        streamResult.finishReason,
        streamResult.totalUsage,
        streamResult.response,
      ]);

      // 10. Aggregate cumulative tokens
      this.cumulativeTokens.input += totalUsage.inputTokens ?? 0;
      this.cumulativeTokens.output += totalUsage.outputTokens ?? 0;

      // 11. Accumulate response messages for aiMessagesJson
      const stepMessages: ModelMessage[] = response.messages as ModelMessage[];
      this.allResponseMessages.push(...stepMessages);

      // 12. Save to DB: update assistant message content + aiMessagesJson
      await this.saveToDb();

      // 13. Check exit conditions
      if (this.abortController.signal.aborted) {
        logger.log(
          `Aborted at step ${this.step} for chat ${this.params.chatId}`,
        );
        return "aborted";
      }

      if (finishReason !== "tool-calls") {
        const result: LoopResult = isLastStep ? "max-steps" : "completed";
        logger.log(
          `Finished with "${result}" at step ${this.step} (reason: ${finishReason})`,
        );
        return result;
      }

      // finishReason === "tool-calls" → continue the loop for next step
      logger.log(`Tool calls at step ${this.step}, continuing loop...`);
    }
  }

  getCumulativeTokens(): { input: number; output: number } {
    return { ...this.cumulativeTokens };
  }

  getAccumulatedResponseText(): string {
    // Include in-progress text from the active bridge (streaming step)
    const bridgeText = this.activeBridge?.getCurrentText() ?? "";
    return this.accumulatedResponseText + bridgeText;
  }

  abort(): void {
    this.abortController.abort();
  }

  private injectMaxStepsPrompt(messages: ModelMessage[]): ModelMessage[] {
    const maxStepsText = readPromptFile("max-steps.txt");
    return [...messages, { role: "assistant" as const, content: maxStepsText }];
  }

  private async saveToDb(): Promise<void> {
    try {
      const aiMessagesJson = getAiMessagesJsonIfWithinLimit(
        this.allResponseMessages,
      );

      await db
        .update(messagesTable)
        .set({
          content: this.accumulatedResponseText,
          aiMessagesJson: aiMessagesJson ?? null,
          maxTokensUsed:
            this.cumulativeTokens.input + this.cumulativeTokens.output,
        })
        .where(eq(messagesTable.id, this.params.assistantMessageId));
    } catch (err) {
      logger.error(
        `Failed to save assistant message ${this.params.assistantMessageId}:`,
        err,
      );
    }
  }
}
