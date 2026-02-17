import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/vercel_admin/vercel_management_client", () => ({
  getVercelAccessToken: vi.fn().mockResolvedValue("vercel-token"),
}));

vi.mock("@/main/settings", () => ({
  readSettings: vi.fn().mockReturnValue({
    supabase: {
      accessToken: {
        value: "supabase-token",
      },
    },
  }),
}));

vi.mock("@/supabase_admin/supabase_management_client", () => ({
  refreshSupabaseToken: vi.fn().mockResolvedValue(undefined),
}));

describe("set_vercel_env_vars hardening", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a single batched request with upsert=true", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify([{ id: "env-1" }]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { setVercelEnvVarsTool } = await import("@/agent/tools/set_vercel_env_vars");

    const result = await setVercelEnvVarsTool.execute({
      projectId: "project-123",
      envVars: [
        { key: "A", value: "1", target: ["development"] },
        { key: "B", value: "2", target: ["preview"], type: "encrypted" },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v10/projects/project-123/env?upsert=true");
    expect(init.method).toBe("POST");
    expect(typeof init.body).toBe("string");

    const parsedBody = JSON.parse(init.body as string) as Array<Record<string, unknown>>;
    expect(parsedBody).toEqual([
      { key: "A", value: "1", target: ["development"], type: "plain" },
      { key: "B", value: "2", target: ["preview"], type: "encrypted" },
    ]);

    expect(result.results).toEqual([{ id: "env-1" }]);
  });

  it("returns attempted keys in error message on batch failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("bad request", {
        status: 400,
        statusText: "Bad Request",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { setVercelEnvVarsTool } = await import("@/agent/tools/set_vercel_env_vars");

    await expect(
      setVercelEnvVarsTool.execute({
        projectId: "project-123",
        envVars: [
          { key: "NEXT_PUBLIC_SUPABASE_URL", value: "x", target: ["production"] },
          { key: "SUPABASE_ANON_KEY", value: "y", target: ["production"] },
        ],
      }),
    ).rejects.toThrow(/attemptedKeys=\[NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY\]/);
  });
});

describe("manage_secrets hardening", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to per-secret delete when bulk delete is unsupported", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 405, statusText: "Method Not Allowed" }))
      .mockResolvedValueOnce(new Response("", { status: 200, statusText: "OK" }))
      .mockResolvedValueOnce(new Response("", { status: 200, statusText: "OK" }));
    vi.stubGlobal("fetch", fetchMock);

    const { manageSecretsTool } = await import("@/agent/tools/manage_secrets");

    const result = await manageSecretsTool.execute({
      projectRef: "proj-ref",
      remove: ["ONE", "TWO"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain("/v1/projects/proj-ref/secrets/ONE");
    expect(fetchMock.mock.calls[2][0]).toContain("/v1/projects/proj-ref/secrets/TWO");
    expect(result.removeResult).toEqual({
      mode: "per-secret",
      results: [
        { name: "ONE", status: 200 },
        { name: "TWO", status: 200 },
      ],
    });
  });
});
