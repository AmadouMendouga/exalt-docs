"use client";

import { useState } from "react";
import { regenererCode } from "./actions";

export default function RegenererCodeBouton({ id }: { id: string }) {
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState<{
    code: string;
    qrDataUrl: string;
    lienWhatsapp: string;
  } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function regenerer() {
    if (
      !confirm(
        "Régénérer le code ? L'ancien code cessera immédiatement de fonctionner."
      )
    ) {
      return;
    }

    setEnCours(true);
    setErreur(null);
    const reponse = await regenererCode(id);
    setEnCours(false);

    if (!reponse.succes) {
      setErreur(reponse.erreur);
      return;
    }

    setResultat(reponse);
  }

  return (
    <>
      <button
        type="button"
        onClick={regenerer}
        disabled={enCours}
        className="text-sm underline disabled:opacity-60"
        style={{ color: "#90503b" }}
      >
        {enCours ? "..." : "Régénérer le code"}
      </button>

      {erreur && (
        <p className="mt-1 text-xs" style={{ color: "#90503b" }}>
          {erreur}
        </p>
      )}

      {resultat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(35,31,32,0.5)" }}
        >
          <div
            className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-white p-6"
            style={{ borderColor: "#dbc1b4" }}
          >
            <p className="text-center text-sm" style={{ color: "#231f20" }}>
              Nouveau code généré. Il ne sera plus jamais affiché en clair : transmettez-le
              maintenant.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultat.qrDataUrl}
              alt="QR code du document"
              className="h-48 w-48 rounded border p-2"
              style={{ borderColor: "#dbc1b4" }}
            />
            <a
              href={resultat.qrDataUrl}
              download="qr-document.png"
              className="text-sm underline"
              style={{ color: "#90503b" }}
            >
              Télécharger le QR code (PNG)
            </a>
            <span
              className="text-3xl font-semibold tracking-[0.3em]"
              style={{ color: "#90503b" }}
            >
              {resultat.code}
            </span>
            <a
              href={resultat.lienWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded px-4 py-3 text-center text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              Envoyer par WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setResultat(null)}
              className="text-sm underline"
              style={{ color: "#90503b" }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
