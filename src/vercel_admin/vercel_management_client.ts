import { withLock } from "../ipc/utils/lock_utils";
import { readSettings, writeSettings } from "../main/settings";
import { oauthEndpoints } from "../lib/oauthConfig";
import log from "electron-log";

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
  const refreshToken = settings.vercel?.refreshToken?.value;

  if (!isTokenExpired(settings.vercel?.expiresIn)) {
    return;
  }

  if (!refreshToken) {
    throw new Error(
      "Vercel refresh token not found. Please authenticate first.",
    );
  }

  try {
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
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    } = await response.json();

    writeSettings({
      vercel: {
        accessToken: {
          value: accessToken,
        },
        refreshToken: {
          value: newRefreshToken,
        },
        expiresIn,
        tokenTimestamp: Math.floor(Date.now() / 1000),
      },
    });
  } catch (error) {
    logger.error("Error refreshing Vercel token:", error);
    throw error;
  }
}

export async function getVercelAccessToken(): Promise<string> {
  const settings = readSettings();

  // Prefer new OAuth tokens over legacy manual token
  const oauthToken = settings.vercel?.accessToken?.value;
  const legacyToken = settings.vercelAccessToken?.value;

  if (oauthToken) {
    const expiresIn = settings.vercel?.expiresIn;
    if (isTokenExpired(expiresIn)) {
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
