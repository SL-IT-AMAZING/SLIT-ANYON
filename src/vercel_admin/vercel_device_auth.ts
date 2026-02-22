import log from "electron-log";

const logger = log.scope("vercel_device_auth");

const VERCEL_ISSUER = "https://vercel.com";
const VERCEL_CLI_CLIENT_ID = "cl_HYyOPBNtFMfHhaUn9L4QPfTZz6TP47bp";
const DEVICE_AUTH_SCOPE = "openid offline_access";

interface OpenIdConfigurationResponse {
  token_endpoint: string;
  device_authorization_endpoint: string;
}

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface TokenErrorResponse {
  error?: string;
  error_description?: string;
}

export interface VercelTokenSet {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

type DeviceAuthErrorCode =
  | "authorization_pending"
  | "slow_down"
  | "expired_token"
  | "access_denied"
  | "error";

export class DeviceAuthError extends Error {
  readonly code: DeviceAuthErrorCode;
  readonly nextInterval?: number;

  constructor(
    code: DeviceAuthErrorCode,
    message: string,
    nextInterval?: number,
  ) {
    super(message);
    this.name = "DeviceAuthError";
    this.code = code;
    this.nextInterval = nextInterval;
  }
}

let cachedOpenIdConfiguration: OpenIdConfigurationResponse | null = null;

async function getOpenIdConfiguration(): Promise<OpenIdConfigurationResponse> {
  if (cachedOpenIdConfiguration) {
    return cachedOpenIdConfiguration;
  }

  const discoveryUrl = `${VERCEL_ISSUER}/.well-known/openid-configuration`;
  logger.debug(`Fetching OpenID configuration from ${discoveryUrl}`);

  const response = await fetch(discoveryUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to discover Vercel OpenID endpoints: ${response.status} ${response.statusText}`,
    );
  }

  const payload =
    (await response.json()) as Partial<OpenIdConfigurationResponse>;
  if (!payload.token_endpoint || !payload.device_authorization_endpoint) {
    throw new Error("Vercel OpenID configuration missing required endpoints.");
  }

  cachedOpenIdConfiguration = {
    token_endpoint: payload.token_endpoint,
    device_authorization_endpoint: payload.device_authorization_endpoint,
  };

  return cachedOpenIdConfiguration;
}

async function parseTokenError(
  response: Response,
): Promise<TokenErrorResponse> {
  try {
    return (await response.json()) as TokenErrorResponse;
  } catch {
    return { error_description: response.statusText };
  }
}

export async function requestDeviceCode(): Promise<DeviceCodeResponse> {
  const { device_authorization_endpoint } = await getOpenIdConfiguration();

  const body = new URLSearchParams({
    client_id: VERCEL_CLI_CLIENT_ID,
    scope: DEVICE_AUTH_SCOPE,
  });

  logger.debug("Requesting Vercel device code");

  const response = await fetch(device_authorization_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorPayload = await parseTokenError(response);
    throw new Error(
      `Failed to request Vercel device code: ${errorPayload.error_description || response.statusText}`,
    );
  }

  return (await response.json()) as DeviceCodeResponse;
}

export async function pollForToken(
  deviceCode: string,
  interval: number,
  expiresAt: number,
): Promise<VercelTokenSet> {
  if (Date.now() >= expiresAt) {
    throw new DeviceAuthError(
      "expired_token",
      "The device authorization code has expired.",
    );
  }

  const { token_endpoint } = await getOpenIdConfiguration();
  const body = new URLSearchParams({
    client_id: VERCEL_CLI_CLIENT_ID,
    grant_type: "urn:ietf:params:oauth:grant-type:device_code",
    device_code: deviceCode,
  });

  const response = await fetch(token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (response.ok) {
    return (await response.json()) as VercelTokenSet;
  }

  const errorPayload = await parseTokenError(response);
  const message =
    errorPayload.error_description || "Vercel device auth failed.";

  switch (errorPayload.error) {
    case "authorization_pending":
      throw new DeviceAuthError("authorization_pending", message, interval);
    case "slow_down":
      throw new DeviceAuthError("slow_down", message, interval + 5);
    case "expired_token":
      throw new DeviceAuthError("expired_token", message);
    case "access_denied":
      throw new DeviceAuthError("access_denied", message);
    default:
      throw new DeviceAuthError("error", message);
  }
}

export async function refreshDeviceToken(
  refreshToken: string,
): Promise<VercelTokenSet> {
  const { token_endpoint } = await getOpenIdConfiguration();
  const body = new URLSearchParams({
    client_id: VERCEL_CLI_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  logger.debug("Refreshing Vercel device token");

  const response = await fetch(token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const errorPayload = await parseTokenError(response);
    throw new Error(
      `Failed to refresh Vercel device token: ${errorPayload.error_description || response.statusText}`,
    );
  }

  return (await response.json()) as VercelTokenSet;
}
