import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { ingestTokenUsage } from "../_shared/credits.ts";
import { verifyAuth } from "../_shared/supabase.ts";

interface IngestBody {
  rawTokens: number;
  modelId: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const user = await verifyAuth(req);

    let body: IngestBody;
    try {
      body = (await req.json()) as IngestBody;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (typeof body.rawTokens !== "number" || body.rawTokens <= 0) {
      return new Response(
        JSON.stringify({ error: "rawTokens must be a positive number" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    if (!body.modelId || typeof body.modelId !== "string") {
      return new Response(JSON.stringify({ error: "modelId is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    await ingestTokenUsage(user.id, body.rawTokens, body.modelId);

    return new Response(JSON.stringify({ ingested: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof Error &&
      error.message.toLowerCase().includes("authorization")
        ? 401
        : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
