import { type NextRequest, NextResponse } from "next/server";

function buildSupabaseDeepLink(code: string): URL {
  const deepLinkUrl = new URL("anyon://supabase-oauth-return");
  deepLinkUrl.searchParams.set("code", code);
  return deepLinkUrl;
}

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
    const response = NextResponse.redirect(
      buildSupabaseDeepLink(code).toString(),
    );
    response.cookies.delete("supabase_oauth_state");
    return response;
  } catch (error) {
    console.error("Supabase OAuth callback redirect failed", error);
    return new NextResponse("Token exchange failed", { status: 500 });
  }
}
