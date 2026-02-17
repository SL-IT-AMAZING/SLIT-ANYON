import { z } from "zod";
import { fetchWithRetry } from "@/ipc/utils/retryWithRateLimit";
import { getVercelAccessToken } from "@/vercel_admin/vercel_management_client";
import { TOOL_FETCH_TIMEOUT_MS, type ToolSpec } from "./spec";

type AddVercelDomainInput = {
  projectId: string;
  domain: string;
};

type AddVercelDomainOutput = {
  result: unknown;
};

export const addVercelDomainTool: ToolSpec<
  AddVercelDomainInput,
  AddVercelDomainOutput
> = {
  name: "add_vercel_domain",
  description: "Add a domain to a Vercel project.",
  inputSchema: z
    .object({ projectId: z.string().min(1), domain: z.string().min(1) })
    .strict(),
  outputSchema: z.object({ result: z.unknown() }).strict(),
  async execute({ projectId, domain }) {
    const token = await getVercelAccessToken();

    const response = await fetchWithRetry(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(projectId)}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
        signal: AbortSignal.timeout(TOOL_FETCH_TIMEOUT_MS),
      },
      "add_vercel_domain",
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Vercel domain creation failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return { result: (await response.json()) as unknown };
  },
};
