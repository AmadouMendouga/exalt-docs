"use client";

import { useRef } from "react";

const CARACTERE_VALIDE = /^[A-Z0-9]$/;

export default function CodeInputOtp({
  value,
  onChange,
  onComplete,
  disabled = false,
  longueur = 6,
  secousseId = 0,
}: {
  value: string;
  onChange: (valeur: string) => void;
  onComplete: (valeur: string) => void;
  disabled?: boolean;
  longueur?: number;
  secousseId?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const cases = Array.from({ length: longueur }, (_, i) => value[i] ?? "");

  function definirCase(index: number, caractere: string) {
    const suite = cases.slice();
    suite[index] = caractere;
    const nouvelleValeur = suite.join("").slice(0, longueur);
    onChange(nouvelleValeur);
    if (nouvelleValeur.length === longueur && suite.every((c) => c !== "")) {
      onComplete(nouvelleValeur);
    }
  }

  function gererChangement(index: number, brut: string) {
    const caractere = brut.toUpperCase().slice(-1);
    if (caractere && !CARACTERE_VALIDE.test(caractere)) return;

    definirCase(index, caractere);
    if (caractere && index < longueur - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function gererTouche(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (cases[index]) {
        definirCase(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        definirCase(index - 1, "");
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < longueur - 1) {
      refs.current[index + 1]?.focus();
      e.preventDefault();
    }
  }

  function gererCollage(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const texte = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, longueur);

    if (!texte) return;

    onChange(texte);
    const dernierIndex = Math.min(texte.length, longueur) - 1;
    refs.current[dernierIndex]?.focus();
    if (texte.length === longueur) {
      onComplete(texte);
    }
  }

  return (
    <div
      key={secousseId}
      className={`flex gap-2 sm:gap-3 ${secousseId > 0 ? "exalt-anim-shake" : ""}`}
      role="group"
      aria-label="Code d'accès à 6 caractères"
    >
      {cases.map((caractere, index) => (
        <input
          key={index}
          id={`code-${index}`}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={caractere}
          onChange={(e) => gererChangement(index, e.target.value)}
          onKeyDown={(e) => gererTouche(index, e)}
          onPaste={gererCollage}
          disabled={disabled}
          autoFocus={index === 0 && secousseId > 0}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={1}
          aria-label={`Caractère ${index + 1} sur ${longueur}`}
          className="h-12 w-9 rounded border bg-white text-center text-xl uppercase outline-none focus:ring-2 disabled:opacity-60 sm:h-14 sm:w-11 sm:text-2xl"
          style={{ borderColor: "#dbc1b4", color: "#231f20" }}
        />
      ))}
    </div>
  );
}
