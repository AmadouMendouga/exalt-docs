import "server-only";
import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

// Alphabet sans caractères ambigus (pas de 0/O, 1/I) : le code est recopié
// à la main depuis un message WhatsApp.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LONGUEUR_CODE = 6;
const SALT_ROUNDS = 10;

export function genererCodeAcces(): string {
  let code = "";
  for (let i = 0; i < LONGUEUR_CODE; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

export async function hacherCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS);
}

export async function verifierCode(code: string, hache: string): Promise<boolean> {
  return bcrypt.compare(code, hache);
}
