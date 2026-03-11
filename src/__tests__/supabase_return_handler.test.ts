import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readSettings, writeSettings } from "@/main/settings";
import {
  listSupabaseOrganizations,
  refreshSupabaseToken,
} from "@/supabase_admin/supabase_management_client";
import {
  buildSupabaseOrganizationCredentials,
  exchangeSupabaseOAuthCode,
  handleSupabaseOAuthReturn,
  normalizeLegacySupabaseCredentialsIfNeeded,
} from "@/supabase_admin/supabase_return_handler";

vi.mock("@/main/settings", () => ({
  readSettings: vi.fn(),
  writeSettings: vi.fn(),
}));

vi.mock("@/supabase_admin/supabase_management_client", () => ({
  listSupabaseOrganizations: vi.fn(),
  refreshSupabaseToken: vi.fn(),
}));

vi.mock("@/lib/oauthConfig", () => ({
  oauthEndpoints: {
    supabase: {
      exchange: "https://oauth.test/api/oauth/supabase/exchange",
    },
  },
}));

describe("supabase_return_handler", () => {
  const mockReadSettings = vi.mocked(readSettings);
  const mockWriteSettings = vi.mocked(writeSettings);
  const mockListSupabaseOrganizations = vi.mocked(listSupabaseOrganizations);
  const mockRefreshSupabaseToken = vi.mocked(refreshSupabaseToken);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds org credentials for every organization slug", () => {
    const credentials = buildSupabaseOrganizationCredentials({
      organizationSlugs: ["org-a", "org-b"],
      accessToken: "access-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
      tokenTimestamp: 123,
    });

    expect(credentials).toEqual({
      "org-a": {
        accessToken: { value: "access-token" },
        refreshToken: { value: "refresh-token" },
        expiresIn: 3600,
        tokenTimestamp: 123,
      },
      "org-b": {
        accessToken: { value: "access-token" },
        refreshToken: { value: "refresh-token" },
        expiresIn: 3600,
        tokenTimestamp: 123,
      },
    });
  });

  it("stores credentials for every returned organization and clears legacy fields", async () => {
    mockReadSettings.mockReturnValue({
      supabase: {
        organizations: {
          existing: {
            accessToken: { value: "existing-access" },
            refreshToken: { value: "existing-refresh" },
            expiresIn: 100,
            tokenTimestamp: 1,
          },
        },
      },
    } as never);
    mockListSupabaseOrganizations.mockResolvedValue([
      { id: "1", name: "Org A", slug: "org-a" },
      { id: "2", name: "Org B", slug: "org-b" },
    ]);

    await handleSupabaseOAuthReturn({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresIn: 7200,
    });

    expect(mockWriteSettings).toHaveBeenCalledWith({
      supabase: expect.objectContaining({
        accessToken: undefined,
        refreshToken: undefined,
        expiresIn: undefined,
        tokenTimestamp: undefined,
        organizations: expect.objectContaining({
          existing: {
            accessToken: { value: "existing-access" },
            refreshToken: { value: "existing-refresh" },
            expiresIn: 100,
            tokenTimestamp: 1,
          },
          "org-a": expect.objectContaining({
            accessToken: { value: "new-access" },
            refreshToken: { value: "new-refresh" },
            expiresIn: 7200,
          }),
          "org-b": expect.objectContaining({
            accessToken: { value: "new-access" },
            refreshToken: { value: "new-refresh" },
            expiresIn: 7200,
          }),
        }),
      }),
    });
  });

  it("exchanges a Supabase OAuth code before writing credentials", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: "exchanged-access",
        refreshToken: "exchanged-refresh",
        expiresIn: 3600,
      }),
    } as Response);
    mockReadSettings.mockReturnValue({ supabase: {} } as never);
    mockListSupabaseOrganizations.mockResolvedValue([
      { id: "1", name: "Org A", slug: "org-a" },
    ]);

    await handleSupabaseOAuthReturn({ code: "oauth-code" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth.test/api/oauth/supabase/exchange",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(mockWriteSettings).toHaveBeenCalled();
  });

  it("throws when no organizations are returned", async () => {
    mockReadSettings.mockReturnValue({ supabase: {} } as never);
    mockListSupabaseOrganizations.mockResolvedValue([]);

    await expect(
      handleSupabaseOAuthReturn({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 3600,
      }),
    ).rejects.toThrow(/No Supabase organizations/);
    expect(mockWriteSettings).not.toHaveBeenCalled();
  });

  it("normalizes legacy credentials into organization credentials when needed", async () => {
    mockReadSettings
      .mockReturnValueOnce({
        supabase: {
          accessToken: { value: "legacy-access" },
          refreshToken: { value: "legacy-refresh" },
          expiresIn: 3600,
        },
      } as never)
      .mockReturnValueOnce({
        supabase: {
          accessToken: { value: "fresh-access" },
          refreshToken: { value: "fresh-refresh" },
          expiresIn: 7200,
        },
      } as never)
      .mockReturnValue({ supabase: {} } as never);
    mockListSupabaseOrganizations.mockResolvedValue([
      { id: "1", name: "Org A", slug: "org-a" },
    ]);

    await normalizeLegacySupabaseCredentialsIfNeeded();

    expect(mockRefreshSupabaseToken).toHaveBeenCalledOnce();
    expect(mockWriteSettings).toHaveBeenCalled();
  });

  it("exchangeSupabaseOAuthCode rejects invalid response payloads", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: "only-access-token" }),
    } as Response);

    await expect(exchangeSupabaseOAuthCode("oauth-code")).rejects.toThrow(
      /Invalid Supabase OAuth exchange response/,
    );
  });
});
