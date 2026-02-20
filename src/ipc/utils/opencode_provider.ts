import type {
  LanguageModelV2,
  LanguageModelV2CallOptions,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2StreamPart,
  LanguageModelV2Usage,
} from "@ai-sdk/provider";
import log from "electron-log";
import { openCodeServer } from "./opencode_server";

const logger = log.scope("opencode-provider");
const OPENCODE_API_TIMEOUT_MS = 15000;
const OPENCODE_SSE_CONNECT_TIMEOUT_MS = 15000;

const conversationSessionMap = new Map<string, string>();

export function resetOpenCodeSessionCache(): void {
  conversationSessionMap.clear();
}

interface OpenCodeSession {
  id: string;
}

interface OpenCodeToolState {
  status: "pending" | "running" | "completed" | "error";
  input: Record<string, unknown>;
  output?: string;
  title?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  time?: {
    start: number;
    end?: number;
  };
}

interface OpenCodePart {
  id: string;
  type: string;
  sessionID: string;
  messageID: string;
  text?: string;
  callID?: string;
  tool?: string;
  state?: OpenCodeToolState;
  metadata?: Record<string, unknown>;
}

interface OpenCodeEvent {
  type: string;
  properties: {
    part?: OpenCodePart;
    delta?: string;
    sessionID?: string;
    info?: {
      id: string;
      role: string;
      sessionID: string;
      tokens?: {
        input: number;
        output: number;
      };
    };
    status?: {
      type: string;
    };
    error?: {
      name: string;
      message: string;
    };
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface OpenCodeProviderSettings {
  hostname?: string;
  port?: number;
  password?: string;
  agentName?: string;
  conversationId?: string;
  appPath?: string;
  thinkingLevel?: "low" | "medium" | "high";
}

export type OpenCodeProvider = (
  modelId: string,
  providerID?: string,
) => LanguageModelV2;

function getBaseAgentName(name: string): string {
  const idx = name.indexOf(" (");
  return idx === -1 ? name : name.slice(0, idx);
}

export function resolveSelectedAgentName(
  selectedAgent: string | undefined,
  availableAgents: Array<{ name: string }>,
): string | undefined {
  if (!selectedAgent) {
    return undefined;
  }

  const exact = availableAgents.find((agent) => agent.name === selectedAgent);
  if (exact) {
    return exact.name;
  }

  const selectedBaseName = getBaseAgentName(selectedAgent);
  const baseMatch = availableAgents.find(
    (agent) => getBaseAgentName(agent.name) === selectedBaseName,
  );
  return baseMatch?.name;
}

class OpenCodeLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2" as const;
  readonly provider = "opencode";
  readonly supportedUrls: Record<string, RegExp[]> = {};

  constructor(
    readonly modelId: string,
    private settings: OpenCodeProviderSettings,
    readonly providerID?: string,
  ) {}

  private async getServerInfo() {
    return openCodeServer.ensureRunning({
      hostname: this.settings.hostname,
      port: this.settings.port,
      password: this.settings.password,
      cwd: this.settings.appPath,
    });
  }

  private getAuthHeaders(password: string): Record<string, string> {
    const credentials = Buffer.from(`opencode:${password}`).toString("base64");
    return {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    };
  }

  private async fetchOpenCode(
    path: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const serverInfo = await this.getServerInfo();
    const url = `${serverInfo.url}${path}`;

    const signal = this.createSignalWithTimeout(
      options.signal ?? undefined,
      OPENCODE_API_TIMEOUT_MS,
    );

    const response = await fetch(url, {
      ...options,
      signal,
      headers: {
        ...this.getAuthHeaders(serverInfo.password),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: response.statusText }));
      throw new Error(
        `OpenCode API error [${response.status}]: ${error.message || "Unknown error"}`,
      );
    }

    return response;
  }

  private createSignalWithTimeout(
    signal: AbortSignal | undefined,
    timeoutMs: number,
  ): AbortSignal {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);

    if (!signal) {
      return timeoutSignal;
    }

    if (typeof AbortSignal.any === "function") {
      return AbortSignal.any([signal, timeoutSignal]);
    }

