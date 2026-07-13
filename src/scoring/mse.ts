export interface Mask {
  width: number;
  height: number;
  pixels: boolean[]; // true = shape pixel
}

export function imageDataToMask(data: ImageData): Mask {
  const { width, height } = data;
  const pixels = new Array(width * height);
  for (let i = 0; i < width * height; i++) {
    pixels[i] = data.data[i * 4 + 3] > 128;
  }
  return { width, height, pixels };
}

function getShapePixels(mask: Mask): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (mask.pixels[y * mask.width + x]) {
        result.push({ x, y });
      }
    }
  }
  return result;
}

function nearestDistance(
  px: number,
  py: number,
  others: { x: number; y: number }[],
  cap: number
): number {
  let best = cap * cap;
  for (const o of others) {
    const dx = px - o.x;
    const dy = py - o.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < best) best = d2;
    if (best === 0) return 0;
  }
  return Math.sqrt(best);
}

export function compareMasks(
  perfect: Mask,
  user: Mask,
  maxDistance = 8
): { score: number; raw: number } {
  const perfectPixels = getShapePixels(perfect);
  const userPixels = getShapePixels(user);

  if (perfectPixels.length === 0 || userPixels.length === 0) {
    return { score: 0, raw: maxDistance };
  }

  let userToPerfect = 0;
  for (const p of userPixels) {
    userToPerfect += nearestDistance(p.x, p.y, perfectPixels, maxDistance);
  }
  userToPerfect /= userPixels.length;

  let perfectToUser = 0;
  for (const p of perfectPixels) {
    perfectToUser += nearestDistance(p.x, p.y, userPixels, maxDistance);
  }
  perfectToUser /= perfectPixels.length;

  const avg = (userToPerfect + perfectToUser) / 2;
  const score = Math.max(0, 100 - (avg / maxDistance) * 100);
  return { score, raw: avg };
}
