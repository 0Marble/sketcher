import type { Stroke, ScoringFlags } from '../types';
import type { SampledCurve, SampledPoint, PerPointError } from '../geometry/types';
import { distance } from '../geometry/sampling';
import {
  symmetricCurveError,
  scoreFromError,
  computePerPointErrors,
  nearestDistance,
  errorColor,
} from '../geometry/distance';

const MAX_ERROR = 15;

export interface VectorScoreResult {
  score: number;
  error: number;
  perPointErrors: PerPointError[][];
}

function strokeToCurve(stroke: Stroke): SampledCurve {
  const n = stroke.length;
  return {
    points: stroke.map((p, i) => ({
      x: p.x,
      y: p.y,
      t: n <= 1 ? 0 : i / (n - 1),
    })),
    closed: false,
  };
}

function isReversed(target: SampledPoint[], drawn: SampledPoint[]): boolean {
  if (target.length < 2 || drawn.length < 2) return false;
  const startToStart = distance(drawn[0], target[0]);
  const startToEnd = distance(drawn[0], target[target.length - 1]);
  return startToEnd < startToStart;
}

function perPointErrorsForCurve(
  drawn: SampledPoint[],
  target: SampledPoint[]
): PerPointError[] {
  return drawn.map((p) => {
    const dist = target.length > 0 ? nearestDistance(p, target) : MAX_ERROR;
    return { distance: dist, color: errorColor(dist) };
  });
}

export function vectorScore(
  targetCurves: SampledCurve[],
  strokes: Stroke[],
  flags: ScoringFlags
): VectorScoreResult {
  const drawnCurves: SampledCurve[] = strokes.map(strokeToCurve);

  let error: number;
  let perPointErrors: PerPointError[][];

  if (flags.ignoreStrokeOrder) {
    const targetPoints = targetCurves.flatMap((c) => c.points);
    const drawnPoints = drawnCurves.flatMap((c) => c.points);
    const drawnCloud: SampledCurve = { points: drawnPoints, closed: false };
    const targetCloud: SampledCurve = { points: targetPoints, closed: false };
    error = symmetricCurveError(drawnCloud.points, targetCloud.points);
    perPointErrors = computePerPointErrors(drawnCurves, [targetCloud]);
  } else {
    let total = 0;
    let count = 0;
    perPointErrors = [];

    const maxIndex = Math.max(targetCurves.length, drawnCurves.length);
    for (let i = 0; i < maxIndex; i++) {
      const t = targetCurves[i]?.points ?? [];
      const d = drawnCurves[i]?.points ?? [];

      if (t.length === 0 || d.length === 0) {
        total += MAX_ERROR;
        count++;
        perPointErrors.push(
          d.map(() => ({
            distance: MAX_ERROR,
            color: errorColor(MAX_ERROR),
          }))
        );
        continue;
      }

      const reversed = !flags.ignoreDirection && isReversed(t, d);
      const dirPenalty = reversed ? MAX_ERROR * 0.25 : 0;

      total += symmetricCurveError(d, t) + dirPenalty;
      count++;

      perPointErrors.push(perPointErrorsForCurve(d, t));
    }

    error = count > 0 ? total / count : MAX_ERROR;
  }

  return {
    score: scoreFromError(error),
    error,
    perPointErrors,
  };
}
