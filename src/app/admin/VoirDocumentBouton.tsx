"use client";

import { useState } from "react";
import { obtenirUrlDocument } from "./actions";

export default function VoirDocumentBouton({ id }: { id: string }) {
  const [enCours, setEnCours] = useState(false);

  async function voir() {
    setEnCours(true);
    const reponse = await obtenirUrlDocument(id);
    setEnCours(false);

    if (!reponse.succes) {
      alert(reponse.erreur);
      return;
    }

    window.open(reponse.url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={voir}
      disabled={enCours}
      className="text-sm underline disabled:opacity-60"
      style={{ color: "#90503b" }}
    >
      {enCours ? "..." : "Voir"}
    </button>
  );
}
