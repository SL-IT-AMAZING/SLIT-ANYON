import { z } from "zod";
import { retryWithRateLimit } from "@/ipc/utils/retryWithRateLimit";
import { getSupabaseClient } from "@/supabase_admin/supabase_management_client";
import type { ToolSpec } from "./spec";

type GetSupabaseApiKeysInput = {
  projectRef: string;
  organizationId?: string;
};

type GetSupabaseApiKeysOutput = {
  projectRef: string;
  supabaseUrl: string;
  anonKey: string;
  publishableKey: string;
};

export const getSupabaseApiKeysTool: ToolSpec<
  GetSupabaseApiKeysInput,
  GetSupabaseApiKeysOutput
> = {
  name: "get_supabase_api_keys",
  description:
    "Get the Supabase project's publishable/anon API key via the Supabase Management API.",
  inputSchema: z
    .object({
      projectRef: z.string().min(1),
      organizationId: z.string().min(1).optional(),
    })
    .strict(),
  outputSchema: z
    .object({
      projectRef: z.string(),
      supabaseUrl: z.string().url(),
      anonKey: z.string().min(1),
      publishableKey: z.string().min(1),
    })
    .strict(),
  async execute({ projectRef, organizationId }) {
    const supabase = await getSupabaseClient({
      organizationSlug: organizationId ?? null,
    });

    const keys = await retryWithRateLimit(
      () => supabase.getProjectApiKeys(projectRef),
      `Get API keys for ${projectRef}`,
    );

    if (!keys) {
      throw new Error(`No API keys found for Supabase project ${projectRef}.`);
    }

    const publishableKey = keys.find(
      (key) =>
        (key as { name?: string; type?: string }).name === "anon" ||
        (key as { name?: string; type?: string }).type === "publishable",
    );

    if (!publishableKey?.api_key) {
      throw new Error(
        `No publishable API key found for project ${projectRef}. If this project belongs to a specific organization, pass organizationId from get_connection_status.organizationSlug.`,
      );
    }

    return {
      projectRef,
      supabaseUrl: `https://${projectRef}.supabase.co`,
      anonKey: publishableKey.api_key,
      publishableKey: publishableKey.api_key,
    };
  },
};
