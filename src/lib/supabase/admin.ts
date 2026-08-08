import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Client Supabase avec la clé service_role : contourne le RLS.
 * Ne doit jamais être importé depuis un composant client ni exposé au navigateur.
 */
export function supabaseAdmin() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const DOCUMENTS_BUCKET = "documents";
