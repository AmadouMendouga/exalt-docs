"use client";

import { useState, SubmitEvent } from "react";
import Link from "next/link";
import { creerDocument, DocumentCree } from "./actions";
import Preloader from "@/components/Preloader";
import CocheSucces from "@/components/CocheSucces";
import { attendreMinimum } from "@/lib/attendreMinimum";

const DUREE_MIN_CHARGEMENT_MS = 600;
const TAILLE_MAX_FICHIER_OCTETS = 4 * 1024 * 1024;

function dateAujourdhui(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, "0");
  const jour = String(maintenant.getDate()).padStart(2, "0");
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

const ID_LIGNE_INITIALE = "ligne-initiale";

function idLigne(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `ligne-${Date.now()}-${Math.random()}`;
}

type ResultatLot = {
  documentsReussis: DocumentCree[];
  lignesEchouees: string[];
  erreurs: Record<string, string>;
};

async function traiterLignes(
  lignes: string[],
  formData: FormData,
  onProgression: (fait: number) => void
): Promise<ResultatLot> {
  const documentsReussis: DocumentCree[] = [];
  const lignesEchouees: string[] = [];
  const erreurs: Record<string, string> = {};

  for (let i = 0; i < lignes.length; i++) {
    const id = lignes[i];
    const sousFormData = new FormData();
    sousFormData.set("titre", String(formData.get(`titre_${id}`) ?? ""));
    sousFormData.set("client_nom", String(formData.get(`client_nom_${id}`) ?? ""));
    sousFormData.set("client_whatsapp", String(formData.get(`client_whatsapp_${id}`) ?? ""));
    sousFormData.set("date_expiration", String(formData.get(`date_expiration_${id}`) ?? ""));
    const fichier = formData.get(`fichier_${id}`);
    if (fichier instanceof File) {
      sousFormData.set("fichier", fichier);
    }

    try {
      const reponse = await creerDocument(sousFormData);
      if (reponse.succes) {
        documentsReussis.push(reponse.document);
      } else {
        lignesEchouees.push(id);
        erreurs[id] = reponse.erreur;
      }
    } catch {
      lignesEchouees.push(id);
      erreurs[id] = "Échec de la connexion au serveur. Réessayez pour cette personne.";
    }

    onProgression(i + 1);
  }

  return { documentsReussis, lignesEchouees, erreurs };
}

