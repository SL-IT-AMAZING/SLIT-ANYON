import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { planToProductId, polar } from "../_shared/polar.ts";
import { verifyAuth } from "../_shared/supabase.ts";

function isAuthError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("authorization") ||
    normalized.includes("invalid or expired token") ||
    normalized.includes("missing or invalid authorization header") ||
    normalized.includes("invalid token")
  );
}

interface CheckoutBody {
  planId?: string;
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

    let body: CheckoutBody;
    try {
      body = (await req.json()) as CheckoutBody;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const planId = body.planId;
    if (!planId) {
      return new Response(JSON.stringify({ error: "Missing planId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const productId = planToProductId(planId);
    if (!productId) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const edgeFunctionsUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1";
    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user.email,
      metadata: {
        supabaseUserId: user.id,
      },
      successUrl: `${edgeFunctionsUrl}/checkout-success`,
    });

    return new Response(JSON.stringify({ checkoutUrl: checkout.url }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
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
