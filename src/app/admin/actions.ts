"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { COOKIE_SESSION, creerJetonSession } from "@/lib/session";
import { genererCodeAcces, hacherCode } from "@/lib/codeAcces";
import { consigner } from "@/lib/journal";
import { construireLienWhatsapp, messageAccesDocument } from "@/lib/notifications";
import { env } from "@/lib/env";

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

export type ResultatRegeneration =
  | { succes: true; code: string; lienWhatsapp: string }
  | { succes: false; erreur: string };

export async function regenererCode(id: string): Promise<ResultatRegeneration> {
  const supabase = supabaseAdmin();

  const { data: document, error: erreurLecture } = await supabase
    .from("documents")
    .select("titre, client_nom, client_whatsapp")
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

  const prenom = document.client_nom.split(" ")[0];
  const message = messageAccesDocument({ prenom, titre: document.titre, code });

  return {
    succes: true,
    code,
    lienWhatsapp: construireLienWhatsapp(document.client_whatsapp, message),
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
