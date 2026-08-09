"use client";

import { useState } from "react";
import { supprimerDocument } from "./actions";

export default function SupprimerDocumentBouton({ id }: { id: string }) {
  const [enCours, setEnCours] = useState(false);

  async function supprimer() {
    if (
      !confirm(
        "Supprimer définitivement ce document et son fichier PDF ? Cette action est irréversible."
      )
    ) {
      return;
    }

    setEnCours(true);
    await supprimerDocument(id);
    setEnCours(false);
  }

  return (
    <button
      type="button"
      onClick={supprimer}
      disabled={enCours}
      className="text-sm underline disabled:opacity-60"
      style={{ color: "#90503b" }}
    >
      {enCours ? "..." : "Supprimer"}
    </button>
  );
}
