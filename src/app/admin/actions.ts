"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin, DOCUMENTS_BUCKET } from "@/lib/supabase/admin";
import { COOKIE_SESSION, creerJetonSession } from "@/lib/session";
import { genererCodeAcces, hacherCode } from "@/lib/codeAcces";
import { consigner } from "@/lib/journal";
import {
  construireLienWhatsapp,
  envoyerNotification,
  ErreurEnvoiWhatsapp,
  messageAccesDocument,
  ResultatEnvoi,
} from "@/lib/notifications";
import { genererQrPngDataUrl } from "@/lib/qr";
import { env } from "@/lib/env";

const DUREE_URL_SIGNEE_SECONDES = 300;

export async function revoquerDocument(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await supabaseAdmin()
    .from("documents")
    .update({ actif: false })
    .eq("id", id);

  if (error) {
    console.error("Échec de révocation :", error.message);
  }

  revalidatePath("/admin");
}

export type ResultatUrlDocument =
  | { succes: true; url: string }
  | { succes: false; erreur: string };

export async function obtenirUrlDocument(id: string): Promise<ResultatUrlDocument> {
  const supabase = supabaseAdmin();

  const { data: document, error: erreurLecture } = await supabase
    .from("documents")
    .select("fichier_path")
    .eq("id", id)
    .single();

  if (erreurLecture || !document) {
    return { succes: false, erreur: "Document introuvable." };
  }

  const { data: urlSignee, error: erreurUrl } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(document.fichier_path, DUREE_URL_SIGNEE_SECONDES);

  if (erreurUrl || !urlSignee) {
    return { succes: false, erreur: "Échec de génération du lien." };
  }

  return { succes: true, url: urlSignee.signedUrl };
}

export async function supprimerDocument(id: string): Promise<void> {
  const supabase = supabaseAdmin();

  const { data: document } = await supabase
    .from("documents")
    .select("fichier_path")
    .eq("id", id)
    .single();

  if (document) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.fichier_path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) {
    console.error("Échec de suppression :", error.message);
  }

  revalidatePath("/admin");
}

export type ResultatRegeneration =
  | { succes: true; slug: string; code: string; qrDataUrl: string; envoiWhatsapp: ResultatEnvoi }
  | { succes: false; erreur: string };

export async function regenererCode(id: string): Promise<ResultatRegeneration> {
  const supabase = supabaseAdmin();

  const { data: document, error: erreurLecture } = await supabase
    .from("documents")
    .select("slug, titre, client_nom, client_whatsapp")
    .eq("id", id)
    .single();

  if (erreurLecture || !document) {
    return { succes: false, erreur: "Document introuvable." };
  }

  const code = genererCodeAcces();
  const codeHache = await hacherCode(code);

  const { error: erreurMaj } = await supabase
    .from("documents")
    .update({ code_acces: codeHache })
    .eq("id", id);

  if (erreurMaj) {
    console.error("Échec de régénération du code :", erreurMaj.message);
    return { succes: false, erreur: "Échec de la mise à jour du code." };
  }

  await consigner({ documentId: id, evenement: "creation" });
  revalidatePath("/admin");

  const urlPublique = `${env.siteUrl}/d/${document.slug}`;
  const qrDataUrl = await genererQrPngDataUrl(urlPublique);
  const prenom = document.client_nom.split(" ")[0];

  let envoiWhatsapp: ResultatEnvoi;
  try {
    envoiWhatsapp = await envoyerNotification(document.client_whatsapp, {
      prenom,
      titre: document.titre,
      lien: urlPublique,
      code,
    });
  } catch (erreur) {
    if (erreur instanceof ErreurEnvoiWhatsapp) {
      console.error("Échec de l'envoi WhatsApp automatique :", erreur.status);
    } else {
      console.error("Échec de l'envoi WhatsApp automatique.");
    }
    const message = messageAccesDocument({
      prenom,
      titre: document.titre,
      code,
      lien: urlPublique,
    });
    envoiWhatsapp = {
      mode: "lien-manuel",
      url: construireLienWhatsapp(document.client_whatsapp, message),
    };
  }

  return {
    succes: true,
    slug: document.slug,
    code,
    qrDataUrl,
    envoiWhatsapp,
  };
}

export async function connexionAdmin(formData: FormData) {
  const motDePasse = String(formData.get("mot_de_passe") ?? "");

  if (motDePasse !== env.adminPassword) {
    redirect("/admin/login?erreur=1");
  }

  const jeton = await creerJetonSession();
  const store = await cookies();
  store.set(COOKIE_SESSION, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}

export async function deconnexionAdmin() {
  const store = await cookies();
  store.delete(COOKIE_SESSION);
  redirect("/admin/login");
}
