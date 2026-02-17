import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { getServiceClient, verifyAuth } from "../_shared/supabase.ts";

function isAuthError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("authorization") ||
    normalized.includes("invalid or expired token") ||
    normalized.includes("missing or invalid authorization header") ||
    normalized.includes("invalid token")
  );
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const user = await verifyAuth(req);
    const supabase = getServiceClient();

    const { data: subscription, error: dbError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (dbError || !subscription) {
      return new Response(
        JSON.stringify({
          plan: "free",
          isActive: false,
          expiresAt: null,
          polarSubscriptionId: null,
          syncedAt: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const isActive =
      subscription.status === "active" || subscription.status === "trialing";

    return new Response(
      JSON.stringify({
        plan: subscription.plan,
        isActive,
        expiresAt: subscription.current_period_end ?? null,
        polarSubscriptionId: subscription.id,
        syncedAt: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof Error && isAuthError(error.message) ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
