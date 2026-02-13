import { type NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "../../../lib/auth";
import { ingestTokenUsage } from "../../../lib/credits";

interface IngestBody {
  rawTokens: number;
  modelId: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    let body: IngestBody;
    try {
      body = (await request.json()) as IngestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body.rawTokens !== "number" || body.rawTokens <= 0) {
      return NextResponse.json(
        { error: "rawTokens must be a positive number" },
        { status: 400 },
      );
    }

    if (!body.modelId || typeof body.modelId !== "string") {
      return NextResponse.json(
        { error: "modelId is required" },
        { status: 400 },
      );
    }

    await ingestTokenUsage(user.id, body.rawTokens, body.modelId);

    return NextResponse.json({ ingested: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof Error &&
      error.message.toLowerCase().includes("authorization")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
