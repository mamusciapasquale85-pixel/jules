import { createClient } from "@supabase/supabase-js";

/**
 * Client avec la clé service : contourne le RLS.
 * À n'utiliser que côté serveur, pour l'import CSV, la connexion élève et les tâches planifiées.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
