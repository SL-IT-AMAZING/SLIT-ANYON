import type { LanguageModelV2CallOptions } from "@ai-sdk/provider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOpenCodeProvider,
  resetOpenCodeAgentCache,
  resetOpenCodeSessionCache,
} from "../ipc/utils/opencode_provider";
import { openCodeServer } from "../ipc/utils/opencode_server";

vi.mock("../ipc/utils/opencode_server", () => ({
  openCodeServer: {
    ensureRunning: vi.fn(),
  },
}));

interface SessionLookupModel {
  getOrCreateSession: (conversationId: string) => Promise<{ id: string }>;
}

interface GenerateModel {
  doGenerate: (options: LanguageModelV2CallOptions) => Promise<unknown>;
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function createSseResponse(events: unknown[]): Response {
  const payload = events
    .map((event) => `data: ${JSON.stringify(event)}\n\n`)
    .join("");

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(payload));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
    },
  });
}

describe("OpenCode provider session caching", () => {
  beforeEach(() => {
    resetOpenCodeAgentCache();
    resetOpenCodeSessionCache();
    vi.mocked(openCodeServer.ensureRunning).mockResolvedValue({
      url: "http://127.0.0.1:51962",
      password: "pw",
      port: 51962,
      hostname: "127.0.0.1",
      pid: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reuses a cached session across provider instances", async () => {
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.endsWith("/session") && init?.method === "POST") {
          return createJsonResponse({ id: "sess-1" });
        }

        if (url.endsWith("/session/sess-1")) {
          return createJsonResponse({ id: "sess-1" });
        }

        throw new Error(
          `Unexpected fetch call: ${url} ${init?.method ?? "GET"}`,
        );
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const firstModel = createOpenCodeProvider({
      conversationId: "anyon-chat-7",
    })("dummy-model") as unknown as SessionLookupModel;

    const secondModel = createOpenCodeProvider({
      conversationId: "anyon-chat-7",
    })("dummy-model") as unknown as SessionLookupModel;

    const firstSession = await firstModel.getOrCreateSession("anyon-chat-7");
    const secondSession = await secondModel.getOrCreateSession("anyon-chat-7");

    expect(firstSession.id).toBe("sess-1");
    expect(secondSession.id).toBe("sess-1");

    const createCalls = fetchMock.mock.calls.filter(
      ([input, init]) =>
        (typeof input === "string" ? input : input.toString()).endsWith(
          "/session",
        ) && init?.method === "POST",
    );
    expect(createCalls).toHaveLength(1);
  });

  it("creates a new session when a cached one is invalid", async () => {
    let createCount = 0;

    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.endsWith("/session") && init?.method === "POST") {
          createCount += 1;
          return createJsonResponse({ id: `sess-${createCount}` });
        }

        if (url.endsWith("/session/sess-1")) {
          return createJsonResponse({ message: "not found" }, 404);
        }

        if (url.endsWith("/session/sess-2")) {
          return createJsonResponse({ id: "sess-2" });
        }

        throw new Error(
          `Unexpected fetch call: ${url} ${init?.method ?? "GET"}`,
        );
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const firstModel = createOpenCodeProvider({
      conversationId: "anyon-chat-9",
    })("dummy-model") as unknown as SessionLookupModel;

    const secondModel = createOpenCodeProvider({
      conversationId: "anyon-chat-9",
    })("dummy-model") as unknown as SessionLookupModel;

    const firstSession = await firstModel.getOrCreateSession("anyon-chat-9");
    const secondSession = await secondModel.getOrCreateSession("anyon-chat-9");

    expect(firstSession.id).toBe("sess-1");
    expect(secondSession.id).toBe("sess-2");

    const createCalls = fetchMock.mock.calls.filter(
      ([input, init]) =>
        (typeof input === "string" ? input : input.toString()).endsWith(
          "/session",
        ) && init?.method === "POST",
    );
    expect(createCalls).toHaveLength(2);
  });

  it("does not recreate session on transient cached-session lookup failure", async () => {
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.endsWith("/session") && init?.method === "POST") {
          return createJsonResponse({ id: "sess-1" });
        }

        if (url.endsWith("/session/sess-1")) {
          throw new TypeError("fetch failed");
        }

        throw new Error(
          `Unexpected fetch call: ${url} ${init?.method ?? "GET"}`,
        );
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const firstModel = createOpenCodeProvider({
      conversationId: "anyon-chat-11",
      agentName: "Sisyphus",
    })("dummy-model") as unknown as SessionLookupModel;

    const secondModel = createOpenCodeProvider({
      conversationId: "anyon-chat-11",
      agentName: "Atlas",
    })("dummy-model") as unknown as SessionLookupModel;

    const firstSession = await firstModel.getOrCreateSession("anyon-chat-11");
    expect(firstSession.id).toBe("sess-1");

    await expect(
      secondModel.getOrCreateSession("anyon-chat-11"),
    ).rejects.toThrow("fetch failed");

    const createCalls = fetchMock.mock.calls.filter(
      ([input, init]) =>
        (typeof input === "string" ? input : input.toString()).endsWith(
          "/session",
        ) && init?.method === "POST",
    );

    expect(createCalls).toHaveLength(1);
  });

  it("reuses cached session across agent switches for the same chat", async () => {
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.endsWith("/session") && init?.method === "POST") {
          return createJsonResponse({ id: "sess-shared" });
        }

        if (url.endsWith("/session/sess-shared")) {
          return createJsonResponse({ id: "sess-shared" });
        }

        throw new Error(
          `Unexpected fetch call: ${url} ${init?.method ?? "GET"}`,
        );
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const sisyphusModel = createOpenCodeProvider({
      conversationId: "anyon-chat-12",
      agentName: "Sisyphus",
    })("dummy-model") as unknown as SessionLookupModel;

    const atlasModel = createOpenCodeProvider({
      conversationId: "anyon-chat-12",
      agentName: "Atlas",
    })("dummy-model") as unknown as SessionLookupModel;

    const firstSession =
      await sisyphusModel.getOrCreateSession("anyon-chat-12");
    const secondSession = await atlasModel.getOrCreateSession("anyon-chat-12");

    expect(firstSession.id).toBe("sess-shared");
    expect(secondSession.id).toBe("sess-shared");

    const createCalls = fetchMock.mock.calls.filter(
      ([input, init]) =>
        (typeof input === "string" ? input : input.toString()).endsWith(
          "/session",
        ) && init?.method === "POST",
    );

    expect(createCalls).toHaveLength(1);
  });

  it("throws when OpenCode reports retry then idle without output", async () => {
    const sessionId = "sess-overloaded";

    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.endsWith("/session") && init?.method === "POST") {
          return createJsonResponse({ id: sessionId });
        }

        if (url.endsWith("/event")) {
          return createSseResponse([
            { type: "server.connected", properties: {} },
            {
              type: "session.status",
              properties: {
                sessionID: sessionId,
                status: {
                  type: "retry",
                  attempt: 1,
                  message: "Provider is overloaded",
                },
              },
            },
            {
              type: "session.status",
              properties: {
                sessionID: sessionId,
                status: { type: "idle" },
              },
            },
          ]);
        }

        if (
          url.endsWith(`/session/${sessionId}/message`) &&
          init?.method === "POST"
        ) {
          return createJsonResponse({ ok: true });
        }

        throw new Error(
          `Unexpected fetch call: ${url} ${init?.method ?? "GET"}`,
        );
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const model = createOpenCodeProvider({
      conversationId: "anyon-chat-overloaded",
    })("dummy-model") as unknown as GenerateModel;

    const options = {
      prompt: [
        {
          role: "user",
          content: [{ type: "text", text: "hello" }],
        },
      ],
    } as unknown as LanguageModelV2CallOptions;

    await expect(model.doGenerate(options)).rejects.toThrow(
      "Provider is overloaded",
    );
  });

  it("reuses cached agent lists across provider instances", async () => {
    const sessionId = "sess-agent-cache";

    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;

        if (url.endsWith("/session") && init?.method === "POST") {
          return createJsonResponse({ id: sessionId });
        }

        if (url.endsWith("/agent")) {
          return createJsonResponse([
            {
              name: "Sisyphus",
              description: "",
              mode: "primary",
              native: true,
            },
          ]);
        }

        if (url.endsWith("/event")) {
          return createSseResponse([
            { type: "server.connected", properties: {} },
            {
              type: "message.part.updated",
              properties: {
                part: {
                  id: "part-1",
                  type: "text",
                  sessionID: sessionId,
                  messageID: "msg-1",
                },
              },
            },
            {
              type: "message.part.delta",
              properties: {
                sessionID: sessionId,
                partID: "part-1",
                delta: "Hello",
              },
            },
            {
              type: "message.updated",
              properties: {
                info: {
                  role: "assistant",
                  sessionID: sessionId,
                  tokens: { input: 1, output: 1 },
                },
              },
            },
            {
              type: "session.status",
              properties: {
                sessionID: sessionId,
                status: { type: "idle" },
              },
            },
          ]);
        }

        if (
          url.endsWith(`/session/${sessionId}/message`) &&
          init?.method === "POST"
        ) {
          return createJsonResponse({ ok: true });
        }

        throw new Error(
          `Unexpected fetch call: ${url} ${init?.method ?? "GET"}`,
        );
      },
    );

    vi.stubGlobal("fetch", fetchMock);

    const options = {
      prompt: [
        {
          role: "user",
          content: [{ type: "text", text: "hello" }],
        },
      ],
    } as unknown as LanguageModelV2CallOptions;

    const firstModel = createOpenCodeProvider({
      conversationId: "anyon-chat-agent-cache-1",
      agentName: "Sisyphus",
      appPath: "/tmp/app-one",
    })("dummy-model") as unknown as GenerateModel;

    const secondModel = createOpenCodeProvider({
      conversationId: "anyon-chat-agent-cache-2",
      agentName: "Sisyphus",
      appPath: "/tmp/app-one",
    })("dummy-model") as unknown as GenerateModel;

    await firstModel.doGenerate(options);
    await secondModel.doGenerate(options);

    const agentCalls = fetchMock.mock.calls.filter(([input]) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      return url.endsWith("/agent");
    });

    expect(agentCalls).toHaveLength(1);
  });
});
