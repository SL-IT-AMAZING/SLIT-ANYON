import { type NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "../../../../lib/oauth-utils";

export async function POST(request: NextRequest) {
  const { code } = await request.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const tokenData = await exchangeCodeForToken(
      "https://api.supabase.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        client_id: process.env.SUPABASE_CLIENT_ID!.trim(),
        client_secret: process.env.SUPABASE_CLIENT_SECRET!.trim(),
        redirect_uri: `${process.env.OAUTH_SERVER_URL!.trim()}/api/oauth/supabase/callback`,
      },
    );

    return NextResponse.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });
  } catch (error) {
    console.error("Supabase OAuth code exchange failed", error);
    return NextResponse.json(
      { error: "Token exchange failed" },
      { status: 500 },
    );
  }
}
