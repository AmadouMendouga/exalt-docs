import "server-only";
import { compterEvenementsRecents } from "@/lib/journal";

export const MAX_TENTATIVES = 5;
export const DUREE_BLOCAGE_MINUTES = 15;

export async function estBloque(params: {
  documentId: string;
  ip?: string | null;
}): Promise<boolean> {
  const depuis = new Date(Date.now() - DUREE_BLOCAGE_MINUTES * 60_000);
  const echecs = await compterEvenementsRecents({
    documentId: params.documentId,
    evenement: "echec",
    depuis,
    ip: params.ip,
  });
  return echecs >= MAX_TENTATIVES;
}

export function extraireIp(headers: Headers): string | null {
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return headers.get("x-real-ip");
}
