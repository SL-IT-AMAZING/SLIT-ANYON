import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { polar } from "../_shared/polar.ts";
import { getServiceClient, verifyAuth } from "../_shared/supabase.ts";

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
    const supabase = getServiceClient();

    const { data: subscription, error: dbError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (dbError || !subscription?.polar_customer_id) {
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const session = await polar.customerSessions.create({
      customerId: subscription.polar_customer_id,
    });

    return new Response(
      JSON.stringify({ portalUrl: session.customerPortalUrl }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
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
