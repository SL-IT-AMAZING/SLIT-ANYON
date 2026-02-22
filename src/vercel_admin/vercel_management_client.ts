import log from "electron-log";
import { withLock } from "../ipc/utils/lock_utils";
import { oauthEndpoints } from "../lib/oauthConfig";
import { readSettings, writeSettings } from "../main/settings";
import { refreshDeviceToken } from "./vercel_device_auth";

const logger = log.scope("vercel_management_client");

function isTokenExpired(expiresIn?: number): boolean {
  if (!expiresIn) return true;

  const settings = readSettings();
  const tokenTimestamp = settings.vercel?.tokenTimestamp || 0;
  const currentTime = Math.floor(Date.now() / 1000);

  return currentTime >= tokenTimestamp + expiresIn - 300;
}

export async function refreshVercelToken(): Promise<void> {
  const settings = readSettings();
  const vercelSettings = settings.vercel;
  const accessToken = vercelSettings?.accessToken?.value;
  const refreshToken = settings.vercel?.refreshToken?.value;

  if (!accessToken || !isTokenExpired(vercelSettings?.expiresIn)) {
    return;
  }

  if (!refreshToken) {
    throw new Error(
      "Vercel refresh token not found. Please authenticate first.",
    );
  }

  try {
    const isLegacyIntegration = !!vercelSettings?.installationId;

    let nextAccessToken: string;
    let nextRefreshToken: string;
    let nextExpiresIn: number;

    if (isLegacyIntegration) {
      const response = await fetch(oauthEndpoints.vercel.refresh, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error(`Vercel token refresh failed: ${response.statusText}`);
      }

      const {
        accessToken: refreshedAccessToken,
        refreshToken: refreshedRefreshToken,
        expiresIn,
      } = await response.json();

      nextAccessToken = refreshedAccessToken;
      nextRefreshToken = refreshedRefreshToken;
      nextExpiresIn = expiresIn;
    } else {
      const refreshed = await refreshDeviceToken(refreshToken);
      if (!refreshed.refresh_token) {
        throw new Error("Vercel refresh did not return a refresh token.");
      }

      nextAccessToken = refreshed.access_token;
      nextRefreshToken = refreshed.refresh_token;
      nextExpiresIn = refreshed.expires_in;
    }

    writeSettings({
      vercel: {
        ...vercelSettings,
        accessToken: {
          value: nextAccessToken,
        },
        refreshToken: {
          value: nextRefreshToken,
        },
        expiresIn: nextExpiresIn,
        tokenTimestamp: Math.floor(Date.now() / 1000),
        authMethod:
          vercelSettings?.authMethod ??
          (isLegacyIntegration ? "oauth" : "device"),
      },
    });
  } catch (error) {
    logger.error("Error refreshing Vercel token:", error);
    throw error;
  }
}

export async function getVercelAccessToken(): Promise<string> {
  const settings = readSettings();
  const vercelSettings = settings.vercel;

  const oauthToken = vercelSettings?.accessToken?.value;
  const legacyToken = settings.vercelAccessToken?.value;

  if (oauthToken) {
    const expiresIn = vercelSettings?.expiresIn;
    const hasRefreshToken = !!vercelSettings?.refreshToken?.value;

    if (expiresIn && hasRefreshToken && isTokenExpired(expiresIn)) {
      await withLock("refresh-vercel-token", refreshVercelToken);
      const updatedSettings = readSettings();
      const newToken = updatedSettings.vercel?.accessToken?.value;
      if (!newToken) {
        throw new Error("Failed to refresh Vercel access token");
      }
      return newToken;
    }
    return oauthToken;
  }

  if (legacyToken) {
    return legacyToken;
  }

  throw new Error("Vercel access token not found. Please authenticate first.");
}

export function getVercelTeamId(): string | null {
  const settings = readSettings();
  return settings.vercel?.teamId ?? null;
}