    const controller = new AbortController();
    const abort = () => controller.abort();
    signal.addEventListener("abort", abort, { once: true });
    timeoutSignal.addEventListener("abort", abort, { once: true });
    return controller.signal;
  }

  private async getOrCreateSession(
    conversationId: string,
  ): Promise<OpenCodeSession> {
    if (conversationSessionMap.has(conversationId)) {
      const sessionId = conversationSessionMap.get(conversationId)!;
      try {
        const response = await this.fetchOpenCode(`/session/${sessionId}`);
        return response.json();
      } catch {
        logger.debug(`Cached session ${sessionId} invalid, creating new one`);
        conversationSessionMap.delete(conversationId);
      }
    }

    logger.debug("Creating new OpenCode session...");
    const response = await this.fetchOpenCode("/session", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const session: OpenCodeSession = await response.json();
    conversationSessionMap.set(conversationId, session.id);
    logger.info(`Session created: ${session.id}`);
    return session;
  }

  private extractSystemPrompt(
    options: LanguageModelV2CallOptions,
  ): string | undefined {
    const { prompt } = options;
    const systemParts: string[] = [];

    for (const message of prompt) {
      if (message.role === "system") {
        systemParts.push(message.content);
      }
    }

    return systemParts.length > 0 ? systemParts.join("\n\n") : undefined;
  }

  private extractUserMessage(options: LanguageModelV2CallOptions): string {
    const { prompt } = options;
    const userParts: string[] = [];

    for (const message of prompt) {
      if (message.role === "user") {
        for (const part of message.content) {
          if (part.type === "text") {
            userParts.push(part.text);
          }
        }
      }
    }

    return userParts.join("\n\n");
  }

  private async resolveAgentName(
    serverInfo: Awaited<ReturnType<OpenCodeLanguageModel["getServerInfo"]>>,
  ): Promise<string | undefined> {
    if (!this.settings.agentName) {
      return undefined;
    }

    try {
      const response = await fetch(`${serverInfo.url}/agent`, {
        headers: this.getAuthHeaders(serverInfo.password),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch agents: ${response.status} ${response.statusText}`,
        );
      }

      const rawAgents: unknown = await response.json();
      const availableAgents = Array.isArray(rawAgents)
        ? rawAgents
            .map((agent) => {
              if (
                typeof agent === "object" &&
                agent !== null &&
                "name" in agent &&
                typeof (agent as { name: unknown }).name === "string"
              ) {
                return { name: (agent as { name: string }).name };
              }
              return null;
            })
            .filter((agent): agent is { name: string } => agent !== null)
        : [];

      const resolved = resolveSelectedAgentName(
        this.settings.agentName,
        availableAgents,
      );

      if (!resolved) {
        logger.warn(
          `Selected agent '${this.settings.agentName}' not found. Falling back to default agent.`,
        );
        return undefined;
      }

      if (resolved !== this.settings.agentName) {
        logger.info(
          `Resolved selected agent '${this.settings.agentName}' to '${resolved}'.`,
        );
      }

      return resolved;
    } catch (error) {
      logger.warn(
        `Failed to validate selected agent '${this.settings.agentName}'. Falling back to default agent.`,
        error,
      );
      return undefined;
    }
  }

  async doGenerate(options: LanguageModelV2CallOptions): Promise<{
    content: Array<LanguageModelV2Content>;
    finishReason: LanguageModelV2FinishReason;
    usage: LanguageModelV2Usage;
    request?: { body?: unknown };
    response?: { headers?: Record<string, string>; body?: unknown };
    warnings: Array<LanguageModelV2CallWarning>;
  }> {
    const streamResult = await this.doStream(options);
    const chunks: string[] = [];
    let finishReason: LanguageModelV2FinishReason = "stop";
    let usage: LanguageModelV2Usage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };

    const reader = streamResult.stream.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value.type === "text-delta") {
        chunks.push(value.delta);
      } else if (value.type === "finish") {
        finishReason = value.finishReason;
        usage = value.usage;
      }
    }

    const content: Array<LanguageModelV2Content> = [];
    const fullText = chunks.join("");
    if (fullText) {
      content.push({ type: "text", text: fullText });
    }

    return {
      content,
      finishReason,
      usage,
      request: streamResult.request,
      warnings: [],
    };
  }

  async doStream(options: LanguageModelV2CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV2StreamPart>;
    request?: { body?: unknown };
    response?: { headers?: Record<string, string> };
  }> {
    const conversationId =
      this.settings.conversationId ?? `anyon-${Date.now()}`;
    const session = await this.getOrCreateSession(conversationId);
    const userMessage = this.extractUserMessage(options);
    const systemPrompt = this.extractSystemPrompt(options);
    const serverInfo = await this.getServerInfo();
    const resolvedAgentName = await this.resolveAgentName(serverInfo);

    // Map thinkingLevel to OpenCode variant name.
    // OpenCode's variant system handles provider-specific mapping internally:
    //   "low"    → OpenAI: reasoningEffort "low"   | Claude: default (no extended thinking)
    //   "medium" → OpenAI: reasoningEffort "medium" | Claude: default (no extended thinking)
    //   "high"   → OpenAI: reasoningEffort "high"   | Claude: thinking budgetTokens 16000
    const variant =
      this.settings.thinkingLevel && this.settings.thinkingLevel !== "medium"
        ? this.settings.thinkingLevel
        : undefined;

    const promptPayload = {
      parts: [{ type: "text", text: userMessage }],
      ...(systemPrompt && { system: systemPrompt }),
      ...(this.providerID &&
        this.providerID !== "auto" && {
          model: {
            providerID: this.providerID,
            modelID: this.modelId,
          },
        }),
      ...(resolvedAgentName && { agent: resolvedAgentName }),
      ...(variant && { variant }),
    };

    logger.debug(`Starting SSE stream for session ${session.id}...`);

    const textId = `opencode-text-${Date.now()}`;
    let textStarted = false;
    let inputTokens = 0;
    let outputTokens = 0;

    const emittedToolStates = new Map<string, string>();
    let inReasoningBlock = false;
    const partTypes = new Map<string, string>();
    const partBuffers = new Map<string, string>();

    const ensureTextStarted = (
      ctrl: ReadableStreamDefaultController<LanguageModelV2StreamPart>,
    ) => {
      if (!textStarted) {
        ctrl.enqueue({ type: "text-start", id: textId });
        textStarted = true;
      }
    };

    const emitDelta = (
      ctrl: ReadableStreamDefaultController<LanguageModelV2StreamPart>,
      text: string,
    ) => {
      ensureTextStarted(ctrl);
      ctrl.enqueue({ type: "text-delta", id: textId, delta: text });
    };

    const closeReasoningBlock = (
      ctrl: ReadableStreamDefaultController<LanguageModelV2StreamPart>,
    ) => {
      if (inReasoningBlock) {
        emitDelta(ctrl, "</think>\n");
        inReasoningBlock = false;
      }
    };

    const stream = new ReadableStream<LanguageModelV2StreamPart>({
      start: async (controller) => {
        const abortController = new AbortController();

        if (options.abortSignal) {
          options.abortSignal.addEventListener("abort", () => {
            abortController.abort();
          });
        }

        try {
          const eventUrl = `${serverInfo.url}/event`;
          const eventResponse = await new Promise<Response>(
            (resolve, reject) => {
              const timer = setTimeout(() => {
                abortController.abort();
                reject(
                  new Error(
                    `SSE connection timed out after ${OPENCODE_SSE_CONNECT_TIMEOUT_MS / 1000}s`,
                  ),
                );
              }, OPENCODE_SSE_CONNECT_TIMEOUT_MS);

              fetch(eventUrl, {
                headers: this.getAuthHeaders(serverInfo.password),
                signal: abortController.signal,
              })
                .then((response) => {
                  clearTimeout(timer);
                  resolve(response);
                })
                .catch((error) => {
                  clearTimeout(timer);
                  reject(error);
                });
            },
          );

          if (!eventResponse.ok) {
            throw new Error(
              `SSE connection failed: ${eventResponse.status} ${eventResponse.statusText}`,
            );
          }

          if (!eventResponse.body) {
            throw new Error("No body in SSE response");
          }

          const reader = eventResponse.body
            .pipeThrough(new TextDecoderStream())
            .getReader();

          let buffer = "";
          let finished = false;

          const processEventsPromise = (async () => {
            logger.debug("Starting to process SSE events...");
            while (!finished) {
              const { done, value } = await reader.read();
              if (done) {
                logger.debug("SSE stream ended");
                break;
              }

              logger.debug(`SSE raw chunk: ${value.substring(0, 200)}...`);
              buffer += value;
              const chunks = buffer.split("\n\n");
              buffer = chunks.pop() ?? "";

              for (const chunk of chunks) {
                const lines = chunk.split("\n");
                const dataLines: string[] = [];

                for (const line of lines) {
                  if (line.startsWith("data:")) {
                    dataLines.push(line.replace(/^data:\s*/, ""));
                  }
                }

                if (dataLines.length === 0) continue;

                const rawData = dataLines.join("\n");
                let event: OpenCodeEvent;
                try {
                  event = JSON.parse(rawData);
                  logger.debug(`SSE event type: ${event.type}`);
                } catch {
                  logger.warn(
                    `Failed to parse SSE event: ${rawData.substring(0, 100)}`,
                  );
                  continue;
                }

                if (
                  event.type === "message.part.delta" &&
                  event.properties.delta != null
                ) {
                  const props = event.properties as {
                    sessionID?: string;
                    partID?: string;
                    field?: string;
                    delta?: string;
                  };
                  if (props.sessionID !== session.id) continue;

                  const delta = props.delta ?? "";
                  if (!delta) continue;

                  const partId = props.partID ?? "";
                  const knownType = partTypes.get(partId);

                  if (
                    knownType === "reasoning" ||
                    props.field === "reasoning"
                  ) {
                    if (!inReasoningBlock) {
                      emitDelta(controller, "\n<think>\n");
                      inReasoningBlock = true;
                    }
                    emitDelta(controller, delta);
                  } else if (knownType) {
                    closeReasoningBlock(controller);
                    emitDelta(controller, delta);
                  } else {
                    const existing = partBuffers.get(partId) ?? "";
                    partBuffers.set(partId, existing + delta);
                  }
                } else if (
                  event.type === "message.part.updated" &&
                  event.properties.part
                ) {
                  const part = event.properties.part;

                  if (part.sessionID !== session.id) continue;

                  partTypes.set(part.id, part.type);

                  const buffered = partBuffers.get(part.id);
                  if (buffered) {
                    partBuffers.delete(part.id);
                    if (part.type === "reasoning") {
                      if (!inReasoningBlock) {
                        emitDelta(controller, "\n<think>\n");
                        inReasoningBlock = true;
                      }
                      emitDelta(controller, buffered);
                    } else {
                      closeReasoningBlock(controller);
                      emitDelta(controller, buffered);
                    }
                  }

                  if (part.type === "tool" && part.state && part.tool) {
                    closeReasoningBlock(controller);
                    const status = part.state.status;
                    const lastStatus = emittedToolStates.get(part.id);

                    if (status !== lastStatus) {
                      emittedToolStates.set(part.id, status);
                      const toolName = escapeXml(part.tool);
                      const toolId = escapeXml(part.id);
                      const title = escapeXml(part.state.title || part.tool);

                      if (status === "running") {
                        emitDelta(
                          controller,
                          `\n<opencode-tool name="${toolName}" status="running" title="${title}" toolid="${toolId}"></opencode-tool>\n`,
                        );
                      } else if (status === "completed") {
                        const output = part.state.output ?? "";
                        emitDelta(
                          controller,
                          `\n<opencode-tool name="${toolName}" status="completed" title="${title}" toolid="${toolId}">\n${output}\n</opencode-tool>\n`,
                        );
                      } else if (status === "error") {
                        const errMsg = part.state.error ?? "Unknown error";
                        emitDelta(
                          controller,
                          `\n<opencode-tool name="${toolName}" status="error" title="${title}" toolid="${toolId}">\n${errMsg}\n</opencode-tool>\n`,
                        );
                      }
                    }
                  } else if (
                    part.type === "step-start" ||
                    part.type === "step-finish"
                  ) {
                    closeReasoningBlock(controller);
                  }
                } else if (
                  event.type === "session.status" &&
                  event.properties.sessionID === session.id &&
                  event.properties.status?.type === "idle"
                ) {
                  finished = true;
                  closeReasoningBlock(controller);

                  if (textStarted) {
                    controller.enqueue({ type: "text-end", id: textId });
                  }

                  controller.enqueue({
                    type: "finish",
                    finishReason: "stop",
                    usage: {
                      inputTokens,
                      outputTokens,
                      totalTokens: inputTokens + outputTokens,
                    },
                  });

                  controller.close();
                  break;
                } else if (
                  event.type === "message.updated" &&
                  event.properties.info
                ) {
                  const info = event.properties.info;

                  if (
                    info.role === "assistant" &&
                    info.sessionID === session.id
                  ) {
                    if (info.tokens) {
                      inputTokens = info.tokens.input ?? 0;
                      outputTokens = info.tokens.output ?? 0;
                    }
                  }
                } else if (event.type === "session.error") {
                  const error = event.properties.error;
                  if (
                    event.properties.sessionID &&
                    event.properties.sessionID !== session.id
                  )
                    continue;
                  logger.error("Session error:", error);
                  controller.error(
                    new Error(error?.message || "Unknown session error"),
                  );
                  finished = true;
                  break;
                }
              }
            }
          })();

          // Send message AFTER we start listening for events
          logger.debug("Sending message to OpenCode...");
          this.fetchOpenCode(
            `/session/${session.id}/message`,
            {
              method: "POST",
              body: JSON.stringify(promptPayload),
              signal: abortController.signal,
            },
          )
            .then((resp) => {
              logger.debug(`Message send response status: ${resp.status}`);
            })
            .catch((err) => {
              logger.error(`Message send error: ${err}`);
            });

          await processEventsPromise;
        } catch (err) {
          if (
            err instanceof Error &&
            (err.name === "AbortError" || err.message.includes("abort"))
          ) {
            logger.debug("Stream aborted");
            if (options.abortSignal?.aborted) {
              controller.close();
            } else {
              controller.error(
                new Error("OpenCode stream aborted before completion"),
              );
            }
          } else {
            logger.error("Stream error:", err);
            controller.error(err);
          }
        }
      },
    });

    return {
      stream,
      request: { body: promptPayload },
    };
  }
}

export function createOpenCodeProvider(
  settings: OpenCodeProviderSettings = {},
): OpenCodeProvider {
  return (modelId: string, providerID?: string): LanguageModelV2 => {
    return new OpenCodeLanguageModel(modelId, settings, providerID);
  };
}
