import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role client for privileged operations (creating Auth users, etc.)
// that must bypass RLS. Server-only — never import this from a Client
// Component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
