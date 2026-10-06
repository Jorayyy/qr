import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import QRCode from "qrcode";

/** Rasterise a QR code the same way a camera frame looks: RGBA, with a quiet zone. */
function rasterise(text: string, scale = 4, quiet = 4) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const dimension = (size + quiet * 2) * scale;
  const pixels = new Uint8ClampedArray(dimension * dimension * 4).fill(255);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      for (let y = 0; y < scale; y += 1) {
        for (let x = 0; x < scale; x += 1) {
          const px = ((quiet + row) * scale + y) * dimension + (quiet + col) * scale + x;
          pixels[px * 4] = 0;
          pixels[px * 4 + 1] = 0;
          pixels[px * 4 + 2] = 0;
        }
      }
    }
  }

  return { pixels, dimension };
}

describe("jsQR fallback decoder", () => {
  it("decodes the exact QR payload the app generates", () => {
    const text = "VMS-64b0c1d2e3f40516a7b8c9d0";
    const { pixels, dimension } = rasterise(text);

    const result = jsQR(pixels, dimension, dimension);

    expect(result?.data).toBe(text);
  });

  it("decodes a longer kiosk payload", () => {
    const text = "VMS-0123456789abcdef0123456789abcdef";
    const { pixels, dimension } = rasterise(text, 6, 6);

    expect(jsQR(pixels, dimension, dimension)?.data).toBe(text);
  });

  it("returns null instead of throwing on a blank frame", () => {
    const blank = new Uint8ClampedArray(64 * 64 * 4).fill(255);

    expect(jsQR(blank, 64, 64)).toBeNull();
  });
});
