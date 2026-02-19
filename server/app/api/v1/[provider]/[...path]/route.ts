import type { NextRequest } from "next/server";
import { handleProxyRequest } from "../../../../lib/proxy";

export const runtime = "edge";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string; path: string[] }> },
) {
  const { provider, path } = await params;
  return handleProxyRequest(request, provider, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
