import Link from "next/link";

export default function Home() {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ backgroundColor: "#faf7f5" }}
    >
      <span className="font-serif text-3xl tracking-[0.15em]" style={{ color: "#90503b" }}>
        EXALT INSTITUT
      </span>
      <p className="max-w-sm text-sm" style={{ color: "#231f20", opacity: 0.7 }}>
        Cet espace permet de consulter un document transmis par l&rsquo;institut.
        Scannez le QR code figurant sur votre bon pour y accéder.
      </p>
      <Link href="/admin" className="mt-4 text-sm underline" style={{ color: "#90503b" }}>
        Espace admin
      </Link>
    </div>
  );
}
