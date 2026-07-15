import { describe, it, expect } from 'vitest';
import { generateCircle } from '../src/shapes/generators/circle';
import { generateEllipse } from '../src/shapes/generators/ellipse';
import { generateParallelLines } from '../src/shapes/generators/parallelLines';
import { generateConvergingLines } from '../src/shapes/generators/convergingLines';
import { generateCurvedLine } from '../src/shapes/generators/curvedLines';
import { generateCircleOnPlane } from '../src/shapes/generators/circleOnPlane';
import { generateCube } from '../src/shapes/generators/cube';

const CELL_SIZE = 200;
const bounds = { x: 0, y: 0, width: CELL_SIZE, height: CELL_SIZE };

describe('shape generators', () => {
  it('generates a circle inside the cell', () => {
    const c = generateCircle(bounds);
    expect(c.radius).toBeGreaterThan(0);
    expect(c.center.x).toBeGreaterThan(0);
    expect(c.center.x).toBeLessThan(CELL_SIZE);
    expect(c.center.y).toBeGreaterThan(0);
    expect(c.center.y).toBeLessThan(CELL_SIZE);
    expect(c.center.x - c.radius).toBeGreaterThanOrEqual(0);
    expect(c.center.x + c.radius).toBeLessThanOrEqual(CELL_SIZE);
    expect(c.center.y - c.radius).toBeGreaterThanOrEqual(0);
    expect(c.center.y + c.radius).toBeLessThanOrEqual(CELL_SIZE);
  });

  it('generates an ellipse inside the cell', () => {
    const e = generateEllipse(bounds);
    expect(e.rx).toBeGreaterThan(0);
    expect(e.ry).toBeGreaterThan(0);
    expect(e.center.x).toBe(CELL_SIZE / 2);
    expect(e.center.y).toBe(CELL_SIZE / 2);
  });

  it('generates parallel lines as a trapezoid inside the cell', () => {
    const p = generateParallelLines(bounds);
    expect(p.count).toBeGreaterThanOrEqual(3);
    expect(p.guideLine.start.x).toBeGreaterThan(0);
    expect(p.guideLine.start.x).toBeLessThan(CELL_SIZE);
    expect(p.guideLine.end.x).toBeGreaterThan(0);
    expect(p.guideLine.end.x).toBeLessThan(CELL_SIZE);
    expect(p.topLine.start.x).toBeGreaterThan(0);
    expect(p.topLine.start.x).toBeLessThan(CELL_SIZE);
    expect(p.topLine.end.x).toBeGreaterThan(0);
    expect(p.topLine.end.x).toBeLessThan(CELL_SIZE);
  });

  it('generates converging lines inside the cell', () => {
    const c = generateConvergingLines(bounds);
    expect(c.vanishingPoint.x).toBeGreaterThan(0);
    expect(c.vanishingPoint.x).toBeLessThan(CELL_SIZE);
    expect(c.vanishingPoint.y).toBeGreaterThan(0);
    expect(c.vanishingPoint.y).toBeLessThan(CELL_SIZE);
    expect(c.basePoints).toHaveLength(2);
  });

  it('generates a curved line with endpoints inside the cell', () => {
    const c = generateCurvedLine(bounds);
    expect(c.start.x).toBeGreaterThan(0);
    expect(c.start.x).toBeLessThan(CELL_SIZE);
    expect(c.start.y).toBeGreaterThan(0);
    expect(c.start.y).toBeLessThan(CELL_SIZE);
    expect(c.end.x).toBeGreaterThan(0);
    expect(c.end.x).toBeLessThan(CELL_SIZE);
    expect(c.end.y).toBeGreaterThan(0);
    expect(c.end.y).toBeLessThan(CELL_SIZE);
    expect(c.control.length).toBeGreaterThanOrEqual(1);
  });

  it('generates a circle on a plane with valid basis and radius', () => {
    const c = generateCircleOnPlane(bounds);
    expect(c.radius).toBeGreaterThan(0);
    expect(c.center.x).toBeGreaterThan(0);
    expect(c.center.x).toBeLessThan(CELL_SIZE);
    expect(c.center.y).toBeGreaterThan(0);
    expect(c.center.y).toBeLessThan(CELL_SIZE);
    const uLen = Math.hypot(c.u.x, c.u.y);
    const vLen = Math.hypot(c.v.x, c.v.y);
    expect(uLen).toBeGreaterThan(0);
    expect(vLen).toBeGreaterThan(0);
    expect(c.normalAngle).toBeGreaterThanOrEqual(0);
    expect(c.normalAngle).toBeLessThan(Math.PI * 2);
  });

  it('generates a cube with edges and front-face guide vectors', () => {
    const c = generateCube(bounds);
    expect(c.edges).toHaveLength(12);
    expect(c.frontFaceCenter.x).toBeGreaterThan(0);
    expect(c.frontFaceCenter.x).toBeLessThan(CELL_SIZE);
    expect(c.frontFaceCenter.y).toBeGreaterThan(0);
    expect(c.frontFaceCenter.y).toBeLessThan(CELL_SIZE);
    expect(Math.hypot(c.upVector.x, c.upVector.y)).toBeGreaterThan(0);
    expect(Math.hypot(c.normalVector.x, c.normalVector.y)).toBeGreaterThan(0);
    for (const e of c.edges) {
      expect(e.start.x).toBeGreaterThanOrEqual(bounds.x);
      expect(e.start.x).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(e.start.y).toBeGreaterThanOrEqual(bounds.y);
      expect(e.start.y).toBeLessThanOrEqual(bounds.y + bounds.height);
      expect(e.end.x).toBeGreaterThanOrEqual(bounds.x);
      expect(e.end.x).toBeLessThanOrEqual(bounds.x + bounds.width);
      expect(e.end.y).toBeGreaterThanOrEqual(bounds.y);
      expect(e.end.y).toBeLessThanOrEqual(bounds.y + bounds.height);
    }
  });
});
