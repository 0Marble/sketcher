import type { Point } from '../types';
import type { SampledCurve, SampledPoint, PerPointError } from './types';
import { distance } from './sampling';

const MAX_ERROR = 15; // canonical pixels

export function nearestDistance(point: Point, others: SampledPoint[]): number {
  let best = Infinity;
  for (const o of others) {
    const d = distance(point, o);
    if (d < best) best = d;
    if (best === 0) return 0;
  }
  return best;
}

export function nearestDistances(
  points: SampledPoint[],
  others: SampledPoint[]
): number[] {
  return points.map((p) => nearestDistance(p, others));
}

function average(values: number[]): number {
  if (values.length === 0) return MAX_ERROR;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function symmetricCurveError(
  a: SampledPoint[],
  b: SampledPoint[]
): number {
  if (a.length === 0 || b.length === 0) return MAX_ERROR;
  const aToB = nearestDistances(a, b);
  const bToA = nearestDistances(b, a);
  return (average(aToB) + average(bToA)) / 2;
}

export function scoreFromError(error: number): number {
  return Math.max(0, 100 - (error / MAX_ERROR) * 100);
}

export function errorColor(error: number): string {
  const ratio = Math.min(1, error / MAX_ERROR);
  // Green (120) → Yellow (60) → Red (0)
  const hue = (1 - ratio) * 120;
  return `hsl(${hue}, 90%, 45%)`;
}

export function computePerPointErrors(
  drawn: SampledCurve[],
  target: SampledCurve[]
): PerPointError[][] {
  const targetPoints = target.flatMap((c) => c.points);
  if (targetPoints.length === 0) return [];

  return drawn.map((curve) =>
    curve.points.map((p) => {
      const dist = nearestDistance(p, targetPoints);
      return { distance: dist, color: errorColor(dist) };
    })
  );
}
