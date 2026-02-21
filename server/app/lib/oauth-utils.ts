import crypto from "node:crypto";

export function generateState(): string {
  return crypto.randomUUID();
}

export function generatePKCE(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export async function exchangeCodeForToken(
  tokenUrl: string,
  params: Record<string, string>,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  team_id?: string;
  installation_id?: string;
}> {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token exchange failed (${response.status}): ${errorText}`);
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  tokenUrl: string,
  params: Record<string, string>,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Token refresh failed (${response.status}): ${errorText}`);
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  return response.json();
}
