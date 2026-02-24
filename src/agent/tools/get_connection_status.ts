import { z } from "zod";
import { readSettings } from "@/main/settings";
import type { ToolSpec } from "./spec";
type GetConnectionStatusInput = Record<string, never>;
type ConnectionStatus = {
  connected: boolean;
  projectId?: string;
};

type SupabaseConnectionStatus = ConnectionStatus & {
  organizationSlug?: string;
};
type GetConnectionStatusOutput = {
  supabase: SupabaseConnectionStatus;
  vercel: ConnectionStatus;
};
export const getConnectionStatusTool: ToolSpec<
  GetConnectionStatusInput,
  GetConnectionStatusOutput
> = {
  name: "get_connection_status",
  description:
    "Check whether Supabase and Vercel are connected based on stored settings tokens. Returns organization slug for Supabase so you can use it when creating projects.",
  inputSchema: z.object({}).strict(),
  outputSchema: z
    .object({
      supabase: z.object({
        connected: z.boolean(),
        projectId: z.string().optional(),
        organizationSlug: z.string().optional(),
      }),
      vercel: z.object({
        connected: z.boolean(),
        projectId: z.string().optional(),
      }),
    })
    .strict(),
  async execute() {
    const settings = readSettings();
    const supabaseOrganizations = settings.supabase?.organizations ?? {};
    const orgSlugs = Object.keys(supabaseOrganizations);
    const supabaseOrgTokens = Object.values(supabaseOrganizations).some(
      (org) => !!org.accessToken?.value,
    );
    const supabaseConnected =
      !!settings.supabase?.accessToken?.value || supabaseOrgTokens;
    // Return the first available organization slug so the AI agent can use it
    // when creating Supabase projects (organizationId param).
    const organizationSlug = orgSlugs.length > 0 ? orgSlugs[0] : undefined;
    const vercelConnected =
      !!settings.vercel?.accessToken?.value ||
      !!settings.vercelAccessToken?.value;
    return {
      supabase: { connected: supabaseConnected, organizationSlug },
      vercel: { connected: vercelConnected },
    };
  },
};
