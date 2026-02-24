import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { apps } from "@/db/schema";
import { autoSyncSupabaseEnvVarsIfConnected } from "@/ipc/handlers/vercel_handlers";
import type { ToolSpec } from "./spec";

type SetSupabaseAppProjectInput = {
  appId: number;
  projectRef: string;
  organizationId?: string;
  parentProjectRef?: string;
};

type SetSupabaseAppProjectOutput = {
  appId: number;
  projectRef: string;
  organizationId: string | null;
  parentProjectRef: string | null;
  syncedToVercel: boolean;
};

export const setSupabaseAppProjectTool: ToolSpec<
  SetSupabaseAppProjectInput,
  SetSupabaseAppProjectOutput
> = {
  name: "set_supabase_app_project",
  description:
    "Link a Supabase project to an app so deploy can auto-sync Supabase env vars to Vercel.",
  inputSchema: z
    .object({
      appId: z.number(),
      projectRef: z.string().min(1),
      organizationId: z.string().min(1).optional(),
      parentProjectRef: z.string().min(1).optional(),
    })
    .strict(),
  outputSchema: z
    .object({
      appId: z.number(),
      projectRef: z.string(),
      organizationId: z.string().nullable(),
      parentProjectRef: z.string().nullable(),
      syncedToVercel: z.boolean(),
    })
    .strict(),
  async execute({ appId, projectRef, organizationId, parentProjectRef }) {
    const app = await db.query.apps.findFirst({ where: eq(apps.id, appId) });
    if (!app) {
      throw new Error(`App ${appId} not found.`);
    }

    await db
      .update(apps)
      .set({
        supabaseProjectId: projectRef,
        supabaseParentProjectId: parentProjectRef ?? null,
        supabaseOrganizationSlug: organizationId ?? null,
      })
      .where(eq(apps.id, appId));

    await autoSyncSupabaseEnvVarsIfConnected(appId, {
      teamId: app.vercelTeamId,
    });

    return {
      appId,
      projectRef,
      organizationId: organizationId ?? null,
      parentProjectRef: parentProjectRef ?? null,
      syncedToVercel: true,
    };
  },
};
