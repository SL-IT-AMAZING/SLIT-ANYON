import { z } from "zod";
import { fetchWithRetry } from "@/ipc/utils/retryWithRateLimit";
import { readSettings } from "@/main/settings";
import { refreshSupabaseToken } from "@/supabase_admin/supabase_management_client";
import { TOOL_FETCH_TIMEOUT_MS, type ToolSpec } from "./spec";

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

    const removePerSecret = async () => {
      const fallbackResults: Array<{ name: string; status: number }> = [];

      for (const secretName of remove ?? []) {
        const fallbackResponse = await fetchWithRetry(
          `${baseUrl}/${encodeURIComponent(secretName)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
          },
          "manage_secrets_remove_fallback",
        );

        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          throw new Error(
            `Supabase secrets fallback removal failed for ${secretName}: ${fallbackResponse.status} ${fallbackResponse.statusText} - ${fallbackErrorText}`,
          );
        }

        fallbackResults.push({
          name: secretName,
          status: fallbackResponse.status,
        });
      }

      result.removeResult = { mode: "per-secret", results: fallbackResults };
    };

    if (upsert && upsert.length > 0) {
      let response = await fetchWithRetry(
        baseUrl,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(upsert),
          signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
        },
        "manage_secrets_upsert",
      );

      if (!response.ok && response.status === 400) {
        const firstErrorText = await response.text();
        if (firstErrorText.includes("Expected object")) {
          response = await fetchWithRetry(
            baseUrl,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ secrets: upsert }),
              signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
            },
            "manage_secrets_upsert_legacy",
          );
        } else {
          throw new Error(
            `Supabase secrets upsert failed: 400 Bad Request - ${firstErrorText}`,
          );
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Supabase secrets upsert failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      result.upsertResult = await parseResponseBody(response);
    }

    if (remove && remove.length > 0) {
      let response = await fetchWithRetry(
        baseUrl,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(remove),
          signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
        },
        "manage_secrets_remove",
      );

      if (!response.ok && response.status === 400) {
        const firstErrorText = await response.text();
        if (firstErrorText.includes("Expected object")) {
          response = await fetchWithRetry(
            baseUrl,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ names: remove }),
              signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
            },
            "manage_secrets_remove_legacy",
          );
        } else {
          throw new Error(
            `Supabase secrets removal failed: 400 Bad Request - ${firstErrorText}`,
          );
        }
      }

      if (response.ok) {
        result.removeResult = await parseResponseBody(response);
      } else if (response.status === 404 || response.status === 405) {
        await removePerSecret();
      } else {
        const errorText = await response.text();
        throw new Error(
          `Supabase secrets removal failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }
    }

    return result;
  },
};
