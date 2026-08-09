"use client";

import { useEffect, useRef, useState, SubmitEvent } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

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
  const [nombrePages, setNombrePages] = useState<number | null>(null);
  const [pageActuelle, setPageActuelle] = useState(1);
  const [largeurConteneur, setLargeurConteneur] = useState(0);
  const conteneurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (etat.phase !== "succes" || !conteneurRef.current) return;
    const observateur = new ResizeObserver(([entree]) => {
      setLargeurConteneur(entree.contentRect.width);
    });
    observateur.observe(conteneurRef.current);
    return () => observateur.disconnect();
  }, [etat.phase]);

  async function soumettre(e: SubmitEvent) {
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
        <div
          ref={conteneurRef}
          className="flex w-full justify-center overflow-hidden rounded border bg-white"
          style={{ borderColor: "#dbc1b4" }}
        >
          <Document
            file={etat.url}
            onLoadSuccess={({ numPages }) => {
              setNombrePages(numPages);
              setPageActuelle(1);
            }}
            loading={
              <p className="p-8 text-sm" style={{ color: "#231f20", opacity: 0.6 }}>
                Chargement du document...
              </p>
            }
            error={
              <p className="p-8 text-sm" style={{ color: "#90503b" }}>
                Impossible d&rsquo;afficher l&rsquo;aperçu. Utilisez le téléchargement ci-dessous.
              </p>
            }
          >
            {largeurConteneur > 0 && (
              <Page
                pageNumber={pageActuelle}
                width={largeurConteneur}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            )}
          </Document>
        </div>

        {nombrePages && nombrePages > 1 && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setPageActuelle((p) => Math.max(1, p - 1))}
              disabled={pageActuelle <= 1}
              className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "#dbc1b4", color: "#231f20" }}
            >
              Précédent
            </button>
            <span className="text-sm" style={{ color: "#231f20" }}>
              Page {pageActuelle} / {nombrePages}
            </span>
            <button
              type="button"
              onClick={() => setPageActuelle((p) => Math.min(nombrePages, p + 1))}
              disabled={pageActuelle >= nombrePages}
              className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-40"
              style={{ backgroundColor: "#dbc1b4", color: "#231f20" }}
            >
              Suivant
            </button>
          </div>
        )}

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
