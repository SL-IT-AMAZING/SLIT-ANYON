import type { TextStreamPart, ToolSet } from "ai";

import type { StreamCallbacks } from "./types";

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>;

export interface StreamBridgeResult {
  fullResponseText: string;
  hasToolCalls: boolean;
}

export class StreamBridge {
  private fullResponseText = "";
  private inThinkingBlock = false;
  private toolCallCount = 0;

  constructor(
    private callbacks: StreamCallbacks,
    private nativeToolIds: Set<string>,
  ) {}

  async processStream(
    fullStream: AsyncIterableStream<TextStreamPart<ToolSet>>,
    abort: AbortSignal,
  ): Promise<StreamBridgeResult> {
    try {
      for await (const part of fullStream) {
        if (abort.aborted) break;
        this.handlePart(part);
      }
    } catch (err) {
      if (!abort.aborted) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.callbacks.onError(error);
      }
    }

    if (this.inThinkingBlock) {
      this.appendText("</think>");
      this.inThinkingBlock = false;
    }

    return {
      fullResponseText: this.fullResponseText,
      hasToolCalls: this.toolCallCount > 0,
    };
  }

  private handlePart(part: TextStreamPart<ToolSet>): void {
    switch (part.type) {
      case "text-delta": {
        this.closeThinkingBlock();
        this.callbacks.onTextDelta(part.text);
        this.appendText(part.text);
        break;
      }

      case "reasoning-delta": {
        if (!this.inThinkingBlock) {
          this.appendText("<think>");
          this.inThinkingBlock = true;
        }
        this.callbacks.onReasoningDelta(part.text);
        this.appendText(part.text);
        break;
      }

      case "tool-call": {
        this.closeThinkingBlock();
        this.toolCallCount++;
        this.callbacks.onToolCall(part.toolName, part.toolCallId, part.input);

        const content = JSON.stringify(part.input);
        if (this.nativeToolIds.has(part.toolName)) {
          this.appendText(
            `<opencode-tool name="${part.toolName}" id="${part.toolCallId}">\n${content}\n</opencode-tool>\n`,
          );
        } else {
          this.appendText(
            `<anyon-mcp-tool-call tool="${part.toolName}">\n${content}\n</anyon-mcp-tool-call>\n`,
          );
        }
        break;
      }

      case "tool-result": {
        const output =
          typeof part.output === "string"
            ? part.output
            : JSON.stringify(part.output);
        this.callbacks.onToolResult(part.toolName, part.toolCallId, output);

        if (this.nativeToolIds.has(part.toolName)) {
          this.appendText(
            `<opencode-tool-result name="${part.toolName}" id="${part.toolCallId}">\n${output}\n</opencode-tool-result>\n`,
          );
        } else {
          this.appendText(
            `<anyon-mcp-tool-result tool="${part.toolName}">\n${output}\n</anyon-mcp-tool-result>\n`,
          );
        }
        break;
      }

      case "tool-error": {
        const errMsg =
          part.error instanceof Error ? part.error.message : String(part.error);
        this.callbacks.onToolError(part.toolName, part.toolCallId, errMsg);
        this.appendText(
          `<opencode-tool-error name="${part.toolName}" id="${part.toolCallId}">\n${errMsg}\n</opencode-tool-error>\n`,
        );
        break;
      }

      case "finish-step": {
        this.callbacks.onStepFinish({
          inputTokens: part.usage.inputTokens ?? 0,
          outputTokens: part.usage.outputTokens ?? 0,
        });
        break;
      }

      case "finish": {
        this.callbacks.onFinish({
          inputTokens: part.totalUsage.inputTokens ?? 0,
          outputTokens: part.totalUsage.outputTokens ?? 0,
        });
        break;
      }

      case "error": {
        const error =
          part.error instanceof Error
            ? part.error
            : new Error(String(part.error));
        this.callbacks.onError(error);
        break;
      }

      default:
        break;
    }
  }

  private closeThinkingBlock(): void {
    if (this.inThinkingBlock) {
      this.appendText("</think>");
      this.inThinkingBlock = false;
    }
  }

  private appendText(text: string): void {
    this.fullResponseText += text;
  }
}
