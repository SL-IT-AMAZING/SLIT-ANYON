import {
  WebhookVerificationError,
  validateEvent,
} from "npm:@polar-sh/sdk/webhooks";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { POLAR_WEBHOOK_SECRET, productIdToPlan } from "../_shared/polar.ts";
import { getServiceClient } from "../_shared/supabase.ts";

function toDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

function getMetadataUserId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>).supabaseUserId;
  return typeof value === "string" && value.length > 0 ? value : null;
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
    const body = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    let event: ReturnType<typeof validateEvent> extends Promise<infer T>
      ? T
      : never;
    try {
      event = validateEvent(body, headers, POLAR_WEBHOOK_SECRET);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          },
        );
      }
      throw error;
    }

    const supabase = getServiceClient();

    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const sub = event.data;
        const userId = getMetadataUserId(sub.metadata);

        if (!userId) {
          console.error("Webhook missing supabaseUserId in metadata");
          return new Response(JSON.stringify({ error: "Missing user ID" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const { error } = await supabase.from("subscriptions").upsert(
          {
            id: sub.id,
            user_id: userId,
            email: sub.customer?.email ?? null,
            plan: productIdToPlan(sub.productId),
            status: sub.status,
            polar_customer_id: sub.customerId,
            polar_product_id: sub.productId,
            current_period_start: toDate(sub.currentPeriodStart),
            current_period_end: toDate(sub.currentPeriodEnd),
            cancel_at_period_end: sub.cancelAtPeriodEnd ?? false,
            credits_limit: 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );

        if (error) {
          console.error("Failed to upsert subscription:", error);
          return new Response(JSON.stringify({ error: "Database error" }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        break;
      }

      case "subscription.revoked": {
        const sub = event.data;
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", sub.id);

        if (error) {
          console.error("Failed to update subscription:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
