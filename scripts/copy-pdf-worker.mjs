import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const racine = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(racine, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destinationDir = join(racine, "public");
const destination = join(destinationDir, "pdf.worker.min.mjs");

mkdirSync(destinationDir, { recursive: true });
copyFileSync(source, destination);
console.log(`pdf.worker.min.mjs copié vers ${destination}`);
