import { verifyAuth } from "./auth";
import { ingestTokenUsage } from "./credits";
import { polar } from "./polar";
import { getProviderApiKey, getProviderConfig } from "./provider-config";

const HEADERS_TO_STRIP = new Set([
  "host",
  "authorization",
  "connection",
  "content-length",
  "transfer-encoding",
]);

function forwardHeaders(
  incoming: Headers,
  providerAuth: Record<string, string>,
): Headers {
  const out = new Headers();
  for (const [key, value] of incoming.entries()) {
    if (!HEADERS_TO_STRIP.has(key.toLowerCase())) {
      out.set(key, value);
    }
  }
  for (const [key, value] of Object.entries(providerAuth)) {
    out.set(key, value);
  }
  return out;
}

interface CreditCheckResult {
  allowed: boolean;
  reason?: string;
}

async function checkCredits(userId: string): Promise<CreditCheckResult> {
  try {
    const customers = await polar.customers.list({ query: userId });
    const customer = customers.result.items[0];
    if (!customer) {
      return { allowed: false, reason: "No billing account found" };
    }

    const meters = await polar.customerMeters.list({
      customerId: customer.id,
    });
    const meterData = meters.result.items[0];
    if (!meterData) {
      return { allowed: true };
    }

    const remaining = meterData.creditedUnits - meterData.consumedUnits;
    if (remaining <= 0) {
      return {
        allowed: false,
        reason: "Credit limit reached. Upgrade your plan for more credits.",
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Credit check failed, allowing request:", error);
    return { allowed: true };
  }
}

function extractModelFromBody(body: string | null): string | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body) as { model?: string };
    return typeof parsed.model === "string" ? parsed.model : null;
  } catch {
    return null;
  }
}

interface UsageData {
  inputTokens: number;
  outputTokens: number;
}

function extractAnthropicUsage(
  parsed: Record<string, unknown>,
): UsageData | null {
  const usage = parsed.usage as Record<string, unknown> | undefined;
  if (!usage) return null;
  const input = typeof usage.input_tokens === "number" ? usage.input_tokens : 0;
  const output =
    typeof usage.output_tokens === "number" ? usage.output_tokens : 0;
  if (input === 0 && output === 0) return null;
  return { inputTokens: input, outputTokens: output };
}

function extractOpenAIUsage(parsed: Record<string, unknown>): UsageData | null {
  const usage = parsed.usage as Record<string, unknown> | undefined;
  if (!usage) return null;
  const input =
    typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : 0;
  const output =
    typeof usage.completion_tokens === "number" ? usage.completion_tokens : 0;
  if (input === 0 && output === 0) return null;
  return { inputTokens: input, outputTokens: output };
}

function extractGoogleUsage(parsed: Record<string, unknown>): UsageData | null {
  const meta = parsed.usageMetadata as Record<string, unknown> | undefined;
  if (!meta) return null;
  const input =
    typeof meta.promptTokenCount === "number" ? meta.promptTokenCount : 0;
  const output =
    typeof meta.candidatesTokenCount === "number"
      ? meta.candidatesTokenCount
      : 0;
  if (input === 0 && output === 0) return null;
  return { inputTokens: input, outputTokens: output };
}

function extractUsageFromLine(
  provider: string,
  line: string,
): UsageData | null {
  let data: string;
  if (line.startsWith("data: ")) {
    data = line.slice(6).trim();
  } else {
    data = line.trim();
  }

  if (!data || data === "[DONE]") return null;

  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;

    switch (provider) {
      case "anthropic":
        return extractAnthropicUsage(parsed);
      case "openai":
      case "xai":
        return extractOpenAIUsage(parsed);
      case "google":
        return extractGoogleUsage(parsed);
      default:
        return extractOpenAIUsage(parsed);
    }
  } catch {
    return null;
  }
}

export async function handleProxyRequest(
  request: Request,
  provider: string,
  pathSegments: string[],
): Promise<Response> {
  const config = getProviderConfig(provider);
  if (!config) {
    return new Response(
      JSON.stringify({ error: `Unsupported provider: ${provider}` }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const apiKey = getProviderApiKey(provider);
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: `API key not configured for provider: ${provider}`,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let user: { id: string };
  try {
    user = await verifyAuth(request);
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const creditCheck = await checkCredits(user.id);
  if (!creditCheck.allowed) {
    return new Response(JSON.stringify({ error: creditCheck.reason }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstreamPath = pathSegments.join("/");
  const url = new URL(request.url);
  url.searchParams.delete("provider");
  url.searchParams.delete("path");
  const queryString = url.search;
  const upstreamUrl = `${config.baseUrl}/${upstreamPath}${queryString}`;

  const requestBody =
    request.method !== "GET" && request.method !== "HEAD"
      ? await request.text()
      : null;

  const model = extractModelFromBody(requestBody);

  const upstreamHeaders = forwardHeaders(
    request.headers,
    config.authHeaders(apiKey),
  );

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: requestBody,
  });

  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  const isStreaming =
    contentType.includes("text/event-stream") || contentType.includes("stream");

  if (!isStreaming) {
    const responseBody = await upstreamResponse.text();

    if (model && upstreamResponse.ok) {
      try {
        const parsed = JSON.parse(responseBody) as Record<string, unknown>;
        const usage =
          extractAnthropicUsage(parsed) ??
          extractOpenAIUsage(parsed) ??
          extractGoogleUsage(parsed);
        if (usage) {
          const totalTokens = usage.inputTokens + usage.outputTokens;
          ingestTokenUsage(user.id, totalTokens, model).catch((e) =>
            console.error("Usage ingestion failed:", e),
          );
        }
      } catch {
        void 0;
      }
    }

    const responseHeaders = new Headers();
    for (const [key, value] of upstreamResponse.headers.entries()) {
      if (key.toLowerCase() !== "transfer-encoding") {
        responseHeaders.set(key, value);
      }
    }

    return new Response(responseBody, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  }

  const upstreamBody = upstreamResponse.body;
  if (!upstreamBody) {
    return new Response(null, { status: upstreamResponse.status });
  }

  const userId = user.id;
  const modelId = model;
  let accumulatedUsage: UsageData | null = null;

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);

      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n");
      for (const line of lines) {
        const usage = extractUsageFromLine(provider, line);
        if (usage) {
          accumulatedUsage = usage;
        }
      }
    },
    flush() {
      if (accumulatedUsage && modelId) {
        const totalTokens =
          accumulatedUsage.inputTokens + accumulatedUsage.outputTokens;
        if (totalTokens > 0) {
          ingestTokenUsage(userId, totalTokens, modelId).catch((e) =>
            console.error("Usage ingestion failed:", e),
          );
        }
      }
    },
  });

  const responseHeaders = new Headers();
  for (const [key, value] of upstreamResponse.headers.entries()) {
    if (key.toLowerCase() !== "transfer-encoding") {
      responseHeaders.set(key, value);
    }
  }

  return new Response(upstreamBody.pipeThrough(transformStream), {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}
