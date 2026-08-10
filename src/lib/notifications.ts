import "server-only";
import { env } from "@/lib/env";

const VERSION_API_GRAPH = "v21.0";

/**
 * Point d'entrée unique pour l'envoi de notifications.
 *
 * Phase 1 (fallback) : si les identifiants Meta Cloud API ne sont pas
 * configurés, construit un lien wa.me pré-rempli, ouvert manuellement par
 * la personne de l'institut.
 * Phase 2 : si WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID /
 * WHATSAPP_TEMPLATE_NAME sont définis, envoie le message automatiquement
 * via l'API Graph de Meta, avec un template pré-approuvé (obligatoire pour
 * une conversation initiée par l'entreprise — aucun texte libre autorisé).
 *
 * Seul ce fichier connaît le mode d'envoi actif ; aucun autre fichier ne
 * doit dépendre de wa.me ou de l'API Graph directement.
 */

export type ParametresAccesDocument = {
  prenom: string;
  titre: string;
  lien: string;
  code: string;
};

export type ResultatEnvoi =
  | { mode: "api"; idMessage: string }
  | { mode: "lien-manuel"; url: string };

export class ErreurEnvoiWhatsapp extends Error {
  status: number;
  corps: unknown;

  constructor(status: number, corps: unknown) {
    super(`Échec de l'envoi WhatsApp (HTTP ${status})`);
    this.name = "ErreurEnvoiWhatsapp";
    this.status = status;
    this.corps = corps;
  }
}

function apiGraphConfiguree(): boolean {
  return Boolean(
    env.whatsappToken && env.whatsappPhoneNumberId && env.whatsappTemplateName
  );
}

export async function envoyerNotification(
  destinataire: string,
  params: ParametresAccesDocument
): Promise<ResultatEnvoi> {
  if (!apiGraphConfiguree()) {
    return { mode: "lien-manuel", url: construireLienWhatsapp(destinataire, messageAccesDocument(params)) };
  }

  const numeroDestinataire = destinataire.replace(/[^\d+]/g, "").replace(/^\+/, "");

  const reponse = await fetch(
    `https://graph.facebook.com/${VERSION_API_GRAPH}/${env.whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.whatsappToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numeroDestinataire,
        type: "template",
        template: {
          name: env.whatsappTemplateName,
          language: { code: env.whatsappTemplateLang ?? "fr" },
          components: [
            {
              type: "body",
              parameters: [params.prenom, params.titre, params.lien, params.code].map((texte) => ({
                type: "text",
                text: texte,
              })),
            },
          ],
        },
      }),
    }
  );

  const corps = await reponse.json().catch(() => null);

  if (!reponse.ok) {
    throw new ErreurEnvoiWhatsapp(reponse.status, corps);
  }

  const idMessage = corps?.messages?.[0]?.id ?? "";
  return { mode: "api", idMessage };
}

export function construireLienWhatsapp(numero: string, message: string): string {
  const numeroNettoye = numero.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const texte = encodeURIComponent(message);
  return `https://wa.me/${numeroNettoye}?text=${texte}`;
}

export function messageAccesDocument(params: ParametresAccesDocument): string {
  const { prenom, titre, code, lien } = params;
  return `Bonjour ${prenom},

Votre ${titre} Exalt Institut est disponible.
Consultez-le ici : ${lien}
Code d'accès :

${code}

Ce code est personnel. Ne le communiquez à personne.

Exalt Institut — Yassa, Nkolmbong
(+237) 691 927 372`;
}

export function lienNotificationInstitut(titre: string, clientNom: string): string {
  const message = `Nouveau document créé pour ${clientNom} : ${titre}.`;
  return construireLienWhatsapp(env.institutWhatsapp, message);
}
