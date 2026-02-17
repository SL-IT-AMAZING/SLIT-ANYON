import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { polar } from "../_shared/polar.ts";
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

const ZERO_USAGE = {
  creditsUsed: 0,
  creditsLimit: 0,
  resetAt: null,
  overageRate: null,
};

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

    try {
      const customers = await polar.customers.list({
        query: user.id,
      });

      const customer = customers.result.items[0];
      if (!customer) {
        return new Response(JSON.stringify(ZERO_USAGE), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const meters = await polar.customerMeters.list({
        customerId: customer.id,
      });

      const meterData = meters.result.items[0];
      if (!meterData) {
        return new Response(JSON.stringify(ZERO_USAGE), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      return new Response(
        JSON.stringify({
          creditsUsed: meterData.consumedUnits,
          creditsLimit: meterData.creditedUnits,
          resetAt: null,
          overageRate: null,
        }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    } catch (polarError) {
      console.error("Failed to fetch Polar meter data:", polarError);
      return new Response(JSON.stringify(ZERO_USAGE), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
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