export default function NouveauDocumentForm() {
  const [lignes, setLignes] = useState<string[]>([ID_LIGNE_INITIALE]);
  const [modeLot, setModeLot] = useState(false);
  const [erreursLignes, setErreursLignes] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [documentsCrees, setDocumentsCrees] = useState<DocumentCree[]>([]);
  const [enCours, setEnCours] = useState(false);
  const [progression, setProgression] = useState<{ fait: number; total: number } | null>(null);

  function ajouterLigne() {
    setModeLot(true);
    setLignes((prev) => [...prev, idLigne()]);
  }

  function retirerLigne(id: string) {
    setLignes((prev) => (prev.length > 1 ? prev.filter((ligneId) => ligneId !== id) : prev));
    setErreursLignes((prev) => {
      const { [id]: _retiree, ...reste } = prev;
      return reste;
    });
  }

  function creerUnAutre() {
    setDocumentsCrees([]);
    setLignes([ID_LIGNE_INITIALE]);
    setModeLot(false);
    setErreursLignes({});
  }

  async function soumettre(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreurGenerale(null);

    const formData = new FormData(e.currentTarget);

    const erreursTailleFichier: Record<string, string> = {};
    for (const id of lignes) {
      const fichier = formData.get(`fichier_${id}`);
      if (fichier instanceof File && fichier.size > TAILLE_MAX_FICHIER_OCTETS) {
        erreursTailleFichier[id] =
          "Le fichier PDF est trop volumineux (4 Mo maximum). Compressez-le et réessayez.";
      }
    }
    if (Object.keys(erreursTailleFichier).length > 0) {
      setErreursLignes(erreursTailleFichier);
      return;
    }

    setEnCours(true);
    setErreursLignes({});
    setProgression({ fait: 0, total: lignes.length });

    try {
      const { documentsReussis, lignesEchouees, erreurs } = await attendreMinimum(
        traiterLignes(lignes, formData, (fait) => setProgression({ fait, total: lignes.length })),
        DUREE_MIN_CHARGEMENT_MS
      );

      setDocumentsCrees((prev) => [...prev, ...documentsReussis]);
      setErreursLignes(erreurs);
      setLignes(lignesEchouees.length > 0 ? lignesEchouees : [ID_LIGNE_INITIALE]);
    } catch {
      setErreurGenerale(
        "Échec de la connexion au serveur. Vérifiez votre connexion internet et réessayez."
      );
    } finally {
      setEnCours(false);
      setProgression(null);
    }
  }

  // Cas par défaut : une seule personne, un seul document — écran identique à l'origine.
  if (!modeLot && documentsCrees.length > 0) {
    return (
      <ResultatCreationVue document={documentsCrees[documentsCrees.length - 1]} onCreerAutre={creerUnAutre} />
    );
  }

  const erreurLigneUnique = !modeLot ? erreursLignes[lignes[0]] : undefined;

  return (
    <div className="flex flex-col gap-8">
      {modeLot && documentsCrees.length > 0 && (
        <div className="flex flex-col gap-6">
          {documentsCrees.map((document) => (
            <CarteResultat key={document.slug} document={document} />
          ))}
        </div>
      )}

      <form onSubmit={soumettre} className="flex flex-col gap-5">
        {lignes.map((id, index) => (
          <LigneFormulaire
            key={id}
            id={id}
            numero={index + 1}
            compact={!modeLot}
            peutSupprimer={lignes.length > 1}
            erreur={modeLot ? erreursLignes[id] : undefined}
            onSupprimer={() => retirerLigne(id)}
          />
        ))}

        <button
          type="button"
          onClick={ajouterLigne}
          disabled={enCours}
          className="self-start text-sm underline disabled:opacity-60"
          style={{ color: "#90503b" }}
        >
          + Ajouter une autre personne
        </button>

        <div role="status" aria-live="polite">
          {(erreurGenerale || erreurLigneUnique) && (
            <p className="text-sm" style={{ color: "#90503b" }}>
              {erreurGenerale ?? erreurLigneUnique}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={enCours}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "#cc7457" }}
        >
          {enCours && <Preloader taille={18} />}
          {enCours
            ? lignes.length > 1
              ? `Envoi sécurisé en cours... (${progression?.fait ?? 0}/${progression?.total ?? lignes.length})`
              : "Envoi sécurisé du document..."
            : lignes.length > 1
              ? `Créer les ${lignes.length} documents`
              : "Créer le document"}
        </button>
      </form>

      {modeLot && documentsCrees.length > 0 && (
        <div className="border-t pt-4 text-sm" style={{ borderColor: "#dbc1b4" }}>
          <Link href="/admin" className="underline" style={{ color: "#90503b" }}>
            Retour à la liste
          </Link>
        </div>
      )}
    </div>
  );
}

function LigneFormulaire(props: {
  id: string;
  numero: number;
  compact: boolean;
  peutSupprimer: boolean;
  erreur?: string;
  onSupprimer: () => void;
}) {
  const { id, numero, compact, peutSupprimer, erreur, onSupprimer } = props;

  const champs = (
    <>
      <Champ label="Titre du document" name={`titre_${id}`} required placeholder="Bon de soin — 25 000 FCFA" />
      <Champ label="Nom de la cliente" name={`client_nom_${id}`} required placeholder="Amadou Mendouga" />
      <Champ
        label="Numéro WhatsApp"
        name={`client_whatsapp_${id}`}
        required
        placeholder="+237691927372"
      />
      <Champ
        label="Date d'expiration (facultative)"
        name={`date_expiration_${id}`}
        type="date"
        min={dateAujourdhui()}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "#231f20" }}>
          Fichier PDF
        </label>
        <input
          type="file"
          name={`fichier_${id}`}
          accept="application/pdf"
          required
          className="rounded border bg-white px-3 py-2 text-sm"
          style={{ borderColor: "#dbc1b4", color: "#231f20" }}
        />
      </div>
    </>
  );

  if (compact) {
    return <div className="flex flex-col gap-5">{champs}</div>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border px-4 py-4" style={{ borderColor: "#dbc1b4" }}>
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "#231f20", opacity: 0.55 }}
        >
          Personne {numero}
        </span>
        {peutSupprimer && (
          <button
            type="button"
            onClick={onSupprimer}
            className="text-xs underline"
            style={{ color: "#90503b" }}
          >
            Retirer
          </button>
        )}
      </div>

      {champs}

      {erreur && (
        <p className="text-sm" style={{ color: "#90503b" }} role="alert">
          {erreur}
        </p>
      )}
    </div>
  );
}

