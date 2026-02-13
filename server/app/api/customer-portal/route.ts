import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../lib/auth";
import { db } from "../../lib/db";
import { polar } from "../../lib/polar";
import { subscriptions } from "../../lib/schema";

function statusFromError(error: unknown): number {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("authorization") || message.includes("token")) {
    return 401;
  }
  return 500;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1);

    if (!subscription?.polarCustomerId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    const session = await polar.customerSessions.create({
      customerId: subscription.polarCustomerId,
    });

    return NextResponse.json({ portalUrl: session.customerPortalUrl });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: statusFromError(error) },
    );
  }
}
