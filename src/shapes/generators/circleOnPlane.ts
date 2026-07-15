import type { Rect, CircleOnPlaneParams, Point } from '../../types';
import { randomRange } from '../../utils';

function rotate(v: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function mul(p: Point, s: number): Point {
  return { x: p.x * s, y: p.y * s };
}

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

export function generateCircleOnPlane(cellBounds: Rect): CircleOnPlaneParams {
  const minDim = Math.min(cellBounds.width, cellBounds.height);
  const margin = minDim * 0.12;
  const cx = cellBounds.x + cellBounds.width / 2;
  const cy = cellBounds.y + cellBounds.height / 2;
  const outlineScale = 1.4;

  for (let attempt = 0; attempt < 30; attempt++) {
    const center = {
      x: cx + randomRange(-minDim * 0.05, minDim * 0.05),
      y: cy + randomRange(-minDim * 0.05, minDim * 0.05),
    };

    const angleU = randomRange(0, Math.PI * 2);
    const lenU = randomRange(minDim * 0.15, minDim * 0.36);
    const u = rotate({ x: lenU, y: 0 }, angleU);

    const angleV = angleU + randomRange(Math.PI / 4, 3 * Math.PI / 4);
    const lenV = randomRange(minDim * 0.12, minDim * 0.32);
    const v = rotate({ x: lenV, y: 0 }, angleV);

    const radius = (lenU + lenV) / 2;

    const corners = [
      add(add(center, mul(u, outlineScale)), mul(v, outlineScale)),
      add(sub(center, mul(u, outlineScale)), mul(v, outlineScale)),
      add(add(center, mul(u, -outlineScale)), mul(v, -outlineScale)),
      add(sub(center, mul(u, -outlineScale)), mul(v, -outlineScale)),
    ];

    if (
      corners.every(
        (p) =>
          p.x >= cellBounds.x + margin &&
          p.x <= cellBounds.x + cellBounds.width - margin &&
          p.y >= cellBounds.y + margin &&
          p.y <= cellBounds.y + cellBounds.height - margin
      )
    ) {
      // Point the normal along the more foreshortened axis so it looks like it's
      // coming out of the tilted plane.
      const minor = lenV <= lenU ? v : u;
      const normalAngle = normalizeAngle(Math.atan2(minor.y, minor.x));

      return {
        center,
        u,
        v,
        radius,
        normalAngle,
      };
    }
  }

  // Fallback: a simple centered ellipse.
  const r = minDim * 0.25;
  return {
    center: { x: cx, y: cy },
    u: { x: r, y: 0 },
    v: { x: 0, y: r * 0.7 },
    radius: r,
    normalAngle: Math.PI / 4,
  };
}

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}
