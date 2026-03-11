import { readSettings, writeSettings } from "../main/settings";
import { listSupabaseOrganizations } from "./supabase_management_client";
import { refreshSupabaseToken } from "./supabase_management_client";
import log from "electron-log";
import { oauthEndpoints } from "@/lib/oauthConfig";
import type { SupabaseOrganizationCredentials } from "@/lib/schemas";

const logger = log.scope("supabase_return_handler");

export interface SupabaseOAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export type SupabaseOAuthReturnParams =
  | SupabaseOAuthTokens
  | {
      code: string;
    };

function isCodeFlow(
  params: SupabaseOAuthReturnParams,
): params is { code: string } {
  return "code" in params;
}

export function buildSupabaseOrganizationCredentials(params: {
  organizationSlugs: string[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenTimestamp?: number;
}): Record<string, SupabaseOrganizationCredentials> {
  const tokenTimestamp = params.tokenTimestamp ?? Math.floor(Date.now() / 1000);

  return Object.fromEntries(
    params.organizationSlugs.map((organizationSlug) => [
      organizationSlug,
      {
        accessToken: {
          value: params.accessToken,
        },
        refreshToken: {
          value: params.refreshToken,
        },
        expiresIn: params.expiresIn,
        tokenTimestamp,
      },
    ]),
  );
}

export async function exchangeSupabaseOAuthCode(
  code: string,
): Promise<SupabaseOAuthTokens> {
  const response = await fetch(oauthEndpoints.supabase.exchange, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to exchange Supabase OAuth code: ${response.statusText}`,
    );
  }

  const payload = (await response.json()) as Partial<SupabaseOAuthTokens>;
  if (
    !payload.accessToken ||
    !payload.refreshToken ||
    typeof payload.expiresIn !== "number"
  ) {
    throw new Error("Invalid Supabase OAuth exchange response");
  }

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresIn: payload.expiresIn,
  };
}

export async function normalizeLegacySupabaseCredentialsIfNeeded() {
  const settings = readSettings();
  const hasOrganizations =
    Object.keys(settings.supabase?.organizations ?? {}).length > 0;
  const hasLegacyCredentials =
    !!settings.supabase?.accessToken?.value &&
    !!settings.supabase?.refreshToken?.value &&
    typeof settings.supabase?.expiresIn === "number";

  if (hasOrganizations || !hasLegacyCredentials) {
    return;
  }

  await refreshSupabaseToken();

  const refreshedSettings = readSettings();
  const accessToken = refreshedSettings.supabase?.accessToken?.value;
  const refreshToken = refreshedSettings.supabase?.refreshToken?.value;
  const expiresIn = refreshedSettings.supabase?.expiresIn;

  if (!accessToken || !refreshToken || typeof expiresIn !== "number") {
    throw new Error("Supabase legacy credentials are incomplete after refresh");
  }

  await handleSupabaseOAuthReturn({
    accessToken,
    refreshToken,
    expiresIn,
  });
}

export async function handleSupabaseOAuthReturn({
  ...params
}: SupabaseOAuthReturnParams) {
  const tokens = isCodeFlow(params)
    ? await exchangeSupabaseOAuthCode(params.code)
    : params;
  const settings = readSettings();
  const organizations = await listSupabaseOrganizations(tokens.accessToken);

  if (organizations.length === 0) {
    throw new Error(
      "No Supabase organizations were returned for the authenticated account.",
    );
  }

  const existingOrgs = settings.supabase?.organizations ?? {};
  const nextOrganizations = {
    ...existingOrgs,
    ...buildSupabaseOrganizationCredentials({
      organizationSlugs: organizations.map((organization) => organization.slug),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    }),
  };

  writeSettings({
    supabase: {
      ...settings.supabase,
      accessToken: undefined,
      refreshToken: undefined,
      expiresIn: undefined,
      tokenTimestamp: undefined,
      organizations: nextOrganizations,
    },
  });

  logger.info(
    `Stored Supabase credentials for ${organizations.length} organization(s).`,
  );
}
