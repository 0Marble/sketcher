import type { Rect, CurvedLinesParams } from '../../types';
import { randomRange, randomInt } from '../../utils';

export function generateCurvedLine(cellBounds: Rect): CurvedLinesParams {
  const marginX = cellBounds.width * 0.15;
  const marginY = cellBounds.height * 0.15;
  const start = {
    x: cellBounds.x + randomRange(marginX, cellBounds.width - marginX),
    y: cellBounds.y + randomRange(marginY, cellBounds.height * 0.35),
  };
  const end = {
    x: cellBounds.x + randomRange(marginX, cellBounds.width - marginX),
    y: cellBounds.y + randomRange(cellBounds.height * 0.65, cellBounds.height - marginY),
  };

  const controlCount = randomInt(1, 2);
  if (controlCount === 1) {
    return {
      start,
      end,
      control: [
        {
          x: cellBounds.x + randomRange(marginX, cellBounds.width - marginX),
          y: cellBounds.y + randomRange(marginY, cellBounds.height - marginY),
        },
      ],
    };
  }

  return {
    start,
    end,
    control: [
      {
        x: cellBounds.x + randomRange(marginX, cellBounds.width - marginX),
        y: cellBounds.y + randomRange(marginY, cellBounds.height * 0.5),
      },
      {
        x: cellBounds.x + randomRange(marginX, cellBounds.width - marginX),
        y: cellBounds.y + randomRange(cellBounds.height * 0.5, cellBounds.height - marginY),
      },
    ],
  };
}
