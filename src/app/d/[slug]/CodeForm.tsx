"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import CodeInputOtp from "./CodeInputOtp";
import Preloader from "@/components/Preloader";
import CocheSucces from "@/components/CocheSucces";
import SkeletonDocument from "@/components/SkeletonDocument";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const LONGUEUR_CODE = 6;

type Etat =
  | { phase: "saisie" }
  | { phase: "chargement" }
  | { phase: "blocage"; debloqueLe: Date }
  | { phase: "erreur"; type: string; message: string }
  | { phase: "succes"; url: string };

const MESSAGES_ERREUR: Record<string, string> = {
  code_incorrect: "Code d'accès incorrect. Vérifiez le message reçu par WhatsApp.",
  expire: "Ce document a expiré. Contactez l'institut pour en obtenir un nouveau.",
  revoque: "Ce document n'est plus accessible.",
  requete_invalide: "Veuillez saisir un code valide.",
  indisponible: "Une erreur est survenue. Veuillez réessayer.",
};

const TYPES_ERREUR_PERMANENTS = new Set(["expire", "revoque"]);

function formaterCompteARebours(millisecondes: number): string {
  const secondesTotal = Math.max(0, Math.ceil(millisecondes / 1000));
  const minutes = Math.floor(secondesTotal / 60);
  const secondes = secondesTotal % 60;
  return `${minutes}:${secondes.toString().padStart(2, "0")}`;
}

export default function CodeForm({ slug }: { slug: string }) {
  const [code, setCode] = useState("");
  const [etat, setEtat] = useState<Etat>({ phase: "saisie" });
  const [secousseId, setSecousseId] = useState(0);
  const [overlaySucces, setOverlaySucces] = useState<"entree" | "sortie" | null>(null);
  const [compteARebours, setCompteARebours] = useState("");

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

  // Transition de succès : la coche reste visible ~700ms pendant que le PDF
  // charge déjà en arrière-plan, puis s'efface en fondu.
  useEffect(() => {
    if (etat.phase !== "succes" || overlaySucces === null) return;
    const versSortie = setTimeout(() => setOverlaySucces("sortie"), 700);
    const versDisparition = setTimeout(() => setOverlaySucces(null), 1000);
    return () => {
      clearTimeout(versSortie);
      clearTimeout(versDisparition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etat.phase]);

  // Compte à rebours du blocage, mis à jour chaque seconde jusqu'au déblocage.
  useEffect(() => {
    if (etat.phase !== "blocage") return;
    const debloqueLe = etat.debloqueLe;

    const intervalle = setInterval(() => {
      const restant = debloqueLe.getTime() - Date.now();
      if (restant <= 0) {
        setEtat({ phase: "saisie" });
        setCode("");
        return;
      }
      setCompteARebours(formaterCompteARebours(restant));
    }, 1000);

    return () => clearInterval(intervalle);
  }, [etat]);

  async function soumettre(codeComplet: string) {
    if (codeComplet.length !== LONGUEUR_CODE) return;

    setEtat({ phase: "chargement" });
    try {
      const reponse = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, code: codeComplet }),
      });
      const donnees = await reponse.json();

      if (!reponse.ok) {
        if (donnees.erreur === "trop_de_tentatives" && donnees.debloqueLe) {
          const debloqueLe = new Date(donnees.debloqueLe);
          setEtat({ phase: "blocage", debloqueLe });
          setCompteARebours(formaterCompteARebours(debloqueLe.getTime() - Date.now()));
          return;
        }

        const type = typeof donnees.erreur === "string" ? donnees.erreur : "indisponible";
        setEtat({
          phase: "erreur",
          type,
          message: MESSAGES_ERREUR[type] ?? MESSAGES_ERREUR.indisponible,
        });
        setSecousseId((n) => n + 1);
        if (!TYPES_ERREUR_PERMANENTS.has(type)) {
          setCode("");
        }
        return;
      }

      setEtat({ phase: "succes", url: donnees.url });
      setOverlaySucces("entree");
    } catch {
      setEtat({ phase: "erreur", type: "indisponible", message: MESSAGES_ERREUR.indisponible });
      setSecousseId((n) => n + 1);
    }
  }

  if (etat.phase === "succes") {
    return (
      <div className="flex w-full flex-col items-center gap-4">
        <div
          ref={conteneurRef}
          className="relative flex w-full justify-center overflow-hidden rounded border bg-white"
          style={{ borderColor: "#dbc1b4" }}
        >
          <Document
            file={etat.url}
            onLoadSuccess={({ numPages }) => {
              setNombrePages(numPages);
              setPageActuelle(1);
            }}
            loading={largeurConteneur > 0 ? <SkeletonDocument largeur={largeurConteneur} /> : null}
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

          {overlaySucces && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white transition-opacity duration-300"
              style={{ opacity: overlaySucces === "entree" ? 1 : 0 }}
            >
              <CocheSucces />
              <p className="font-serif text-lg" style={{ color: "#90503b" }}>
                Accès validé
              </p>
              <p className="text-xs tracking-wide" style={{ color: "#231f20", opacity: 0.6 }}>
                Document privé
              </p>
            </div>
          )}
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

  const enChargement = etat.phase === "chargement";
  const enBlocage = etat.phase === "blocage";
  const champDesactive =
    enChargement || enBlocage || (etat.phase === "erreur" && TYPES_ERREUR_PERMANENTS.has(etat.type));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        soumettre(code);
      }}
      className="flex w-full flex-col items-center gap-4"
    >
      <label htmlFor="code-0" className="text-sm" style={{ color: "#231f20" }}>
        Code d&rsquo;accès reçu par WhatsApp
      </label>

      <CodeInputOtp
        value={code}
        onChange={setCode}
        onComplete={soumettre}
        disabled={champDesactive}
        secousseId={secousseId}
      />

      <div className="flex items-center gap-1.5" style={{ color: "#231f20", opacity: 0.5 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="text-xs">Connexion sécurisée</span>
      </div>

      <div role="status" aria-live="polite" className="min-h-5 text-center">
        {enChargement && (
          <span
            className="inline-flex items-center gap-2 text-sm"
            style={{ color: "#231f20", opacity: 0.7 }}
          >
            <Preloader taille={24} />
            Vérification sécurisée du code...
          </span>
        )}

        {enBlocage && (
          <span className="inline-flex items-center gap-2 text-sm" style={{ color: "#90503b" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Trop de tentatives. Réessayez dans {compteARebours}.
          </span>
        )}

        {etat.phase === "erreur" && (
          <p className="max-w-sm text-center text-sm" style={{ color: "#90503b" }}>
            {etat.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={champDesactive || code.length !== LONGUEUR_CODE}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded px-8 py-3 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#cc7457" }}
      >
        {enChargement && <Preloader taille={16} />}
        {enChargement ? "Vérification..." : "Consulter le document"}
      </button>
    </form>
  );
}
