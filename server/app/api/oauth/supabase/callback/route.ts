import { type NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "../../../../lib/oauth-utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("supabase_oauth_state")?.value;

  if (!code || !state) {
    return new NextResponse("Missing code or state", { status: 400 });
  }

  if (state !== storedState) {
    return new NextResponse("Invalid state parameter", { status: 400 });
  }

  try {
    const tokenData = await exchangeCodeForToken(
      "https://api.supabase.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        client_id: process.env.SUPABASE_CLIENT_ID!,
        client_secret: process.env.SUPABASE_CLIENT_SECRET!,
        redirect_uri: `${process.env.OAUTH_SERVER_URL}/api/oauth/supabase/callback`,
      },
    );

    const deepLinkUrl = new URL("dyad://supabase-oauth-return");
    deepLinkUrl.searchParams.set("token", tokenData.access_token);
    deepLinkUrl.searchParams.set("refreshToken", tokenData.refresh_token);
    deepLinkUrl.searchParams.set("expiresIn", String(tokenData.expires_in));

    const response = NextResponse.redirect(deepLinkUrl.toString());
    response.cookies.delete("supabase_oauth_state");
    return response;
  } catch {
    return new NextResponse("Token exchange failed", { status: 500 });
  }
}
