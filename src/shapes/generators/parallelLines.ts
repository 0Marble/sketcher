import type { Rect, ParallelLinesParams, Point } from '../../types';
import { randomRange, randomInt } from '../../utils';

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function mul(p: Point, s: number): Point {
  return { x: p.x * s, y: p.y * s };
}

function rotate(v: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

function inside(p: Point, bounds: Rect, margin: number): boolean {
  return (
    p.x >= bounds.x + margin &&
    p.x <= bounds.x + bounds.width - margin &&
    p.y >= bounds.y + margin &&
    p.y <= bounds.y + bounds.height - margin
  );
}

export function generateParallelLines(cellBounds: Rect): ParallelLinesParams {
  const minDim = Math.min(cellBounds.width, cellBounds.height);
  const margin = minDim * 0.12;
  const cx = cellBounds.x + cellBounds.width / 2;
  const cy = cellBounds.y + cellBounds.height / 2;

  for (let attempt = 0; attempt < 20; attempt++) {
    const angle = randomRange(0, Math.PI);
    const guideLength = randomRange(minDim * 0.5, minDim * 0.7);
    const topLength = randomRange(minDim * 0.35, minDim * 0.65);
    const height = randomRange(minDim * 0.25, minDim * 0.42);
    const alongShift = randomRange(-minDim * 0.12, minDim * 0.12);

    const dir = rotate({ x: 1, y: 0 }, angle);
    // The perpendicular vector is always (-y, x) for a 90-degree CCW rotation.
    // This ensures the top line is always placed at a 90-degree offset from the guide.
    const finalPerp = { x: -dir.y, y: dir.x };

    const guideCenter = { x: cx + randomRange(-10, 10), y: cy + randomRange(-10, 10) };
    const guideLine = {
      start: add(guideCenter, mul(dir, -guideLength / 2)),
      end: add(guideCenter, mul(dir, guideLength / 2)),
    };

    const topCenter = add(add(guideCenter, mul(finalPerp, height)), mul(dir, alongShift));
    const topLine = {
      start: add(topCenter, mul(dir, -topLength / 2)),
      end: add(topCenter, mul(dir, topLength / 2)),
    };

    const corners = [guideLine.start, guideLine.end, topLine.start, topLine.end];
    if (corners.every((p) => inside(p, cellBounds, margin))) {
      return { guideLine, topLine, count: randomInt(3, 5) };
    }
  }

  // Fallback: a simple centered trapezoid.
  const guideLength = minDim * 0.5;
  const height = minDim * 0.3;
  return {
    guideLine: {
      start: { x: cx - guideLength / 2, y: cy + height / 2 },
      end: { x: cx + guideLength / 2, y: cy + height / 2 },
    },
    topLine: {
      start: { x: cx - guideLength * 0.35, y: cy - height / 2 },
      end: { x: cx + guideLength * 0.35, y: cy - height / 2 },
    },
    count: 3,
  };
}
