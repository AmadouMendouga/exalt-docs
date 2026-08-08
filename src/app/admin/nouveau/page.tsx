import AdminNav from "@/components/AdminNav";
import NouveauDocumentForm from "./NouveauDocumentForm";

export default function PageNouveauDocument() {
  return (
    <div className="flex flex-1 flex-col">
      <AdminNav />
      <main className="mx-auto w-full max-w-lg px-6 py-10 sm:px-10">
        <h1 className="mb-8 font-serif text-2xl" style={{ color: "#90503b" }}>
          Nouveau document
        </h1>
        <NouveauDocumentForm />
      </main>
    </div>
  );
}
