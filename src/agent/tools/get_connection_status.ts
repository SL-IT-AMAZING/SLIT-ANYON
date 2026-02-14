import { z } from "zod";
import { readSettings } from "@/main/settings";
import type { ToolSpec } from "./spec";

type GetConnectionStatusInput = Record<string, never>;

type ConnectionStatus = {
  connected: boolean;
  projectId?: string;
};

type GetConnectionStatusOutput = {
  supabase: ConnectionStatus;
  vercel: ConnectionStatus;
};

export const getConnectionStatusTool: ToolSpec<
  GetConnectionStatusInput,
  GetConnectionStatusOutput
> = {
  name: "get_connection_status",
  description:
    "Check whether Supabase and Vercel are connected based on stored settings tokens.",
  inputSchema: z.object({}).strict(),
  outputSchema: z
    .object({
      supabase: z.object({
        connected: z.boolean(),
        projectId: z.string().optional(),
      }),
      vercel: z.object({
        connected: z.boolean(),
        projectId: z.string().optional(),
      }),
    })
    .strict(),
  async execute() {
    const settings = readSettings();

    const supabaseOrgTokens = Object.values(
      settings.supabase?.organizations ?? {},
    ).some((org) => !!org.accessToken?.value);
    const supabaseConnected =
      !!settings.supabase?.accessToken?.value || supabaseOrgTokens;

    const vercelConnected =
      !!settings.vercel?.accessToken?.value ||
      !!settings.vercelAccessToken?.value;

    return {
      supabase: { connected: supabaseConnected },
      vercel: { connected: vercelConnected },
    };
  },
};
