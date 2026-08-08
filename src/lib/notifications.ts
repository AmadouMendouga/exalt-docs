import "server-only";
import { env } from "@/lib/env";

/**
 * Point d'entrée unique pour l'envoi de notifications.
 *
 * Phase 1 : ne fait qu'assembler un lien wa.me pré-rempli, ouvert manuellement
 * par la personne de l'institut (aucun envoi automatique).
 * Phase 2 : lorsque le compte Meta Business Cloud API sera prêt, seule cette
 * fonction devra être modifiée (appel HTTP à l'API Meta) — aucun autre
 * fichier de l'application ne dépend du mode d'envoi.
 */
export async function envoyerNotification(
  destinataire: string,
  message: string
): Promise<{ mode: "lien-manuel"; url: string }> {
  return {
    mode: "lien-manuel",
    url: construireLienWhatsapp(destinataire, message),
  };
}

export function construireLienWhatsapp(numero: string, message: string): string {
  const numeroNettoye = numero.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const texte = encodeURIComponent(message);
  return `https://wa.me/${numeroNettoye}?text=${texte}`;
}

export function messageAccesDocument(params: {
  prenom: string;
  titre: string;
  code: string;
}): string {
  const { prenom, titre, code } = params;
  return `Bonjour ${prenom},

Votre ${titre} Exalt Institut est disponible.
Scannez le QR code figurant sur votre bon, puis saisissez ce code d'accès :

${code}

Ce code est personnel. Ne le communiquez à personne.

Exalt Institut — Yassa, Nkolmbong
(+237) 691 927 372`;
}

export function lienNotificationInstitut(titre: string, clientNom: string): string {
  const message = `Nouveau document créé pour ${clientNom} : ${titre}.`;
  return construireLienWhatsapp(env.institutWhatsapp, message);
}
