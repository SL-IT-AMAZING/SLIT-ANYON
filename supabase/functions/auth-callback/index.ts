import { corsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "Missing code parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const loopbackUrl = `http://127.0.0.1:38765/auth/callback?code=${encodeURIComponent(code)}`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: loopbackUrl,
      "Cache-Control": "no-store",
      ...corsHeaders,
    },
  });
});
