import type { Rect, EllipseParams } from '../../types';
import { randomRange } from '../../utils';

export function generateEllipse(cellBounds: Rect): EllipseParams {
  const center = {
    x: cellBounds.x + cellBounds.width / 2,
    y: cellBounds.y + cellBounds.height / 2,
  };
  const minDim = Math.min(cellBounds.width, cellBounds.height);
  const margin = minDim * 0.15;
  const maxRadius = minDim / 2 - margin;
  return {
    center,
    rx: randomRange(minDim * 0.2, maxRadius),
    ry: randomRange(minDim * 0.15, maxRadius * 0.75),
    rotation: randomRange(0, Math.PI),
  };
}
