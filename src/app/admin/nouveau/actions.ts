"use server";

import { supabaseAdmin, DOCUMENTS_BUCKET } from "@/lib/supabase/admin";
import { genererSlug } from "@/lib/slug";
import { genererCodeAcces, hacherCode } from "@/lib/codeAcces";
import { genererQrPngDataUrl } from "@/lib/qr";
import { consigner } from "@/lib/journal";
import {
  construireLienWhatsapp,
  envoyerNotification,
  ErreurEnvoiWhatsapp,
  lienNotificationInstitut,
  messageAccesDocument,
  ResultatEnvoi,
} from "@/lib/notifications";
import { env } from "@/lib/env";

export type ResultatCreation =
  | { succes: true; document: DocumentCree }
  | { succes: false; erreur: string };

export type DocumentCree = {
  slug: string;
  code: string;
  urlPublique: string;
  qrDataUrl: string;
  envoiWhatsapp: ResultatEnvoi;
  lienNotificationInstitut: string;
};

export async function creerDocument(formData: FormData): Promise<ResultatCreation> {
  const titre = String(formData.get("titre") ?? "").trim();
  const clientNom = String(formData.get("client_nom") ?? "").trim();
  const clientWhatsapp = String(formData.get("client_whatsapp") ?? "").trim();
  const dateExpirationBrute = String(formData.get("date_expiration") ?? "").trim();
  const fichier = formData.get("fichier");

  if (!titre || !clientNom || !clientWhatsapp) {
    return { succes: false, erreur: "Tous les champs obligatoires doivent être remplis." };
  }

  if (!(fichier instanceof File) || fichier.size === 0) {
    return { succes: false, erreur: "Veuillez sélectionner un fichier PDF." };
  }

  if (fichier.type !== "application/pdf") {
    return { succes: false, erreur: "Le fichier doit être un PDF." };
  }

  const dateExpiration = dateExpirationBrute
    ? new Date(`${dateExpirationBrute}T23:59:59.999Z`).toISOString()
    : null;

  const slug = genererSlug();
  const code = genererCodeAcces();
  const codeHache = await hacherCode(code);
  const cheminFichier = `${slug}/document.pdf`;

  const supabase = supabaseAdmin();

  const { error: erreurUpload } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(cheminFichier, fichier, { contentType: "application/pdf", upsert: false });

  if (erreurUpload) {
    console.error("Échec de l'upload :", erreurUpload.message);
    return { succes: false, erreur: "Échec de l'envoi du fichier PDF." };
  }

  const { data: document, error: erreurInsertion } = await supabase
    .from("documents")
    .insert({
      slug,
      titre,
      client_nom: clientNom,
      client_whatsapp: clientWhatsapp,
      code_acces: codeHache,
      fichier_path: cheminFichier,
      date_expiration: dateExpiration,
      actif: true,
    })
    .select("id")
    .single();

  if (erreurInsertion || !document) {
    console.error("Échec de création du document :", erreurInsertion?.message);
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([cheminFichier]);
    return { succes: false, erreur: "Échec de l'enregistrement du document." };
  }

  await consigner({ documentId: document.id, evenement: "creation" });

  const urlPublique = `${env.siteUrl}/d/${slug}`;
  const qrDataUrl = await genererQrPngDataUrl(urlPublique);
  const prenom = clientNom.split(" ")[0];

  let envoiWhatsapp: ResultatEnvoi;
  try {
    envoiWhatsapp = await envoyerNotification(clientWhatsapp, {
      prenom,
      titre,
      lien: urlPublique,
      code,
    });
  } catch (erreur) {
    if (erreur instanceof ErreurEnvoiWhatsapp) {
      console.error("Échec de l'envoi WhatsApp automatique :", erreur.status);
    } else {
      console.error("Échec de l'envoi WhatsApp automatique.");
    }
    const message = messageAccesDocument({ prenom, titre, code, lien: urlPublique });
    envoiWhatsapp = { mode: "lien-manuel", url: construireLienWhatsapp(clientWhatsapp, message) };
  }

  return {
    succes: true,
    document: {
      slug,
      code,
      urlPublique,
      qrDataUrl,
      envoiWhatsapp,
      lienNotificationInstitut: lienNotificationInstitut(titre, clientNom),
    },
  };
}
