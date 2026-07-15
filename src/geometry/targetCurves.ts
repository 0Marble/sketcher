import type { ExerciseType, ExerciseParams } from '../types';
import type { SampledCurve } from './types';
import {
  sampleLine,
  sampleQuadraticBezier,
  sampleCubicBezier,
  sampleCurves,
  circleToBeziers,
  ellipseToBeziers,
} from './sampling';

const SAMPLE_SPACING = 2; // canonical pixels

export function buildTargetCurves(
  type: ExerciseType,
  params: ExerciseParams
): SampledCurve[] {
  switch (type) {
    case 'circle': {
      const p = params as import('../types').CircleParams;
      return [sampleCurves(circleToBeziers(p.center, p.radius), SAMPLE_SPACING)];
    }
    case 'ellipse': {
      const p = params as import('../types').EllipseParams;
      return [sampleCurves(ellipseToBeziers(p.center, p.rx, p.ry, p.rotation), SAMPLE_SPACING)];
    }
    case 'parallelLines': {
      const p = params as import('../types').ParallelLinesParams;
      return parallelLineCurves(p);
    }
    case 'convergingLines': {
      const p = params as import('../types').ConvergingLinesParams;
      return p.basePoints.map((base) => ({
        points: sampleLine(base, p.vanishingPoint, SAMPLE_SPACING),
        closed: false,
      }));
    }
    case 'curvedLines': {
      const p = params as import('../types').CurvedLinesParams;
      if (p.control.length === 1) {
        return [
          {
            points: sampleQuadraticBezier(p.start, p.control[0], p.end, SAMPLE_SPACING),
            closed: false,
          },
        ];
      }
      const [c1, c2] = p.control;
      return [
        {
          points: sampleCubicBezier(p.start, c1, c2, p.end, SAMPLE_SPACING),
          closed: false,
        },
      ];
    }
    case 'circleOnPlane': {
      const p = params as import('../types').CircleOnPlaneParams;
      return [sampleCircleOnPlane(p)];
    }
    case 'cube': {
      const p = params as import('../types').CubeParams;
      return p.edges.map((e) => ({
        points: sampleLine(e.start, e.end, SAMPLE_SPACING),
        closed: false,
      }));
    }
  }
}

function parallelLineCurves(
  p: import('../types').ParallelLinesParams
): SampledCurve[] {
  const curves: SampledCurve[] = [];
  for (let i = 0; i < p.count; i++) {
    const t = p.count === 1 ? 0 : i / (p.count - 1);
    const start = lerpPoint(p.guideLine.start, p.topLine.start, t);
    const end = lerpPoint(p.guideLine.end, p.topLine.end, t);
    curves.push({ points: sampleLine(start, end, SAMPLE_SPACING), closed: false });
  }
  return curves;
}

function lerpPoint(a: import('../types').Point, b: import('../types').Point, t: number): import('../types').Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function sampleCircleOnPlane(p: import('../types').CircleOnPlaneParams): SampledCurve {
  const count = Math.max(32, Math.ceil((Math.hypot(p.u.x, p.u.y) + Math.hypot(p.v.x, p.v.y)) * Math.PI / SAMPLE_SPACING));
  const points: import('./types').SampledPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    points.push({
      x: p.center.x + p.u.x * cos + p.v.x * sin,
      y: p.center.y + p.u.y * cos + p.v.y * sin,
      t,
    });
  }
  return { points, closed: true };
}
