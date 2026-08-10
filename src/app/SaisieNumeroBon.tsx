"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FORMAT_NUMERO = /^[a-km-np-z2-9]{10}$/i;

export default function SaisieNumeroBon() {
  const router = useRouter();
  const [valeur, setValeur] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const numero = valeur.trim().toLowerCase();

    if (!FORMAT_NUMERO.test(numero)) {
      setErreur(
        "Ce numéro ne semble pas correct. Vérifiez les caractères inscrits sur votre bon."
      );
      return;
    }

    setErreur(null);
    router.push(`/d/${numero}`);
  }

  return (
    <form onSubmit={soumettre} className="flex w-full flex-col gap-3">
      <label htmlFor="numero-bon" className="text-sm font-medium" style={{ color: "#231f20" }}>
        Numéro figurant sur votre bon
      </label>
      <input
        id="numero-bon"
        name="numero-bon"
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Ex. k7m2p9qr3t"
        value={valeur}
        onChange={(e) => setValeur(e.target.value)}
        className="rounded border bg-white px-4 py-3 text-base outline-none focus:ring-2"
        style={{ borderColor: "#dbc1b4", color: "#231f20" }}
      />
      <div role="status" aria-live="polite" className="min-h-5">
        {erreur && (
          <p className="text-sm" style={{ color: "#90503b" }}>
            {erreur}
          </p>
        )}
      </div>
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded px-6 py-3 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#cc7457" }}
      >
        Accéder à mon document
      </button>
    </form>
  );
}
