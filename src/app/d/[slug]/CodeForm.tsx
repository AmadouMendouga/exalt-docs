"use client";

import { useState, FormEvent } from "react";

type Etat =
  | { phase: "saisie" }
  | { phase: "chargement" }
  | { phase: "succes"; url: string }
  | { phase: "erreur"; message: string };

const MESSAGES_ERREUR: Record<string, string> = {
  code_incorrect: "Code d'accès incorrect. Vérifiez le message reçu par WhatsApp.",
  expire: "Ce document a expiré. Contactez l'institut pour en obtenir un nouveau.",
  revoque: "Ce document n'est plus accessible.",
  trop_de_tentatives:
    "Trop de tentatives incorrectes. Veuillez réessayer dans 15 minutes.",
  requete_invalide: "Veuillez saisir un code valide.",
  indisponible: "Une erreur est survenue. Veuillez réessayer.",
};

export default function CodeForm({ slug }: { slug: string }) {
  const [code, setCode] = useState("");
  const [etat, setEtat] = useState<Etat>({ phase: "saisie" });

  async function soumettre(e: FormEvent) {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setEtat({ phase: "erreur", message: "Le code d'accès comporte 6 caractères." });
      return;
    }

    setEtat({ phase: "chargement" });
    try {
      const reponse = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code }),
      });
      const donnees = await reponse.json();

      if (!reponse.ok) {
        setEtat({
          phase: "erreur",
          message: MESSAGES_ERREUR[donnees.erreur] ?? MESSAGES_ERREUR.indisponible,
        });
        return;
      }

      setEtat({ phase: "succes", url: donnees.url });
    } catch {
      setEtat({ phase: "erreur", message: MESSAGES_ERREUR.indisponible });
    }
  }

  if (etat.phase === "succes") {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <div className="w-full overflow-hidden rounded border" style={{ borderColor: "#dbc1b4" }}>
          <iframe src={etat.url} title="Document" className="h-[70vh] w-full bg-white" />
        </div>
        <a
          href={etat.url}
          download
          className="inline-flex items-center justify-center rounded px-6 py-3 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#cc7457" }}
        >
          Télécharger le document
        </a>
        <p className="text-xs" style={{ color: "#231f20", opacity: 0.6 }}>
          Ce lien expire après quelques minutes pour votre sécurité.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={soumettre} className="flex w-full flex-col items-center gap-4">
      <label htmlFor="code" className="text-sm" style={{ color: "#231f20" }}>
        Code d&rsquo;accès reçu par WhatsApp
      </label>
      <input
        id="code"
        name="code"
        autoComplete="off"
        inputMode="text"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        disabled={etat.phase === "chargement"}
        className="w-48 rounded border bg-white px-4 py-3 text-center text-2xl tracking-[0.4em] uppercase outline-none focus:ring-2"
        style={{ borderColor: "#dbc1b4", color: "#231f20" }}
        placeholder="------"
      />

      {etat.phase === "erreur" && (
        <p className="max-w-sm text-center text-sm" style={{ color: "#90503b" }}>
          {etat.message}
        </p>
      )}

      <button
        type="submit"
        disabled={etat.phase === "chargement"}
        className="mt-2 inline-flex items-center justify-center rounded px-8 py-3 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#cc7457" }}
      >
        {etat.phase === "chargement" ? "Vérification..." : "Consulter le document"}
      </button>
    </form>
  );
}
