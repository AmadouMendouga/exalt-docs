import "server-only";
import { env } from "@/lib/env";

// Utilise la Web Crypto API (disponible en runtime Node et Edge) pour que
// ce module reste utilisable depuis le middleware.

export const COOKIE_SESSION = "exalt_admin_session";
const DUREE_SESSION_MS = 12 * 60 * 60 * 1000; // 12 heures

async function importerCle(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signer(valeur: string): Promise<string> {
  const cle = await importerCle(env.adminPassword);
  const signatureBuf = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(valeur));
  return Buffer.from(signatureBuf).toString("hex");
}

function comparaisonConstante(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function creerJetonSession(): Promise<string> {
  const expiration = Date.now() + DUREE_SESSION_MS;
  const charge = `admin.${expiration}`;
  const signature = await signer(charge);
  return `${charge}.${signature}`;
}

export async function jetonSessionValide(jeton: string | undefined | null): Promise<boolean> {
  if (!jeton) return false;

  const dernierPoint = jeton.lastIndexOf(".");
  if (dernierPoint === -1) return false;

  const charge = jeton.slice(0, dernierPoint);
  const signature = jeton.slice(dernierPoint + 1);
  const signatureAttendue = await signer(charge);

  if (!comparaisonConstante(signature, signatureAttendue)) {
    return false;
  }

  const [, expirationStr] = charge.split(".");
  const expiration = Number(expirationStr);
  if (!Number.isFinite(expiration) || Date.now() > expiration) {
    return false;
  }

  return true;
}
