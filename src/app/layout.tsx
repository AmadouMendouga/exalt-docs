import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const fontTitres = Playfair_Display({
  variable: "--font-titres",
  subsets: ["latin"],
});

const fontCorps = Inter({
  variable: "--font-corps",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exalt Institut — Vos documents",
  description: "Consultez vos documents Exalt Institut en toute confidentialité.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${fontTitres.variable} ${fontCorps.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
