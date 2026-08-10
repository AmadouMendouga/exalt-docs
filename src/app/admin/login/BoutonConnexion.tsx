"use client";

import { useFormStatus } from "react-dom";
import Preloader from "@/components/Preloader";

export default function BoutonConnexion() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: "#cc7457" }}
    >
      {pending && <Preloader taille={18} />}
      {pending ? "Connexion..." : "Se connecter"}
    </button>
  );
}
