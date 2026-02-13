import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("ANYON_SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("ANYON_SUPABASE_SERVICE_KEY")!;

let serviceClient: ReturnType<typeof createClient> | null = null;

export function getServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return serviceClient;
}

export interface AuthUser {
  id: string;
  email?: string;
}

export async function verifyAuth(request: Request): Promise<AuthUser> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }
  const token = authHeader.slice(7);
  const supabase = getServiceClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error("Invalid or expired token");
  }
  return { id: user.id, email: user.email };
}
