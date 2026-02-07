import { NextResponse } from "next/server";
import { generateState, generatePKCE } from "../../../../lib/oauth-utils";

export async function GET() {
  const state = generateState();
  const { codeVerifier, codeChallenge } = generatePKCE();

  const authUrl = new URL("https://vercel.com/oauth/authorize");
  authUrl.searchParams.set("client_id", process.env.VERCEL_CLIENT_ID!);
  authUrl.searchParams.set(
    "redirect_uri",
    `${process.env.OAUTH_SERVER_URL}/api/oauth/vercel/callback`,
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("vercel_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/api/oauth/vercel/callback",
  });
  response.cookies.set("vercel_code_verifier", codeVerifier, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/api/oauth/vercel/callback",
  });

  return response;
}
