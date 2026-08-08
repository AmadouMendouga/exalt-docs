import "server-only";
import QRCode from "qrcode";

export async function genererQrPngDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
    color: {
      dark: "#231f20",
      light: "#ffffff",
    },
  });
}
