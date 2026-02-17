import { z } from "zod";
import { fetchWithRetry } from "@/ipc/utils/retryWithRateLimit";
import { getVercelAccessToken } from "@/vercel_admin/vercel_management_client";
import { TOOL_FETCH_TIMEOUT_MS, type ToolSpec } from "./spec";

type SetVercelEnvVarsInput = {
  projectId: string;
  envVars: Array<{
    key: string;
    value: string;
    target: string[];
    type?: "plain" | "encrypted" | "sensitive";
  }>;
};

type SetVercelEnvVarsOutput = {
  results: unknown[];
};

export const setVercelEnvVarsTool: ToolSpec<
  SetVercelEnvVarsInput,
  SetVercelEnvVarsOutput
> = {
  name: "set_vercel_env_vars",
  description: "Create Vercel environment variables for a project.",
  inputSchema: z
    .object({
      projectId: z.string().min(1),
      envVars: z.array(
        z
          .object({
            key: z.string().min(1),
            value: z.string(),
            target: z.array(z.string().min(1)).min(1),
            type: z.enum(["plain", "encrypted", "sensitive"]).optional(),
          })
          .strict(),
      ),
    })
    .strict(),
  outputSchema: z.object({ results: z.array(z.unknown()) }).strict(),
  async execute({ projectId, envVars }) {
    const token = await getVercelAccessToken();

    const payload = envVars.map((envVar) => ({
      key: envVar.key,
      value: envVar.value,
      target: envVar.target,
      type: envVar.type ?? "plain",
    }));

    const response = await fetchWithRetry(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/env?upsert=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
      },
      "set_vercel_env_vars",
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Vercel env var batch creation failed: ${response.status} ${response.statusText} - ${errorText}. attemptedKeys=[${payload
          .map((item) => item.key)
          .join(", ")}]`,
      );
    }

    const json = (await response.json()) as unknown;
    return { results: Array.isArray(json) ? json : [json] };
  },
};
