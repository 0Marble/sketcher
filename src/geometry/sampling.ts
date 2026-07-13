import type { Point } from '../types';
import type { SampledPoint, SampledCurve } from './types';

const KAPPA = 0.55228475;

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function sampleLine(a: Point, b: Point, spacing: number): SampledPoint[] {
  const len = distance(a, b);
  if (len === 0) return [{ ...a, t: 0 }];
  const count = Math.max(2, Math.ceil(len / spacing));
  const result: SampledPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    result.push({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), t });
  }
  return result;
}

export function samplePolyline(points: Point[], spacing: number): SampledPoint[] {
  if (points.length === 0) return [];
  if (points.length === 1) return [{ ...points[0], t: 0 }];

  const result: SampledPoint[] = [{ ...points[0], t: 0 }];
  let accumulated = 0;
  let totalLen = 0;
  for (let i = 1; i < points.length; i++) {
    totalLen += distance(points[i - 1], points[i]);
  }
  if (totalLen === 0) return result;

  let remaining = spacing;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segLen = distance(a, b);
    if (segLen === 0) continue;
    let pos = remaining;
    while (pos <= segLen) {
      const t = pos / segLen;
      const x = lerp(a.x, b.x, t);
      const y = lerp(a.y, b.y, t);
      accumulated += spacing;
      result.push({ x, y, t: accumulated / totalLen });
      pos += spacing;
    }
    remaining = pos - segLen;
  }

  // Ensure end point is included.
  const last = points[points.length - 1];
  const lastT = result[result.length - 1]?.t ?? 0;
  if (distance(last, result[result.length - 1]) > 0.01) {
    result.push({ ...last, t: Math.max(lastT, 1) });
  }
  return result;
}

export function cubicBezierPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

export function sampleCubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  spacing: number
): SampledPoint[] {
  const result: SampledPoint[] = [];

  function recurse(a: Point, b: Point, c: Point, d: Point, t0: number, t1: number) {
    const chord = distance(a, d);
    if (chord <= spacing || t1 - t0 < 1e-4) {
      if (result.length === 0) result.push({ ...a, t: t0 });
      result.push({ ...d, t: t1 });
      return;
    }
    const tm = (t0 + t1) / 2;
    const ab = lerpPoint(a, b, 0.5);
    const bc = lerpPoint(b, c, 0.5);
    const cd = lerpPoint(c, d, 0.5);
    const abbc = lerpPoint(ab, bc, 0.5);
    const bccd = lerpPoint(bc, cd, 0.5);
    const m = lerpPoint(abbc, bccd, 0.5);
    recurse(a, ab, abbc, m, t0, tm);
    recurse(m, bccd, cd, d, tm, t1);
  }

  recurse(p0, p1, p2, p3, 0, 1);

  // Remove duplicate endpoints from recursion.
  return result.filter((p, i) => i === 0 || distance(p, result[i - 1]) > 1e-6);
}

export function quadraticBezierPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function sampleQuadraticBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  spacing: number
): SampledPoint[] {
  // Convert to cubic for adaptive sampling.
  const c1 = lerpPoint(p0, p1, 2 / 3);
  const c2 = lerpPoint(p2, p1, 2 / 3);
  return sampleCubicBezier(p0, c1, c2, p2, spacing);
}

export interface CubicBezier {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

export function circleToBeziers(center: Point, radius: number): CubicBezier[] {
  const k = radius * KAPPA;
  const r = radius;
  const cx = center.x;
  const cy = center.y;
  return [
    {
      p0: { x: cx, y: cy - r },
      p1: { x: cx + k, y: cy - r },
      p2: { x: cx + r, y: cy - k },
      p3: { x: cx + r, y: cy },
    },
    {
      p0: { x: cx + r, y: cy },
      p1: { x: cx + r, y: cy + k },
      p2: { x: cx + k, y: cy + r },
      p3: { x: cx, y: cy + r },
    },
    {
      p0: { x: cx, y: cy + r },
      p1: { x: cx - k, y: cy + r },
      p2: { x: cx - r, y: cy + k },
      p3: { x: cx - r, y: cy },
    },
    {
      p0: { x: cx - r, y: cy },
      p1: { x: cx - r, y: cy - k },
      p2: { x: cx - k, y: cy - r },
      p3: { x: cx, y: cy - r },
    },
  ];
}

export function ellipseToBeziers(
  center: Point,
  rx: number,
  ry: number,
  rotation: number
): CubicBezier[] {
  const kx = rx * KAPPA;
  const ky = ry * KAPPA;
  const cx = center.x;
  const cy = center.y;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  function rot(p: Point): Point {
    const dx = p.x - cx;
    const dy = p.y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }

  const raw: CubicBezier[] = [
    {
      p0: { x: cx, y: cy - ry },
      p1: { x: cx + kx, y: cy - ry },
      p2: { x: cx + rx, y: cy - ky },
      p3: { x: cx + rx, y: cy },
    },
    {
      p0: { x: cx + rx, y: cy },
      p1: { x: cx + rx, y: cy + ky },
      p2: { x: cx + kx, y: cy + ry },
      p3: { x: cx, y: cy + ry },
    },
    {
      p0: { x: cx, y: cy + ry },
      p1: { x: cx - kx, y: cy + ry },
      p2: { x: cx - rx, y: cy + ky },
      p3: { x: cx - rx, y: cy },
    },
    {
      p0: { x: cx - rx, y: cy },
      p1: { x: cx - rx, y: cy - ky },
      p2: { x: cx - kx, y: cy - ry },
      p3: { x: cx, y: cy - ry },
    },
  ];

  return raw.map((b) => ({
    p0: rot(b.p0),
    p1: rot(b.p1),
    p2: rot(b.p2),
    p3: rot(b.p3),
  }));
}

export function sampleCurves(curves: CubicBezier[], spacing: number): SampledCurve {
  const points: SampledPoint[] = [];
  for (const c of curves) {
    const samples = sampleCubicBezier(c.p0, c.p1, c.p2, c.p3, spacing);
    if (points.length > 0 && samples.length > 0) {
      // Avoid duplicate shared endpoints.
      const last = points[points.length - 1];
      const first = samples[0];
      if (distance(last, first) > 1e-6) {
        points.push(...samples);
      } else {
        points.push(...samples.slice(1));
      }
    } else {
      points.push(...samples);
    }
  }
  return { points, closed: true };
}
