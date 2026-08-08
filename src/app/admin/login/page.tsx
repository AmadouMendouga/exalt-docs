import { connexionAdmin } from "../actions";

export default async function PageConnexionAdmin({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#faf7f5" }}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <span className="font-serif text-2xl tracking-[0.15em]" style={{ color: "#90503b" }}>
          EXALT INSTITUT
        </span>

        <div
          className="w-full rounded-lg border bg-white px-8 py-10 shadow-sm"
          style={{ borderColor: "#dbc1b4" }}
        >
          <h1 className="mb-6 text-center font-serif text-lg" style={{ color: "#90503b" }}>
            Espace admin
          </h1>

          <form action={connexionAdmin} className="flex flex-col gap-4">
            <input
              type="password"
              name="mot_de_passe"
              required
              placeholder="Mot de passe"
              className="rounded border bg-white px-3 py-3 text-sm outline-none focus:ring-2"
              style={{ borderColor: "#dbc1b4", color: "#231f20" }}
            />

            {erreur && (
              <p className="text-sm" style={{ color: "#90503b" }}>
                Mot de passe incorrect.
              </p>
            )}

            <button
              type="submit"
              className="mt-2 rounded px-6 py-3 text-sm font-medium tracking-wide text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#cc7457" }}
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
