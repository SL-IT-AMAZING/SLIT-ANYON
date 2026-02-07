import { NextResponse } from "next/server";
import { generateState } from "../../../../lib/oauth-utils";

export async function GET() {
  const state = generateState();

  const authUrl = new URL("https://oauth2.neon.tech/oauth2/auth");
  authUrl.searchParams.set("client_id", process.env.NEON_CLIENT_ID!);
  authUrl.searchParams.set(
    "redirect_uri",
    `${process.env.OAUTH_SERVER_URL}/api/oauth/neon/callback`,
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set(
    "scope",
    "openid offline offline_access urn:neoncloud:projects:create urn:neoncloud:projects:read urn:neoncloud:projects:update urn:neoncloud:projects:delete urn:neoncloud:orgs:read",
  );
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("neon_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/api/oauth/neon/callback",
  });

  return response;
}
