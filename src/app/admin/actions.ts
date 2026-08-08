"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { COOKIE_SESSION, creerJetonSession } from "@/lib/session";
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
