import sharp from 'sharp';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

function buildPlayOverlaySvg(width: number, height: number): Buffer {
  const cx = width / 2;
  const cy = height / 2;
  const circleRadius = Math.round(height * 0.18);

  // Equilateral-ish play triangle centered at (cx, cy), nudged slightly
  // right so its visual weight looks centered inside the circle.
  const triangleSize = circleRadius * 0.9;
  const offsetX = triangleSize * 0.15;
  const p1 = `${cx - triangleSize / 2 + offsetX},${cy - triangleSize * 0.62}`;
  const p2 = `${cx - triangleSize / 2 + offsetX},${cy + triangleSize * 0.62}`;
  const p3 = `${cx + triangleSize * 0.7 + offsetX},${cy}`;

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${circleRadius}" fill="black" fill-opacity="0.45" />
  <polygon points="${p1} ${p2} ${p3}" fill="white" fill-opacity="0.95" />
</svg>`.trim();

  return Buffer.from(svg);
}

/**
 * Resizes an arbitrary input image to the canonical 1200x630 OG card size
 * (cropping to fill), optionally compositing a translucent black circle
 * with a white play icon on top.
 */
export async function processOgImage(
  input: Buffer,
  playOverlay: boolean
): Promise<Buffer> {
  const resized = sharp(input)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 88 });

  if (!playOverlay) {
    return resized.toBuffer();
  }

  const baseBuffer = await resized.toBuffer();
  const overlaySvg = buildPlayOverlaySvg(OG_WIDTH, OG_HEIGHT);

  return sharp(baseBuffer)
    .composite([{ input: overlaySvg, gravity: 'center' }])
    .jpeg({ quality: 88 })
    .toBuffer();
}

/**
 * Normalizes any uploaded image to a stored "original" representation
 * (same 1200x630 crop, no overlay) so toggling the play button later can
 * re-derive the OG image without needing the user to re-upload.
 */
export async function processOriginalImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 90 })
    .toBuffer();
}
