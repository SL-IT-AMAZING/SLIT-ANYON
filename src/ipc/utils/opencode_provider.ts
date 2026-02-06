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

interface OpenCodeSession {
  id: string;
}

interface OpenCodePart {
  id: string;
  type: string;
  sessionID: string;
  messageID: string;
  text?: string;
}

interface OpenCodeEvent {
  type: string;
  properties: {
    part?: OpenCodePart;
    delta?: string;
    info?: {
      id: string;
      role: string;
      sessionID: string;
    };
    error?: {
      name: string;
      message: string;
    };
  };
}

export interface OpenCodeProviderSettings {
  hostname?: string;
  port?: number;
  password?: string;
  agentName?: string;
}

export interface OpenCodeProvider {
  (modelId: string, providerID?: string): LanguageModelV2;
}

class OpenCodeLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = "v2" as const;
  readonly provider = "opencode";
  readonly supportedUrls: Record<string, RegExp[]> = {};

  private sessionMap = new Map<string, string>();

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

    const response = await fetch(url, {
      ...options,
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

  private async getOrCreateSession(
    conversationId: string,
  ): Promise<OpenCodeSession> {
    if (this.sessionMap.has(conversationId)) {
      const sessionId = this.sessionMap.get(conversationId)!;
      try {
        const response = await this.fetchOpenCode(`/session/${sessionId}`);
        return response.json();
      } catch {
        logger.debug(`Cached session ${sessionId} invalid, creating new one`);
        this.sessionMap.delete(conversationId);
      }
    }

    logger.debug("Creating new OpenCode session...");
    const response = await this.fetchOpenCode("/session", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const session: OpenCodeSession = await response.json();
    this.sessionMap.set(conversationId, session.id);
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
    const conversationId = `dyad-${Date.now()}`;
    const session = await this.getOrCreateSession(conversationId);
    const userMessage = this.extractUserMessage(options);
    const systemPrompt = this.extractSystemPrompt(options);
    const serverInfo = await this.getServerInfo();

    const promptPayload = {
      parts: [{ type: "text", text: userMessage }],
      ...(systemPrompt && { system: systemPrompt }),
      ...(this.providerID && {
        model: {
          providerID: this.providerID,
          modelID: this.modelId,
        },
      }),
      ...(this.settings.agentName && { agent: this.settings.agentName }),
    };

    logger.debug(`Starting SSE stream for session ${session.id}...`);

    const textId = `opencode-text-${Date.now()}`;
    let messageId: string | null = null;
    let assistantMessageId: string | null = null;
    let textStarted = false;
    let inputTokens = 0;
    let outputTokens = 0;

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
          const eventResponse = await fetch(eventUrl, {
            headers: this.getAuthHeaders(serverInfo.password),
            signal: abortController.signal,
          });

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

          // Start reading SSE BEFORE sending message to avoid race condition
          // Start processing events immediately
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
                  event.type === "message.part.updated" &&
                  event.properties.part
                ) {
                  const part = event.properties.part;
                  const delta = event.properties.delta;

                  logger.debug(
                    `Part updated: type=${part.type}, hasDelta=${!!delta}, hasText=${!!part.text}`,
                  );

                  if (part.type === "text") {
                    if (!delta) continue;

                    if (messageId === null) {
                      messageId = part.messageID;
                    } else if (part.messageID !== messageId) {
                      continue;
                    }

                    if (!textStarted) {
                      controller.enqueue({ type: "text-start", id: textId });
                      textStarted = true;
                    }

                    controller.enqueue({
                      type: "text-delta",
                      id: textId,
                      delta,
                    });
                  }
                } else if (
                  event.type === "message.updated" &&
                  event.properties.info
                ) {
                  const info = event.properties.info;

                  if (info.role === "assistant") {
                    if (assistantMessageId === null) {
                      assistantMessageId = info.id;
                    } else if (info.id === assistantMessageId) {
                      finished = true;

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
                    }
                  }
                } else if (event.type === "session.error") {
                  const error = event.properties.error;
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
          const sendPromise = this.fetchOpenCode(
            `/session/${session.id}/message`,
            {
              method: "POST",
              body: JSON.stringify(promptPayload),
              signal: abortController.signal,
            },
          )
            .then((resp) => {
              logger.debug(`Message send response status: ${resp.status}`);
              return resp;
            })
            .catch((err) => {
              logger.error(`Message send error: ${err}`);
              throw err;
            });

          await Promise.all([sendPromise, processEventsPromise]);
        } catch (err) {
          if (
            err instanceof Error &&
            (err.name === "AbortError" || err.message.includes("abort"))
          ) {
            logger.debug("Stream aborted");
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
