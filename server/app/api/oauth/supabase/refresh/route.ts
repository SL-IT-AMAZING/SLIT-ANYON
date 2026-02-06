import { type NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "../../../../lib/oauth-utils";

export async function POST(request: NextRequest) {
  const { refreshToken } = await request.json();

  if (!refreshToken) {
    return NextResponse.json(
      { error: "Missing refreshToken" },
      { status: 400 },
    );
  }

  try {
    const tokenData = await refreshAccessToken(
      "https://api.supabase.com/v1/oauth/token",
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.SUPABASE_CLIENT_ID!,
        client_secret: process.env.SUPABASE_CLIENT_SECRET!,
      },
    );

    return NextResponse.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });
  } catch {
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 },
    );
  }
}
