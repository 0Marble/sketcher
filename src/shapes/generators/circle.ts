import type { Rect, CircleParams } from '../../types';
import { randomRange } from '../../utils';

export function generateCircle(cellBounds: Rect, seed?: number): CircleParams {
  const center = {
    x: cellBounds.x + cellBounds.width / 2,
    y: cellBounds.y + cellBounds.height / 2,
  };
  const minDim = Math.min(cellBounds.width, cellBounds.height);
  const margin = minDim * 0.15;
  // Use a small random offset so the circle is not always dead-center.
  const maxOffset = minDim * 0.05;
  const offsetX = seed === undefined ? randomRange(-maxOffset, maxOffset) : 0;
  const offsetY = seed === undefined ? randomRange(-maxOffset, maxOffset) : 0;
  const radius =
    seed === undefined
      ? randomRange(minDim * 0.12, minDim / 2 - margin)
      : minDim * 0.35;
  return {
    center: { x: center.x + offsetX, y: center.y + offsetY },
    radius,
  };
}
