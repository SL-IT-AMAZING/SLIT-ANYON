import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../lib/auth";
import { db } from "../../lib/db";
import { subscriptions } from "../../lib/schema";

function statusFromError(error: unknown): number {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("authorization") || message.includes("token")) {
    return 401;
  }
  return 500;
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1);

    if (!subscription) {
      return NextResponse.json({
        plan: "free",
        isActive: false,
        expiresAt: null,
        polarSubscriptionId: null,
        syncedAt: new Date().toISOString(),
      });
    }

    const isActive =
      subscription.status === "active" || subscription.status === "trialing";

    return NextResponse.json({
      plan: subscription.plan,
      isActive,
      expiresAt: subscription.currentPeriodEnd?.toISOString() ?? null,
      polarSubscriptionId: subscription.id,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: statusFromError(error) },
    );
  }
}
