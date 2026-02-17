#!/usr/bin/env node

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 504);
}

async function parseBody(response: Response): Promise<string> {
  const text = await response.text();
  return text.length > 500 ? `${text.slice(0, 500)}...` : text;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  context: string,
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!shouldRetry(response.status) || attempt === MAX_RETRIES) {
        return response;
      }

      const backoffMs = Math.min(1_000 * 2 ** (attempt - 1), 8_000);
      await sleep(backoffMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = new Error(`${context}: ${message}`);
      if (attempt === MAX_RETRIES) {
        throw lastError;
      }

      const backoffMs = Math.min(1_000 * 2 ** (attempt - 1), 8_000);
      await sleep(backoffMs);
    }
  }

  throw lastError ?? new Error(`${context}: request failed`);
}

function buildVercelUrl(
  pathname: string,
  teamId: string | undefined,
  extraParams?: Record<string, string>,
): string {
  const url = new URL(`https://api.vercel.com${pathname}`);
  if (teamId) {
    url.searchParams.set("teamId", teamId);
  }
  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function pass(name: string, detail: string): CheckResult {
  return { name, ok: true, detail };
}

function fail(name: string, detail: string): CheckResult {
  return { name, ok: false, detail };
}

async function run(): Promise<number> {
  const writeMode = process.argv.includes("--write");
  const supabaseToken = process.env.SUPABASE_ACCESS_TOKEN;
  const vercelToken = process.env.VERCEL_ACCESS_TOKEN;
  const supabaseProjectRef = process.env.SUPABASE_PROJECT_REF;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  const results: CheckResult[] = [];

  if (!supabaseToken || !vercelToken) {
    console.error("Missing required env vars: SUPABASE_ACCESS_TOKEN and VERCEL_ACCESS_TOKEN");
    return 1;
  }

  if (writeMode && (!supabaseProjectRef || !vercelProjectId)) {
    console.error("--write mode requires SUPABASE_PROJECT_REF and VERCEL_PROJECT_ID");
    return 1;
  }

  try {
    const supabaseProjectsRes = await fetchWithRetry(
      "https://api.supabase.com/v1/projects",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${supabaseToken}`,
          "Content-Type": "application/json",
        },
      },
      "supabase_list_projects",
    );

    if (!supabaseProjectsRes.ok) {
      const body = await parseBody(supabaseProjectsRes);
      results.push(
        fail(
          "read.supabase.projects",
          `${supabaseProjectsRes.status} ${supabaseProjectsRes.statusText} ${body}`,
        ),
      );
    } else {
      results.push(pass("read.supabase.projects", "Supabase token accepted"));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push(fail("read.supabase.projects", message));
  }

  try {
    const vercelProjectsRes = await fetchWithRetry(
      buildVercelUrl("/v9/projects", vercelTeamId, { limit: "1" }),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/json",
        },
      },
      "vercel_list_projects",
    );

    if (!vercelProjectsRes.ok) {
      const body = await parseBody(vercelProjectsRes);
      results.push(
        fail(
          "read.vercel.projects",
          `${vercelProjectsRes.status} ${vercelProjectsRes.statusText} ${body}`,
        ),
      );
    } else {
      results.push(pass("read.vercel.projects", "Vercel token accepted"));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push(fail("read.vercel.projects", message));
  }

  if (writeMode) {
    const runId = Date.now().toString(36);
    const secretName = `ANYON_POC_SECRET_${runId}`;
    const envKey = `ANYON_POC_ENV_${runId.toUpperCase()}`;
    let createdVercelEnvId: string | null = null;

    try {
      const upsertSecretRes = await fetchWithRetry(
        `https://api.supabase.com/v1/projects/${encodeURIComponent(supabaseProjectRef!)}/secrets`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ name: secretName, value: `poc-${runId}` }]),
        },
        "supabase_upsert_secret",
      );

      if (!upsertSecretRes.ok) {
        const body = await parseBody(upsertSecretRes);
        results.push(
          fail(
            "write.supabase.secret.upsert",
            `${upsertSecretRes.status} ${upsertSecretRes.statusText} ${body}`,
          ),
        );
      } else {
        results.push(pass("write.supabase.secret.upsert", `Created ${secretName}`));
      }

      const removeSecretBulkRes = await fetchWithRetry(
        `https://api.supabase.com/v1/projects/${encodeURIComponent(supabaseProjectRef!)}/secrets`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${supabaseToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([secretName]),
        },
        "supabase_remove_secret_bulk",
      );

      if (!removeSecretBulkRes.ok && (removeSecretBulkRes.status === 404 || removeSecretBulkRes.status === 405)) {
        const removeSecretSingleRes = await fetchWithRetry(
          `https://api.supabase.com/v1/projects/${encodeURIComponent(supabaseProjectRef!)}/secrets/${encodeURIComponent(secretName)}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${supabaseToken}`,
              "Content-Type": "application/json",
            },
          },
          "supabase_remove_secret_single",
        );

        if (!removeSecretSingleRes.ok) {
          const body = await parseBody(removeSecretSingleRes);
          results.push(
            fail(
              "write.supabase.secret.remove",
              `${removeSecretSingleRes.status} ${removeSecretSingleRes.statusText} ${body}`,
            ),
          );
        } else {
          results.push(pass("write.supabase.secret.remove", `Removed ${secretName}`));
        }
      } else if (!removeSecretBulkRes.ok) {
        const body = await parseBody(removeSecretBulkRes);
        results.push(
          fail(
            "write.supabase.secret.remove",
            `${removeSecretBulkRes.status} ${removeSecretBulkRes.statusText} ${body}`,
          ),
        );
      } else {
        results.push(pass("write.supabase.secret.remove", `Removed ${secretName}`));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push(fail("write.supabase.secret", message));
    }

    try {
      const createEnvRes = await fetchWithRetry(
        buildVercelUrl(`/v10/projects/${encodeURIComponent(vercelProjectId!)}/env`, vercelTeamId, {
          upsert: "true",
        }),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              key: envKey,
              value: `poc-${runId}`,
              target: ["development"],
              type: "plain",
            },
          ]),
        },
        "vercel_create_env",
      );

      if (!createEnvRes.ok) {
        const body = await parseBody(createEnvRes);
        results.push(
          fail(
            "write.vercel.env.create",
            `${createEnvRes.status} ${createEnvRes.statusText} ${body}`,
          ),
        );
      } else {
        results.push(pass("write.vercel.env.create", `Created ${envKey}`));
      }

      const listEnvRes = await fetchWithRetry(
        buildVercelUrl(`/v9/projects/${encodeURIComponent(vercelProjectId!)}/env`, vercelTeamId),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${vercelToken}`,
            "Content-Type": "application/json",
          },
        },
        "vercel_list_env",
      );

      if (!listEnvRes.ok) {
        const body = await parseBody(listEnvRes);
        results.push(
          fail("write.vercel.env.verify", `${listEnvRes.status} ${listEnvRes.statusText} ${body}`),
        );
      } else {
        const json = (await listEnvRes.json()) as {
          envs?: Array<{ id: string; key: string }>;
        };
        const found = json.envs?.find((envVar) => envVar.key === envKey);
        if (!found) {
          results.push(fail("write.vercel.env.verify", `${envKey} not found in project env list`));
        } else {
          createdVercelEnvId = found.id;
          results.push(pass("write.vercel.env.verify", `${envKey} found`));
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push(fail("write.vercel.env", message));
    }

    if (createdVercelEnvId) {
      try {
        const deleteEnvRes = await fetchWithRetry(
          buildVercelUrl(
            `/v9/projects/${encodeURIComponent(vercelProjectId!)}/env/${encodeURIComponent(createdVercelEnvId)}`,
            vercelTeamId,
          ),
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              "Content-Type": "application/json",
            },
          },
          "vercel_delete_env",
        );

        if (!deleteEnvRes.ok) {
          const body = await parseBody(deleteEnvRes);
          results.push(
            fail(
              "write.vercel.env.cleanup",
              `${deleteEnvRes.status} ${deleteEnvRes.statusText} ${body}`,
            ),
          );
        } else {
          results.push(pass("write.vercel.env.cleanup", `Deleted env id ${createdVercelEnvId}`));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push(fail("write.vercel.env.cleanup", message));
      }
    }
  }

  for (const result of results) {
    const prefix = result.ok ? "PASS" : "FAIL";
    console.log(`[${prefix}] ${result.name} - ${result.detail}`);
  }

  const failedCount = results.filter((result) => !result.ok).length;
  console.log(`\nSummary: ${results.length - failedCount}/${results.length} checks passed`);

  return failedCount === 0 ? 0 : 1;
}

run()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`[FAIL] verifier.crash - ${message}`);
    process.exit(1);
  });
