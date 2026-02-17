import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.ANYON_SUPABASE_URL!;
const supabaseServiceKey = process.env.ANYON_SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error("Invalid or expired token");
  }

  return {
    id: user.id,
    email: user.email,
  };
}
