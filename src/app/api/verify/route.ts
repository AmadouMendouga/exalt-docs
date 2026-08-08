import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, DOCUMENTS_BUCKET } from "@/lib/supabase/admin";
import { verifierCode } from "@/lib/codeAcces";
import { consigner } from "@/lib/journal";
import { estBloque, extraireIp, DUREE_BLOCAGE_MINUTES } from "@/lib/rateLimit";

const DUREE_URL_SIGNEE_SECONDES = 300; // 5 minutes

export async function POST(request: NextRequest) {
  const ip = extraireIp(request.headers);

  let body: { slug?: unknown; code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erreur: "requete_invalide" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

  if (!slug || !code) {
    return NextResponse.json({ erreur: "requete_invalide" }, { status: 400 });
  }

  const supabase = supabaseAdmin();
  const { data: document } = await supabase
    .from("documents")
    .select("id, code_acces, fichier_path, date_expiration, actif")
    .eq("slug", slug)
    .maybeSingle();

  if (!document) {
    // Ne pas distinguer "document inexistant" de "code incorrect".
    return NextResponse.json({ erreur: "code_incorrect" }, { status: 401 });
  }

  if (!document.actif) {
    await consigner({ documentId: document.id, evenement: "tentative", ip });
    return NextResponse.json({ erreur: "revoque" }, { status: 403 });
  }

  if (document.date_expiration && new Date(document.date_expiration) < new Date()) {
    await consigner({ documentId: document.id, evenement: "tentative", ip });
    return NextResponse.json({ erreur: "expire" }, { status: 403 });
  }

  if (await estBloque({ documentId: document.id, ip })) {
    await consigner({ documentId: document.id, evenement: "tentative", ip });
    return NextResponse.json(
      { erreur: "trop_de_tentatives", dureeBlocageMinutes: DUREE_BLOCAGE_MINUTES },
      { status: 429 }
    );
  }

  const codeValide = await verifierCode(code, document.code_acces);

  if (!codeValide) {
    await consigner({ documentId: document.id, evenement: "echec", ip });
    return NextResponse.json({ erreur: "code_incorrect" }, { status: 401 });
  }

  const { data: urlSignee, error: erreurUrl } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.fichier_path, DUREE_URL_SIGNEE_SECONDES);

  if (erreurUrl || !urlSignee) {
    console.error("Échec de génération de l'URL signée :", erreurUrl?.message);
    return NextResponse.json({ erreur: "indisponible" }, { status: 500 });
  }

  await consigner({ documentId: document.id, evenement: "succes", ip });

  return NextResponse.json({ url: urlSignee.signedUrl });
}
