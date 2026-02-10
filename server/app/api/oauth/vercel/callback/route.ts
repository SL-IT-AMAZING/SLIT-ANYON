import { type NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "../../../../lib/oauth-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("vercel_oauth_state")?.value;
  const codeVerifier = request.cookies.get("vercel_code_verifier")?.value;

  if (!code || !state) {
    return new NextResponse("Missing code or state", { status: 400 });
  }

  if (state !== storedState) {
    return new NextResponse("Invalid state parameter", { status: 400 });
  }

  if (!codeVerifier) {
    return new NextResponse("Missing PKCE code verifier", { status: 400 });
  }

  try {
    const tokenData = await exchangeCodeForToken(
      "https://api.vercel.com/login/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        client_id: process.env.VERCEL_CLIENT_ID!,
        client_secret: process.env.VERCEL_CLIENT_SECRET!,
        redirect_uri: `${process.env.OAUTH_SERVER_URL}/api/oauth/vercel/callback`,
        code_verifier: codeVerifier,
      },
    );

    const deepLinkUrl = new URL("anyon://vercel-oauth-return");
    deepLinkUrl.searchParams.set("token", tokenData.access_token);
    deepLinkUrl.searchParams.set("refreshToken", tokenData.refresh_token);
    deepLinkUrl.searchParams.set("expiresIn", String(tokenData.expires_in));

    const response = NextResponse.redirect(deepLinkUrl.toString());
    response.cookies.delete("vercel_oauth_state");
    response.cookies.delete("vercel_code_verifier");
    return response;
  } catch {
    return new NextResponse("Token exchange failed", { status: 500 });
  }
}
