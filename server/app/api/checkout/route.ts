import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../lib/auth";
import { planToProductId, polar } from "../../lib/polar";

interface CheckoutBody {
  planId?: string;
}

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

    let body: CheckoutBody;
    try {
      body = (await request.json()) as CheckoutBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const planId = body.planId;

    if (!planId) {
      return NextResponse.json({ error: "Missing planId" }, { status: 400 });
    }

    const productId = planToProductId(planId ?? "");
    if (!productId) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user.email,
      metadata: {
        supabaseUserId: user.id,
      },
      successUrl: "anyon://checkout-success",
    });

    return NextResponse.json({ checkoutUrl: checkout.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: statusFromError(error) },
    );
  }
}
