import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { polar } from "../_shared/polar.ts";
import { getServiceClient, verifyAuth } from "../_shared/supabase.ts";

function isNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("404") || message.includes("not found");
}

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
      .maybeSingle();

    if (dbError) {
      return new Response(
        JSON.stringify({ error: "Failed to load subscription" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    let customerId = subscription?.polar_customer_id ?? null;

    if (!customerId) {
      try {
        const customer = await polar.customers.getExternal({
          externalId: user.id,
        });
        customerId = customer.id;
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }

        if (!user.email) {
          return new Response(
            JSON.stringify({ error: "No active subscription found" }),
            {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }

        const customer = await polar.customers.create({
          externalId: user.id,
          email: user.email,
        });
        customerId = customer.id;
      }
    }

    if (
      subscription?.id &&
      customerId &&
      customerId !== subscription.polar_customer_id
    ) {
      await supabase
        .from("subscriptions")
        .update({
          polar_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);
    }

    const session = await polar.customerSessions.create({
      customerId,
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
      isAuthError(error.message)
        ? 401
        : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
