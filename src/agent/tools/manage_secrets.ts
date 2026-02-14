import { z } from "zod";
import { readSettings } from "@/main/settings";
import { refreshSupabaseToken } from "@/supabase_admin/supabase_management_client";
import type { ToolSpec } from "./spec";

type ManageSecretsInput = {
  projectRef: string;
  upsert?: Array<{ name: string; value: string }>;
  remove?: string[];
};

type ManageSecretsOutput = {
  upsertResult?: unknown;
  removeResult?: unknown;
};

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

export const manageSecretsTool: ToolSpec<
  ManageSecretsInput,
  ManageSecretsOutput
> = {
  name: "manage_secrets",
  description:
    "Upsert and/or remove Supabase project secrets via the Supabase Management API.",
  inputSchema: z
    .object({
      projectRef: z.string().min(1),
      upsert: z
        .array(z.object({ name: z.string().min(1), value: z.string() }))
        .optional(),
      remove: z.array(z.string().min(1)).optional(),
    })
    .strict(),
  outputSchema: z
    .object({
      upsertResult: z.unknown().optional(),
      removeResult: z.unknown().optional(),
    })
    .strict(),
  async execute({ projectRef, upsert, remove }) {
    await refreshSupabaseToken();

    const settings = readSettings();
    const token = settings.supabase?.accessToken?.value;
    if (!token) {
      throw new Error(
        "Supabase access token not found. Please authenticate first.",
      );
    }

    const baseUrl = `https://api.supabase.com/v1/projects/${encodeURIComponent(
      projectRef,
    )}/secrets`;

    const result: ManageSecretsOutput = {};

    if (upsert && upsert.length > 0) {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secrets: upsert }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Supabase secrets upsert failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      result.upsertResult = await parseResponseBody(response);
    }

    if (remove && remove.length > 0) {
      const response = await fetch(baseUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ names: remove }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Supabase secrets removal failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      result.removeResult = await parseResponseBody(response);
    }

    return result;
  },
};
