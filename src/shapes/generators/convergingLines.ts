import type { Rect, ConvergingLinesParams } from '../../types';
import { randomRange } from '../../utils';

export function generateConvergingLines(cellBounds: Rect): ConvergingLinesParams {
  const marginX = cellBounds.width * 0.15;
  const marginY = cellBounds.height * 0.15;
  return {
    vanishingPoint: {
      x: cellBounds.x + randomRange(marginX, cellBounds.width - marginX),
      y: cellBounds.y + randomRange(marginY, cellBounds.height * 0.45),
    },
    basePoints: [
      {
        x: cellBounds.x + cellBounds.width * 0.15,
        y: cellBounds.y + cellBounds.height * 0.85,
      },
      {
        x: cellBounds.x + cellBounds.width * 0.85,
        y: cellBounds.y + cellBounds.height * 0.85,
      },
    ],
  };
}
