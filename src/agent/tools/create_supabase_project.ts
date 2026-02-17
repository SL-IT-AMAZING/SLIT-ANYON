import { z } from "zod";
import log from "electron-log";
import { readSettings } from "@/main/settings";
import {
  getSupabaseClient,
  refreshSupabaseToken,
} from "@/supabase_admin/supabase_management_client";
import { fetchWithRetry } from "@/ipc/utils/retryWithRateLimit";
import { TOOL_FETCH_TIMEOUT_MS, type ToolSpec } from "./spec";

const logger = log.scope("tool-create-supabase-project");

type CreateSupabaseProjectInput = {
  name: string;
  region: string;
  plan: "free" | "pro";
  organizationId: string;
};

type CreateSupabaseProjectOutput = {
  id: string;
  name: string;
  [key: string]: unknown;
};

export const createSupabaseProjectTool: ToolSpec<
  CreateSupabaseProjectInput,
  CreateSupabaseProjectOutput
> = {
  name: "create_supabase_project",
  description: "Create a Supabase project via the Supabase Management API.",
  inputSchema: z
    .object({
      name: z.string().min(1),
      region: z.string().min(1),
      plan: z.enum(["free", "pro"]),
      organizationId: z.string().min(1),
    })
    .strict(),
  outputSchema: z.object({ id: z.string(), name: z.string() }).passthrough(),
  async execute({ name, region, plan, organizationId }) {
    await refreshSupabaseToken();
    await getSupabaseClient();

    const settings = readSettings();
    const token = settings.supabase?.accessToken?.value;
    if (!token) {
      throw new Error(
        "Supabase access token not found. Please authenticate first.",
      );
    }

    logger.info(`Creating Supabase project: ${name} (${region}, ${plan})`);

    const response = await fetchWithRetry(
      "https://api.supabase.com/v1/projects",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          region,
          plan,
          organization_id: organizationId,
        }),
        signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
      },
      "create_supabase_project",
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Supabase project creation failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return (await response.json()) as CreateSupabaseProjectOutput;
  },
};
