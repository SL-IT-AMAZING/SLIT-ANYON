import { corsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const html = `<!DOCTYPE html>
<html>
  <head><title>Payment Complete</title></head>
  <body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc">
    <div style="text-align:center">
      <p style="font-size:1.25rem;color:#334155">Returning to ANYON...</p>
      <p style="font-size:0.875rem;color:#94a3b8">If nothing happens, you can close this tab.</p>
    </div>
    <script>window.location.href="anyon://checkout-success";</script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders,
    },
  });
});
