import Link from "next/link";
import { deconnexionAdmin } from "@/app/admin/actions";

export default function AdminNav() {
  return (
    <header
      className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10"
      style={{ borderColor: "#dbc1b4", backgroundColor: "#faf7f5" }}
    >
      <Link href="/admin" className="font-serif text-lg tracking-wide" style={{ color: "#90503b" }}>
        EXALT INSTITUT — Admin
      </Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Link href="/admin" style={{ color: "#231f20" }}>
          Documents
        </Link>
        <Link
          href="/admin/nouveau"
          className="rounded px-4 py-1.5 font-medium text-white"
          style={{ backgroundColor: "#cc7457" }}
        >
          + Nouveau document
        </Link>
        <form action={deconnexionAdmin}>
          <button type="submit" className="underline" style={{ color: "#90503b" }}>
            Déconnexion
          </button>
        </form>
      </nav>
    </header>
  );
}
