import { z } from "zod";
import { fetchWithRetry } from "@/ipc/utils/retryWithRateLimit";
import { readSettings } from "@/main/settings";
import {
  getSupabaseClientForOrganization,
  refreshSupabaseToken,
} from "@/supabase_admin/supabase_management_client";
import { TOOL_FETCH_TIMEOUT_MS, type ToolSpec } from "./spec";

type ConfigureAuthInput = {
  projectRef: string;
  organizationId?: string;
  config: Record<string, unknown>;
};

type ConfigureAuthOutput = {
  result: unknown;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

export const configureAuthTool: ToolSpec<
  ConfigureAuthInput,
  ConfigureAuthOutput
> = {
  name: "configure_auth",
  description:
    "Patch Supabase auth configuration for a project via the Supabase Management API.",
  inputSchema: z
    .object({
      projectRef: z.string().min(1),
      organizationId: z.string().min(1).optional(),
      config: z.record(z.string(), z.unknown()),
    })
    .strict(),
  outputSchema: z.object({ result: z.unknown() }).strict(),
  async execute({ projectRef, organizationId, config }) {
    let token: string | undefined;

    if (organizationId) {
      await getSupabaseClientForOrganization(organizationId);
      token =
        readSettings().supabase?.organizations?.[organizationId]?.accessToken
          ?.value;
    } else {
      await refreshSupabaseToken();
      token = readSettings().supabase?.accessToken?.value;
    }

    if (!token) {
      throw new Error(
        "Supabase access token not found. Please authenticate first.",
      );
    }

    const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(
      projectRef,
    )}/config/auth`;

    const response = await fetchWithRetry(
      url,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
        signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
      },
      "configure_auth",
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Supabase auth configuration failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return { result: await parseResponseBody(response) };
  },
};
