import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Evenement = "creation" | "tentative" | "succes" | "echec";

export async function consigner(params: {
  documentId: string;
  evenement: Evenement;
  ip?: string | null;
}) {
  const { documentId, evenement, ip } = params;
  const { error } = await supabaseAdmin()
    .from("journal")
    .insert({ document_id: documentId, evenement, ip: ip ?? null });

  if (error) {
    console.error("Échec d'écriture dans le journal :", error.message);
  }
}

export async function compterEvenementsRecents(params: {
  documentId: string;
  evenement: Evenement;
  depuis: Date;
  ip?: string | null;
}): Promise<number> {
  const { documentId, evenement, depuis, ip } = params;
  let requete = supabaseAdmin()
    .from("journal")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId)
    .eq("evenement", evenement)
    .gte("horodatage", depuis.toISOString());

  if (ip) {
    requete = requete.eq("ip", ip);
  }

  const { count, error } = await requete;
  if (error) {
    console.error("Échec de lecture du journal :", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function compterConsultations(documentId: string): Promise<number> {
  const { count, error } = await supabaseAdmin()
    .from("journal")
    .select("id", { count: "exact", head: true })
    .eq("document_id", documentId)
    .eq("evenement", "succes");

  if (error) {
    console.error("Échec de lecture du journal :", error.message);
    return 0;
  }
  return count ?? 0;
}
