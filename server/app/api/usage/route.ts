import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../lib/auth";
import { polar } from "../../lib/polar";

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

    try {
      const customers = await polar.customers.list({
        query: user.id,
      });

      const customer = customers.result.items[0];
      if (!customer) {
        return NextResponse.json({
          creditsUsed: 0,
          creditsLimit: 0,
          resetAt: null,
          overageRate: null,
        });
      }

      const meters = await polar.customerMeters.list({
        customerId: customer.id,
      });

      const meterData = meters.result.items[0];
      if (!meterData) {
        return NextResponse.json({
          creditsUsed: 0,
          creditsLimit: 0,
          resetAt: null,
          overageRate: null,
        });
      }

      return NextResponse.json({
        creditsUsed: meterData.consumedUnits,
        creditsLimit: meterData.creditedUnits,
        resetAt: null,
        overageRate: null,
      });
    } catch (polarError) {
      console.error("Failed to fetch Polar meter data:", polarError);
      return NextResponse.json({
        creditsUsed: 0,
        creditsLimit: 0,
        resetAt: null,
        overageRate: null,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: statusFromError(error) },
    );
  }
}
