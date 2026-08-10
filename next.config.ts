import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Les PDF scannés/photographiés depuis un téléphone dépassent souvent
      // la limite par défaut de 1 Mo. Reste sous la limite de payload des
      // fonctions serverless Vercel (4,5 Mo) pour éviter un rejet en amont.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
