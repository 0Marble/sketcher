import { describe, it, expect } from 'vitest';
import {
  sampleLine,
  samplePolyline,
  sampleCubicBezier,
  sampleQuadraticBezier,
  cubicBezierPoint,
  quadraticBezierPoint,
  circleToBeziers,
  ellipseToBeziers,
} from '../src/geometry/sampling';
import { symmetricCurveError, scoreFromError } from '../src/geometry/distance';
import { buildTargetCurves } from '../src/geometry/targetCurves';
import { vectorScore } from '../src/scoring/vectorScore';
import type { Stroke } from '../src/types';

function toStroke(points: { x: number; y: number }[]): Stroke {
  return points.map((p) => ({ x: p.x, y: p.y, pressure: 1, time: 0 }));
}

describe('sampling', () => {
  it('samples a line between endpoints', () => {
    const samples = sampleLine({ x: 0, y: 0 }, { x: 10, y: 0 }, 2);
    expect(samples.length).toBeGreaterThan(2);
    expect(samples[0]).toMatchObject({ x: 0, y: 0 });
    expect(samples[samples.length - 1]).toMatchObject({ x: 10, y: 0 });
  });

  it('samples a polyline with even spacing', () => {
    const samples = samplePolyline(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
      2
    );
    expect(samples.length).toBeGreaterThan(5);
    expect(samples[0]).toMatchObject({ x: 0, y: 0 });
    expect(samples[samples.length - 1]).toMatchObject({ x: 10, y: 10 });
  });

  it('samples a cubic bezier close to the curve', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 0, y: 50 };
    const p2 = { x: 100, y: 50 };
    const p3 = { x: 100, y: 100 };
    const samples = sampleCubicBezier(p0, p1, p2, p3, 2);
    expect(samples.length).toBeGreaterThan(10);
    // Endpoints should be exact.
    expect(samples[0]).toMatchObject(p0);
    expect(samples[samples.length - 1]).toMatchObject(p3);
    // Midpoint approximation should be near t=0.5.
    const mid = samples[Math.floor(samples.length / 2)];
    const expected = cubicBezierPoint(p0, p1, p2, p3, 0.5);
    expect(Math.hypot(mid.x - expected.x, mid.y - expected.y)).toBeLessThan(2);
  });

  it('samples a quadratic bezier close to the curve', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 50, y: 100 };
    const p2 = { x: 100, y: 0 };
    const samples = sampleQuadraticBezier(p0, p1, p2, 2);
    expect(samples.length).toBeGreaterThan(10);
    const mid = samples[Math.floor(samples.length / 2)];
    const expected = quadraticBezierPoint(p0, p1, p2, 0.5);
    expect(Math.hypot(mid.x - expected.x, mid.y - expected.y)).toBeLessThan(2);
  });

  it('approximates a circle with bezier arcs', () => {
    const curves = circleToBeziers({ x: 50, y: 50 }, 40);
    expect(curves).toHaveLength(4);
    // End of last arc should connect back to start of first arc.
    const firstStart = curves[0].p0;
    const lastEnd = curves[3].p3;
    expect(Math.hypot(firstStart.x - lastEnd.x, firstStart.y - lastEnd.y)).toBeLessThan(0.5);
  });

  it('approximates an ellipse with bezier arcs', () => {
    const curves = ellipseToBeziers({ x: 50, y: 50 }, 60, 30, Math.PI / 4);
    expect(curves).toHaveLength(4);
  });
});

describe('distance scoring', () => {
  it('gives a low error for identical curves', () => {
    const points = sampleLine({ x: 0, y: 0 }, { x: 100, y: 0 }, 2);
    const error = symmetricCurveError(points, points);
    expect(error).toBeLessThan(0.1);
  });

  it('gives a high error for distant curves', () => {
    const a = sampleLine({ x: 0, y: 0 }, { x: 100, y: 0 }, 2);
    const b = sampleLine({ x: 0, y: 50 }, { x: 100, y: 50 }, 2);
    const error = symmetricCurveError(a, b);
    expect(error).toBeGreaterThan(40);
  });

  it('penalizes missing coverage', () => {
    const full = sampleLine({ x: 0, y: 0 }, { x: 100, y: 0 }, 2);
    const partial = sampleLine({ x: 0, y: 0 }, { x: 30, y: 0 }, 2);
    const error = symmetricCurveError(full, partial);
    expect(error).toBeGreaterThan(10);
  });

  it('converts error to a 0-100 score', () => {
    expect(scoreFromError(0)).toBe(100);
    expect(scoreFromError(15)).toBe(0);
    expect(scoreFromError(7.5)).toBeCloseTo(50);
  });
});

describe('vector score integration', () => {
  it('scores a perfect circle trace highly', () => {
    const target = buildTargetCurves('circle', { center: { x: 100, y: 100 }, radius: 80 });
    // Use the target itself as the drawn stroke.
    const drawn = [toStroke(target[0].points)];
    const result = vectorScore(target, drawn, {
      ignoreStrokeCount: true,
      ignoreStrokeOrder: true,
      ignoreDirection: true,
    });
    expect(result.score).toBeGreaterThan(95);
  });

  it('scores two parallel lines in order', () => {
    const params = {
      guideLine: { start: { x: 40, y: 140 }, end: { x: 160, y: 140 } },
      topLine: { start: { x: 60, y: 60 }, end: { x: 140, y: 60 } },
      count: 2,
    };
    const target = buildTargetCurves('parallelLines', params);
    const drawn = target.map((c) => toStroke(c.points));
    const result = vectorScore(target, drawn, {
      ignoreStrokeCount: false,
      ignoreStrokeOrder: false,
      ignoreDirection: false,
    });
    expect(result.score).toBeGreaterThan(95);
  });

  it('penalizes reversed direction when direction matters', () => {
    const params = {
      guideLine: { start: { x: 40, y: 140 }, end: { x: 160, y: 140 } },
      topLine: { start: { x: 60, y: 60 }, end: { x: 140, y: 60 } },
      count: 1,
    };
    const target = buildTargetCurves('parallelLines', params);
    const drawn = [toStroke(target[0].points.slice().reverse())];
    const result = vectorScore(target, drawn, {
      ignoreStrokeCount: false,
      ignoreStrokeOrder: false,
      ignoreDirection: false,
    });
    expect(result.score).toBeLessThan(95);
  });
});
