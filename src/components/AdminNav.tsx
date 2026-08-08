import Link from "next/link";
import { deconnexionAdmin } from "@/app/admin/actions";

export default function AdminNav() {
  return (
    <header
      className="flex items-center justify-between border-b px-6 py-4 sm:px-10"
      style={{ borderColor: "#dbc1b4", backgroundColor: "#faf7f5" }}
    >
      <Link href="/admin" className="font-serif text-lg tracking-wide" style={{ color: "#90503b" }}>
        EXALT INSTITUT — Admin
      </Link>
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/admin" style={{ color: "#231f20" }}>
          Documents
        </Link>
        <Link href="/admin/nouveau" style={{ color: "#231f20" }}>
          Nouveau document
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
