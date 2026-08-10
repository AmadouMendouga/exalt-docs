import SaisieNumeroBon from "./SaisieNumeroBon";

const NUMERO_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const MESSAGE_AIDE = "Bonjour, je n'arrive pas à ouvrir mon document Exalt.";
const LIEN_WHATSAPP = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(MESSAGE_AIDE)}`;

const ETAPES = [
  { titre: "Scannez", description: "Scannez le QR code imprimé sur votre bon avec l'appareil photo de votre téléphone." },
  { titre: "Saisissez le code", description: "Entrez le code d'accès à 6 caractères reçu par WhatsApp de la part de l'institut." },
  { titre: "Consultez", description: "Votre document s'affiche et peut être téléchargé pour le conserver hors connexion." },
];

const REASSURANCES = [
  {
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    texte: "Votre document est privé et n'est accessible qu'à vous.",
  },
  {
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-4-1L3 20l1-5.5A8.38 8.38 0 0 1 3 11.5 8.5 8.5 0 1 1 21 11.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
    texte: "Il ne s'ouvre qu'avec le code reçu par WhatsApp.",
  },
  {
    icone: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3 4 6.5v5c0 4.7 3.2 8.9 8 10 4.8-1.1 8-5.3 8-10v-5L12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
    texte: "Aucune donnée n'est partagée avec un tiers.",
  },
];

export default function Home() {
  return (
    <div
      className="flex flex-1 flex-col items-center px-6 py-12"
      style={{ backgroundColor: "#faf7f5" }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-1 text-center">
          <span
            className="font-serif text-3xl tracking-[0.15em]"
            style={{ color: "#90503b" }}
          >
            EXALT INSTITUT
          </span>
          <p className="max-w-sm text-sm" style={{ color: "#231f20", opacity: 0.7 }}>
            Consultez en toute confidentialité le document transmis par l&rsquo;institut.
          </p>
        </div>

        <div
          className="w-full rounded-lg border bg-white px-6 py-8 shadow-sm sm:px-8"
          style={{ borderColor: "#dbc1b4" }}
        >
          <h1 className="mb-1 text-center font-serif text-lg" style={{ color: "#90503b" }}>
            Vous n&rsquo;avez pas pu scanner le QR code ?
          </h1>
          <p className="mb-6 text-center text-sm" style={{ color: "#231f20", opacity: 0.6 }}>
            Saisissez le numéro inscrit sur votre bon pour accéder directement à votre document.
          </p>
          <SaisieNumeroBon />
        </div>

        <div className="flex w-full flex-col gap-4">
          <h2
            className="text-center text-xs font-semibold tracking-[0.2em] uppercase"
            style={{ color: "#231f20", opacity: 0.55 }}
          >
            Comment ça marche
          </h2>
          <ol className="flex flex-col gap-3">
            {ETAPES.map((etape, index) => (
              <li key={etape.titre} className="flex items-start gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "#dbc1b4", color: "#90503b" }}
                >
                  {index + 1}
                </span>
                <p className="pt-0.5 text-sm" style={{ color: "#231f20" }}>
                  <span className="font-medium">{etape.titre}.</span> {etape.description}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div
          className="flex w-full flex-col gap-3 rounded-lg border px-5 py-5"
          style={{ borderColor: "#dbc1b4" }}
        >
          {REASSURANCES.map((item) => (
            <div key={item.texte} className="flex items-center gap-3">
              <span style={{ color: "#90503b" }}>{item.icone}</span>
              <p className="text-sm" style={{ color: "#231f20", opacity: 0.8 }}>
                {item.texte}
              </p>
            </div>
          ))}
        </div>

        <a
          href={LIEN_WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#25D366" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8.9-.2.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8.1.2 1.9 2.9 4.6 4.1.6.3 1.1.4 1.5.6.6.2 1.2.1 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
          </svg>
          Besoin d&rsquo;aide ? Contactez-nous
        </a>
      </div>
    </div>
  );
}
