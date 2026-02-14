import { z } from "zod";
import { readSettings } from "@/main/settings";
import { refreshSupabaseToken } from "@/supabase_admin/supabase_management_client";
import type { ToolSpec } from "./spec";

type ConfigureAuthInput = {
  projectRef: string;
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
      config: z.record(z.string(), z.unknown()),
    })
    .strict(),
  outputSchema: z.object({ result: z.unknown() }).strict(),
  async execute({ projectRef, config }) {
    await refreshSupabaseToken();

    const settings = readSettings();
    const token = settings.supabase?.accessToken?.value;
    if (!token) {
      throw new Error(
        "Supabase access token not found. Please authenticate first.",
      );
    }

    const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(
      projectRef,
    )}/config/auth`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Supabase auth configuration failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return { result: await parseResponseBody(response) };
  },
};
