import CodeForm from "./CodeForm";

export default async function PageDocument({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#faf7f5" }}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <span
            className="font-serif text-2xl tracking-[0.15em]"
            style={{ color: "#90503b" }}
          >
            EXALT INSTITUT
          </span>
          <span className="text-xs tracking-[0.2em] uppercase" style={{ color: "#231f20", opacity: 0.5 }}>
            Yassa &middot; Nkolmbong &middot; Douala
          </span>
        </div>

        <div
          className="w-full rounded-lg border bg-white px-6 py-10 shadow-sm sm:px-10"
          style={{ borderColor: "#dbc1b4" }}
        >
          <h1
            className="mb-8 text-center font-serif text-xl"
            style={{ color: "#90503b" }}
          >
            Votre document vous attend
          </h1>
          <CodeForm slug={slug} />
        </div>

        <p className="max-w-sm text-center text-xs" style={{ color: "#231f20", opacity: 0.55 }}>
          Ce code vous a été transmis personnellement par WhatsApp. Ne le
          partagez avec personne.
        </p>
      </div>
    </div>
  );
}
