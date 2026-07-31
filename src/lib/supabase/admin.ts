import { createClient } from "@supabase/supabase-js";

// Cliente com a service_role key — só pode ser usado em código de servidor
// (Route Handlers, Server Actions). Nunca importar isso num Client Component.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
