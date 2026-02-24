import type { TextStreamPart, ToolSet } from "ai";

import { StreamBridge } from "@/agent/runtime/stream_bridge";
import type { StreamCallbacks } from "@/agent/runtime/types";
import { describe, expect, it, vi } from "vitest";

function createCallbacks(): StreamCallbacks {
  return {
    onTextDelta: vi.fn(),
    onReasoningDelta: vi.fn(),
    onToolCall: vi.fn(),
    onToolResult: vi.fn(),
    onToolError: vi.fn(),
    onStepFinish: vi.fn(),
    onFinish: vi.fn(),
    onError: vi.fn(),
  };
}

function toAsyncIterableStream(
  parts: TextStreamPart<ToolSet>[],
): AsyncIterable<TextStreamPart<ToolSet>> &
  ReadableStream<TextStreamPart<ToolSet>> {
  const iterable = {
    async *[Symbol.asyncIterator]() {
      for (const part of parts) {
        yield part;
      }
    },
  };

  return iterable as unknown as AsyncIterable<TextStreamPart<ToolSet>> &
    ReadableStream<TextStreamPart<ToolSet>>;
}

describe("StreamBridge", () => {
  it("handles text, reasoning, tools, finish events, and accumulates full response text", async () => {
    const callbacks = createCallbacks();
    const bridge = new StreamBridge(callbacks, new Set(["native_tool"]));
    const abort = new AbortController();

    const parts = [
      {
        type: "reasoning-delta",
        text: "thinking...",
      } as TextStreamPart<ToolSet>,
      { type: "text-delta", text: "answer " } as TextStreamPart<ToolSet>,
      {
        type: "tool-call",
        toolName: "native_tool",
        toolCallId: "call-1",
        input: { q: "x" },
      } as TextStreamPart<ToolSet>,
      {
        type: "tool-call",
        toolName: "mcp_lookup",
        toolCallId: "call-2",
        input: { key: "y" },
      } as TextStreamPart<ToolSet>,
      {
        type: "tool-result",
        toolName: "native_tool",
        toolCallId: "call-1",
        output: { ok: true },
      } as TextStreamPart<ToolSet>,
      {
        type: "tool-result",
        toolName: "mcp_lookup",
        toolCallId: "call-2",
        output: "done",
      } as TextStreamPart<ToolSet>,
      {
        type: "tool-error",
        toolName: "native_tool",
        toolCallId: "call-3",
        error: new Error("boom"),
      } as TextStreamPart<ToolSet>,
      {
        type: "finish-step",
        usage: { inputTokens: 3, outputTokens: 7 },
      } as TextStreamPart<ToolSet>,
      {
        type: "finish",
        totalUsage: { inputTokens: 10, outputTokens: 20 },
      } as TextStreamPart<ToolSet>,
      {
        type: "error",
        error: new Error("stream-part-error"),
      } as TextStreamPart<ToolSet>,
    ];

    const result = await bridge.processStream(
      toAsyncIterableStream(parts),
      abort.signal,
    );

    expect(callbacks.onReasoningDelta).toHaveBeenCalledWith("thinking...");
    expect(callbacks.onTextDelta).toHaveBeenCalledWith("answer ");
    expect(callbacks.onToolCall).toHaveBeenCalledWith("native_tool", "call-1", {
      q: "x",
    });
    expect(callbacks.onToolCall).toHaveBeenCalledWith("mcp_lookup", "call-2", {
      key: "y",
    });
    expect(callbacks.onToolResult).toHaveBeenCalledWith(
      "native_tool",
      "call-1",
      '{"ok":true}',
    );
    expect(callbacks.onToolResult).toHaveBeenCalledWith(
      "mcp_lookup",
      "call-2",
      "done",
    );
    expect(callbacks.onToolError).toHaveBeenCalledWith(
      "native_tool",
      "call-3",
      "boom",
    );
    expect(callbacks.onStepFinish).toHaveBeenCalledWith({
      inputTokens: 3,
      outputTokens: 7,
    });
    expect(callbacks.onFinish).toHaveBeenCalledWith({
      inputTokens: 10,
      outputTokens: 20,
    });
    expect(callbacks.onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: "stream-part-error" }),
    );

    expect(result.hasToolCalls).toBe(true);
    expect(result.fullResponseText).toContain(
      "<think>thinking...</think>answer ",
    );
    expect(result.fullResponseText).toContain(
      '<opencode-tool name="native_tool" id="call-1">\n{"q":"x"}\n</opencode-tool>\n',
    );
    expect(result.fullResponseText).toContain(
      '<anyon-mcp-tool-call tool="mcp_lookup">\n{"key":"y"}\n</anyon-mcp-tool-call>\n',
    );
    expect(result.fullResponseText).toContain(
      '<opencode-tool-result name="native_tool" id="call-1">\n{"ok":true}\n</opencode-tool-result>\n',
    );
    expect(result.fullResponseText).toContain(
      '<anyon-mcp-tool-result tool="mcp_lookup">\ndone\n</anyon-mcp-tool-result>\n',
    );
    expect(result.fullResponseText).toContain(
      '<opencode-tool-error name="native_tool" id="call-3">\nboom\n</opencode-tool-error>\n',
    );
  });

  it("stops processing when aborted mid-stream", async () => {
    const callbacks = createCallbacks();
    const abort = new AbortController();
    const bridge = new StreamBridge(callbacks, new Set());

    vi.mocked(callbacks.onTextDelta).mockImplementation(() => {
      abort.abort();
    });

    const parts = [
      { type: "text-delta", text: "first" } as TextStreamPart<ToolSet>,
      { type: "text-delta", text: "second" } as TextStreamPart<ToolSet>,
    ];

    const result = await bridge.processStream(
      toAsyncIterableStream(parts),
      abort.signal,
    );

    expect(callbacks.onTextDelta).toHaveBeenCalledTimes(1);
    expect(result.fullResponseText).toBe("first");
    expect(result.hasToolCalls).toBe(false);
  });

  it("closes an unclosed thinking block at stream end", async () => {
    const callbacks = createCallbacks();
    const bridge = new StreamBridge(callbacks, new Set());
    const abort = new AbortController();

    const result = await bridge.processStream(
      toAsyncIterableStream([
        {
          type: "reasoning-delta",
          text: "unfinished",
        } as TextStreamPart<ToolSet>,
      ]),
      abort.signal,
    );

    expect(result.fullResponseText).toBe("<think>unfinished</think>");
  });
});
