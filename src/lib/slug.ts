import "server-only";
import { randomBytes } from "crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // sans l/1/0/o ambigus
const LONGUEUR_SLUG = 10;

export function genererSlug(): string {
  const octets = randomBytes(LONGUEUR_SLUG);
  let slug = "";
  for (let i = 0; i < LONGUEUR_SLUG; i++) {
    slug += ALPHABET[octets[i] % ALPHABET.length];
  }
  return slug;
}
