import { describe, expect, it } from "vitest";
import {
  hasLegacySupabaseCredentials,
  hasSupabaseOrganizationCredential,
  hasSupabaseOrganizations,
  isSupabaseConnected,
} from "@/lib/schemas";

describe("Supabase connection helpers", () => {
  it("returns false for null settings", () => {
    expect(isSupabaseConnected(null)).toBe(false);
    expect(hasSupabaseOrganizations(null)).toBe(false);
    expect(hasLegacySupabaseCredentials(null)).toBe(false);
  });

  it("treats organization-backed credentials as connected", () => {
    const settings = {
      supabase: {
        organizations: {
          "org-a": {
            accessToken: { value: "access-token" },
            refreshToken: { value: "refresh-token" },
            expiresIn: 3600,
            tokenTimestamp: 100,
          },
        },
      },
    };

    expect(hasSupabaseOrganizations(settings as never)).toBe(true);
    expect(hasSupabaseOrganizationCredential(settings as never, "org-a")).toBe(
      true,
    );
    expect(isSupabaseConnected(settings as never)).toBe(true);
  });

  it("treats legacy credentials as connected for migration purposes", () => {
    const settings = {
      supabase: {
        accessToken: { value: "legacy-access" },
        refreshToken: { value: "legacy-refresh" },
      },
    };

    expect(hasLegacySupabaseCredentials(settings as never)).toBe(true);
    expect(isSupabaseConnected(settings as never)).toBe(true);
    expect(hasSupabaseOrganizations(settings as never)).toBe(false);
  });

  it("requires a matching organization slug for org-backed access", () => {
    const settings = {
      supabase: {
        organizations: {
          "org-a": {
            accessToken: { value: "access-token" },
            refreshToken: { value: "refresh-token" },
            expiresIn: 3600,
            tokenTimestamp: 100,
          },
        },
      },
    };

    expect(hasSupabaseOrganizationCredential(settings as never, "org-a")).toBe(
      true,
    );
    expect(hasSupabaseOrganizationCredential(settings as never, "org-b")).toBe(
      false,
    );
    expect(hasSupabaseOrganizationCredential(settings as never, null)).toBe(
      false,
    );
  });
});
