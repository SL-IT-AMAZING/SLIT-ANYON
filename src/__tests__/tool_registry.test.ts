import type { NativeTool } from "@/agent/runtime/tool_interface";
import { ToolRegistry } from "@/agent/runtime/tool_registry";
import type { ToolContext } from "@/agent/runtime/types";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

function createContext(overrides?: Partial<ToolContext>): ToolContext {
  const abort = new AbortController();
  const base: ToolContext = {
    sessionId: 1,
    chatId: 2,
    appPath: "/tmp/app",
    abort: abort.signal,
    askConsent: vi.fn(async () => true),
    askQuestion: vi.fn(async () => []),
    event: {} as Electron.IpcMainInvokeEvent,
  };

  return { ...base, ...overrides };
}

function createTool(
  id: string,
  riskLevel: "safe" | "moderate" | "dangerous",
  executeImpl?: (input: { value: string }, ctx: ToolContext) => Promise<string>,
): NativeTool<{ value: string }> {
  return {
    id,
    description: `${id} description`,
    parameters: z.object({ value: z.string() }),
    riskLevel,
    execute:
      executeImpl ??
      (async (input) => {
        return `ran:${input.value}`;
      }),
  };
}

describe("ToolRegistry", () => {
  it("register adds a tool and duplicate register throws", () => {
    const registry = new ToolRegistry();
    const tool = createTool("read_file", "safe");

    registry.register(tool);

    expect(registry.has("read_file")).toBe(true);
    expect(registry.get("read_file")).toBe(tool);
    expect(() => registry.register(tool)).toThrow(
      'Tool "read_file" is already registered',
    );
  });

  it("registerAll batch registers and list/get/has work", () => {
    const registry = new ToolRegistry();
    const safeTool = createTool("safe_tool", "safe");
    const moderateTool = createTool("moderate_tool", "moderate");

    registry.registerAll([safeTool, moderateTool]);

    expect(registry.list()).toHaveLength(2);
    expect(registry.has("safe_tool")).toBe(true);
    expect(registry.has("missing_tool")).toBe(false);
    expect(registry.get("moderate_tool")?.id).toBe("moderate_tool");
  });

  it("resolveTools returns ToolSet for selected tools", async () => {
    const registry = new ToolRegistry();
    const tool = createTool("safe_tool", "safe");
    registry.register(tool);

    const ctx = createContext();
    const resolved = registry.resolveTools(["safe_tool"], ctx);

    expect(Object.keys(resolved)).toEqual(["safe_tool"]);
    const output = await resolved.safe_tool.execute?.(
      { value: "hello" },
      undefined as never,
    );
    expect(output).toBe("ran:hello");
  });

  it("resolveTools with empty toolIds resolves all registered tools", () => {
    const registry = new ToolRegistry();
    registry.registerAll([
      createTool("safe_tool", "safe"),
      createTool("dangerous_tool", "dangerous"),
    ]);

    const resolved = registry.resolveTools([], createContext());

    expect(Object.keys(resolved).sort()).toEqual([
      "dangerous_tool",
      "safe_tool",
    ]);
  });

  it("resolveTools auto-allows dangerous tools without asking consent", async () => {
    const executeSpy = vi.fn(async (input: { value: string }) => {
      return `danger:${input.value}`;
    });
    const dangerousTool = createTool("dangerous_tool", "dangerous", executeSpy);
    const registry = new ToolRegistry();
    registry.register(dangerousTool);

    const askConsent = vi.fn(async () => true);
    const ctx = createContext({ askConsent });
    const resolved = registry.resolveTools(["dangerous_tool"], ctx);

    const output = await resolved.dangerous_tool.execute?.(
      { value: "run" },
      undefined as never,
    );
    expect(output).toBe("danger:run");
    // needsConsent always returns false, so askConsent should NOT be called
    expect(askConsent).not.toHaveBeenCalled();
  });

  it("resolveTools executes dangerous tool even when askConsent would deny", async () => {
    const executeSpy = vi.fn(async () => "should-run-now");
    const registry = new ToolRegistry();
    registry.register(createTool("dangerous_tool", "dangerous", executeSpy));

    const ctx = createContext({ askConsent: vi.fn(async () => false) });
    const resolved = registry.resolveTools(["dangerous_tool"], ctx);

    // With needsConsent always false, execution should proceed regardless
    const output = await resolved.dangerous_tool.execute?.({ value: "run" }, undefined as never);
    expect(output).toBe("should-run-now");
    expect(executeSpy).toHaveBeenCalled();
  });

  it("resolveTools propagates abort and skips execution", async () => {
    const executeSpy = vi.fn(async () => "should-not-run");
    const registry = new ToolRegistry();
    registry.register(createTool("safe_tool", "safe", executeSpy));

    const abort = new AbortController();
    abort.abort();
    const ctx = createContext({ abort: abort.signal });
    const resolved = registry.resolveTools(["safe_tool"], ctx);

    await expect(
      resolved.safe_tool.execute?.({ value: "x" }, undefined as never),
    ).rejects.toThrow("Tool execution aborted");
    expect(executeSpy).not.toHaveBeenCalled();
  });
});
