export async function attendreMinimum<T>(promesse: Promise<T>, minMs: number): Promise<T> {
  const debut = Date.now();
  const resultat = await promesse;
  const ecoule = Date.now() - debut;
  if (ecoule < minMs) {
    await new Promise((resolve) => setTimeout(resolve, minMs - ecoule));
  }
  return resultat;
}
