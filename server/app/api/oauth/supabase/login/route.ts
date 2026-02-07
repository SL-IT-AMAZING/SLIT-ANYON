import { NextResponse } from "next/server";
import { generateState } from "../../../../lib/oauth-utils";

export async function GET() {
  const state = generateState();

  const authUrl = new URL("https://api.supabase.com/v1/oauth/authorize");
  authUrl.searchParams.set("client_id", process.env.SUPABASE_CLIENT_ID!);
  authUrl.searchParams.set(
    "redirect_uri",
    `${process.env.OAUTH_SERVER_URL}/api/oauth/supabase/callback`,
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set("supabase_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/api/oauth/supabase/callback",
  });

  return response;
}
