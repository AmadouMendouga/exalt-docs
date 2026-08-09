"use client";

import { useRef, useState, SubmitEvent } from "react";
import Link from "next/link";
import { creerDocument, DocumentCree } from "./actions";

export default function NouveauDocumentForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [resultat, setResultat] = useState<DocumentCree | null>(null);

  async function soumettre(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);

    const formData = new FormData(e.currentTarget);
    try {
      const reponse = await creerDocument(formData);

      if (!reponse.succes) {
        setErreur(reponse.erreur);
        return;
      }

      setResultat(reponse.document);
      formRef.current?.reset();
    } catch {
      setErreur(
        "Échec de la connexion au serveur. Vérifiez votre connexion internet et réessayez."
      );
    } finally {
      setEnCours(false);
    }
  }

  if (resultat) {
    return <ResultatCreationVue document={resultat} />;
  }

  return (
    <form ref={formRef} onSubmit={soumettre} className="flex flex-col gap-5">
      <Champ label="Titre du document" name="titre" required placeholder="Bon de soin — 25 000 FCFA" />
      <Champ label="Nom de la cliente" name="client_nom" required placeholder="Amadou Mendouga" />
      <Champ
        label="Numéro WhatsApp"
        name="client_whatsapp"
        required
        placeholder="+237691927372"
      />
      <Champ
        label="Date d'expiration (facultative)"
        name="date_expiration"
        type="date"
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "#231f20" }}>
          Fichier PDF
        </label>
        <input
          type="file"
          name="fichier"
          accept="application/pdf"
          required
          className="rounded border bg-white px-3 py-2 text-sm"
          style={{ borderColor: "#dbc1b4", color: "#231f20" }}
        />
      </div>

      {erreur && (
        <p className="text-sm" style={{ color: "#90503b" }}>
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="mt-2 inline-flex items-center justify-center rounded px-6 py-3 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#cc7457" }}
      >
        {enCours ? "Création en cours..." : "Créer le document"}
      </button>
    </form>
  );
}

function Champ(props: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  const { label, name, required, placeholder, type = "text" } = props;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium" style={{ color: "#231f20" }}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded border bg-white px-3 py-2 text-sm outline-none focus:ring-2"
        style={{ borderColor: "#dbc1b4", color: "#231f20" }}
      />
    </div>
  );
}

function ResultatCreationVue({ document }: { document: DocumentCree }) {
  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded border px-4 py-3 text-sm"
        style={{ borderColor: "#dbc1b4", backgroundColor: "#faf7f5", color: "#231f20" }}
      >
        Document créé. Le code d&rsquo;accès ci-dessous ne sera plus jamais affiché en
        clair : transmettez-le maintenant.
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
        <span
          className="text-3xl font-semibold tracking-[0.3em]"
          style={{ color: "#90503b" }}
        >
          {document.code}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={document.lienWhatsappClient}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded px-4 py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#25D366" }}
        >
          Envoyer par WhatsApp
        </a>
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

      <div className="flex justify-between pt-2 text-sm">
        <Link href="/admin" className="underline" style={{ color: "#90503b" }}>
          Retour à la liste
        </Link>
        <Link href="/admin/nouveau" className="underline" style={{ color: "#90503b" }}>
          Créer un autre document
        </Link>
      </div>
    </div>
  );
}