function Champ(props: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  min?: string;
}) {
  const { label, name, required, placeholder, type = "text", min } = props;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium" style={{ color: "#231f20" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        required={required}
        placeholder={placeholder}
        className="rounded border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
        style={{ borderColor: "#dbc1b4", color: "#231f20" }}
      />
    </div>
  );
}

function CorpsResultat({ document }: { document: DocumentCree }) {
  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <CocheSucces taille={44} />
        <p className="font-serif text-lg" style={{ color: "#90503b" }}>
          Document créé
        </p>
      </div>

      <div
        className="rounded border px-4 py-3 text-sm"
        style={{ borderColor: "#dbc1b4", backgroundColor: "#faf7f5", color: "#231f20" }}
      >
        Le code d&rsquo;accès ci-dessous ne sera plus jamais affiché en clair :
        transmettez-le maintenant.
      </div>

      <div className="flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={document.qrDataUrl}
          alt="QR code du document"
          className="h-48 w-48 rounded border p-2"
          style={{ borderColor: "#dbc1b4" }}
        />
        <a
          href={document.qrDataUrl}
          download={`qr-${document.slug}.png`}
          className="text-sm underline"
          style={{ color: "#90503b" }}
        >
          Télécharger le QR code (PNG)
        </a>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs uppercase tracking-widest" style={{ color: "#231f20", opacity: 0.6 }}>
          Code d&rsquo;accès
        </span>
        <span className="text-3xl font-semibold tracking-[0.3em]" style={{ color: "#90503b" }}>
          {document.code}
        </span>
      </div>

      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-xs uppercase tracking-widest"
          style={{ color: "#231f20", opacity: 0.5 }}
        >
          Numéro du bon (secours)
        </span>
        <span className="font-mono text-sm tracking-wide" style={{ color: "#231f20" }}>
          {document.slug}
        </span>
        <p className="max-w-xs text-center text-xs" style={{ color: "#231f20", opacity: 0.55 }}>
          À reporter sur le bon papier : permet à la cliente d&rsquo;accéder au document si le QR
          code est illisible.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {document.envoiWhatsapp.mode === "api" ? (
          <div
            className="flex flex-1 items-center justify-center gap-2 rounded px-4 py-3 text-center text-sm font-medium"
            style={{ backgroundColor: "#e8f3ec", color: "#1f7a3f" }}
          >
            <CocheSucces taille={20} />
            Envoyé automatiquement par WhatsApp
          </div>
        ) : (
          <a
            href={document.envoiWhatsapp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded px-4 py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#25D366" }}
          >
            Envoyer par WhatsApp
          </a>
        )}
        <a
          href={document.lienNotificationInstitut}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded border px-4 py-3 text-center text-sm font-medium transition-opacity hover:opacity-90"
          style={{ borderColor: "#cc7457", color: "#90503b" }}
        >
          Notifier l&rsquo;institut
        </a>
      </div>
    </>
  );
}

function ResultatCreationVue({
  document,
  onCreerAutre,
}: {
  document: DocumentCree;
  onCreerAutre: () => void;
}) {
  return (
    <div className="exalt-anim-fade-scale-in flex flex-col gap-6">
      <CorpsResultat document={document} />

      <div className="flex justify-between pt-2 text-sm">
        <Link href="/admin" className="underline" style={{ color: "#90503b" }}>
          Retour à la liste
        </Link>
        <button type="button" onClick={onCreerAutre} className="underline" style={{ color: "#90503b" }}>
          Créer un autre document
        </button>
      </div>
    </div>
  );
}

function CarteResultat({ document }: { document: DocumentCree }) {
  return (
    <div
      className="exalt-anim-fade-scale-in flex flex-col gap-6 rounded-lg border px-5 py-6"
      style={{ borderColor: "#dbc1b4" }}
    >
      <CorpsResultat document={document} />
    </div>
  );
}
