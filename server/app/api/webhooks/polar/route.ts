// eslint-disable-next-line import/no-unresolved
import {
  WebhookVerificationError,
  validateEvent,
} from "@polar-sh/sdk/webhooks";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { POLAR_WEBHOOK_SECRET, productIdToPlan } from "../../../lib/polar";
import { subscriptions } from "../../../lib/schema";

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  return value instanceof Date ? value : new Date(value);
}

function getMetadataUserId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const value = (metadata as Record<string, unknown>).supabaseUserId;
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    let event;
    try {
      event = validateEvent(body, headers, POLAR_WEBHOOK_SECRET);
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 403 },
        );
      }
      throw error;
    }

    switch (event.type) {
      case "subscription.created":
      case "subscription.updated": {
        const sub = event.data;
        const userId = getMetadataUserId(sub.metadata);

        if (!userId) {
          console.error("Webhook missing supabaseUserId in metadata");
          return NextResponse.json(
            { error: "Missing user ID" },
            { status: 400 },
          );
        }

        await db
          .insert(subscriptions)
          .values({
            id: sub.id,
            userId,
            email: sub.customer?.email ?? null,
            plan: productIdToPlan(sub.productId),
            status: sub.status,
            polarCustomerId: sub.customerId,
            polarProductId: sub.productId,
            currentPeriodStart: toDate(sub.currentPeriodStart),
            currentPeriodEnd: toDate(sub.currentPeriodEnd),
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
            creditsLimit: 0,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: subscriptions.id,
            set: {
              status: sub.status,
              currentPeriodStart: toDate(sub.currentPeriodStart),
              currentPeriodEnd: toDate(sub.currentPeriodEnd),
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
              updatedAt: new Date(),
            },
          });
        break;
      }

      case "subscription.revoked": {
        const sub = event.data;
        await db
          .update(subscriptions)
          .set({
            status: "canceled",
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, sub.id));
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
