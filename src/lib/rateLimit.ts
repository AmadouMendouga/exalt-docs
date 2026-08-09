import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const MAX_TENTATIVES = 5;
export const DUREE_BLOCAGE_MINUTES = 15;

export type EtatBlocage = { bloque: false } | { bloque: true; debloqueLe: Date };

export async function verifierBlocage(params: {
  documentId: string;
  ip?: string | null;
}): Promise<EtatBlocage> {
  const { documentId, ip } = params;

  let requete = supabaseAdmin()
    .from("journal")
    .select("horodatage")
    .eq("document_id", documentId)
    .eq("evenement", "echec")
    .order("horodatage", { ascending: false })
    .limit(MAX_TENTATIVES);

  if (ip) {
    requete = requete.eq("ip", ip);
  }

  const { data, error } = await requete;
  if (error) {
    console.error("Échec de lecture du journal :", error.message);
    return { bloque: false };
  }

  if (!data || data.length < MAX_TENTATIVES) {
    return { bloque: false };
  }

  const plusAncienne = data[data.length - 1];
  const debloqueLe = new Date(
    new Date(plusAncienne.horodatage).getTime() + DUREE_BLOCAGE_MINUTES * 60_000
  );

  if (debloqueLe <= new Date()) {
    return { bloque: false };
  }

  return { bloque: true, debloqueLe };
}

export function extraireIp(headers: Headers): string | null {
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return headers.get("x-real-ip");
}
