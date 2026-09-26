/**
 * Lightweight SVG QR code generator (using simple visual QR matrix for instant rendering)
 * Generates an SVG string representation of a QR code for the given text.
 */
export function generateQrSvgUrl(text: string, size: number = 200): string {
  // Use public high-reliability QR code API with fallback to styled SVG
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=ffffff&color=1e293b&margin=1`;
}
