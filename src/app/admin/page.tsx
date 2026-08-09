import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { compterConsultations } from "@/lib/journal";
import { revoquerDocument } from "./actions";
import RegenererCodeBouton from "./RegenererCodeBouton";
import VoirDocumentBouton from "./VoirDocumentBouton";
import SupprimerDocumentBouton from "./SupprimerDocumentBouton";

export const dynamic = "force-dynamic";

type LigneDocument = {
  id: string;
  slug: string;
  titre: string;
  client_nom: string;
  date_creation: string;
  date_expiration: string | null;
  actif: boolean;
};

export default async function PageAdmin() {
  const supabase = supabaseAdmin();
  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, slug, titre, client_nom, date_creation, date_expiration, actif")
    .order("date_creation", { ascending: false });

  const lignes: LigneDocument[] = documents ?? [];

  const consultations = await Promise.all(
    lignes.map((doc) => compterConsultations(doc.id))
  );

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav />
      <main className="flex flex-1 flex-col px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl" style={{ color: "#90503b" }}>
            Documents
          </h1>
          <Link
            href="/admin/nouveau"
            className="rounded px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#cc7457" }}
          >
            + Nouveau document
          </Link>
        </div>

        {error && (
          <p className="text-sm" style={{ color: "#90503b" }}>
            Erreur de chargement des documents.
          </p>
        )}

        {lignes.length === 0 ? (
          <p className="text-sm" style={{ color: "#231f20", opacity: 0.6 }}>
            Aucun document créé pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#dbc1b4" }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ backgroundColor: "#dbc1b4" }}>
                  <Th>Titre</Th>
                  <Th>Cliente</Th>
                  <Th>Date</Th>
                  <Th>Statut</Th>
                  <Th>Consultations</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((doc, i) => {
                  const expire =
                    doc.date_expiration && new Date(doc.date_expiration) < new Date();
                  const statut = !doc.actif ? "Révoqué" : expire ? "Expiré" : "Actif";
                  const statutCouleur = !doc.actif || expire ? "#90503b" : "#1f7a3f";

                  return (
                    <tr key={doc.id} className="border-t" style={{ borderColor: "#dbc1b4" }}>
                      <td className="px-4 py-3" style={{ color: "#231f20" }}>
                        {doc.titre}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#231f20" }}>
                        {doc.client_nom}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#231f20" }}>
                        {new Date(doc.date_creation).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3 font-medium" style={{ color: statutCouleur }}>
                        {statut}
                      </td>
                      <td className="px-4 py-3" style={{ color: "#231f20" }}>
                        {consultations[i]}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <VoirDocumentBouton id={doc.id} />
                          {doc.actif && (
                            <>
                              <RegenererCodeBouton id={doc.id} />
                              <form action={revoquerDocument}>
                                <input type="hidden" name="id" value={doc.id} />
                                <button
                                  type="submit"
                                  className="text-sm underline"
                                  style={{ color: "#90503b" }}
                                >
                                  Révoquer
                                </button>
                              </form>
                            </>
                          )}
                          <SupprimerDocumentBouton id={doc.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-xs font-semibold tracking-wide uppercase" style={{ color: "#231f20" }}>
      {children}
    </th>
  );
}
