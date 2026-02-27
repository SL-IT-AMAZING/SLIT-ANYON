import { and, desc, eq, gte, lte } from "drizzle-orm";
import log from "electron-log";
import { z } from "zod";

import { db } from "@/db";
import { apps, chats } from "@/db/schema";

import type { NativeTool } from "../tool_interface";

const logger = log.scope("tool.session_list");

const parameters = z.object({
  limit: z.number().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  project_path: z.string().optional(),
});

type SessionListInput = z.infer<typeof parameters>;

function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
}

export const sessionListTool: NativeTool<SessionListInput> = {
  id: "mcp_session_list",
  description: "List saved chat sessions",
  parameters,
  riskLevel: "safe",
  execute: async (input) => {
    const fromDate = parseDate(input.from_date);
    const toDate = parseDate(input.to_date);
    const rowLimit = Math.max(1, Math.min(input.limit ?? 50, 200));

    const filters = [
      fromDate ? gte(chats.createdAt, fromDate) : undefined,
      toDate ? lte(chats.createdAt, toDate) : undefined,
      input.project_path ? eq(apps.path, input.project_path) : undefined,
    ].filter((item): item is NonNullable<typeof item> => item !== undefined);

    const rows = await db
      .select({
        id: chats.id,
        title: chats.title,
        appId: chats.appId,
        appPath: apps.path,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .innerJoin(apps, eq(chats.appId, apps.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(chats.createdAt))
      .limit(rowLimit);

    logger.debug("Listed sessions", { count: rows.length, limit: rowLimit });

    return JSON.stringify(
      {
        total: rows.length,
        sessions: rows.map((row) => ({
          session_id: String(row.id),
          title: row.title ?? "Untitled Chat",
          app_id: row.appId,
          project_path: row.appPath,
          created_at: row.createdAt,
        })),
      },
      null,
      2,
    );
  },
};
