import { describe, it, expect } from 'vitest';
import { generateCircle } from '../src/shapes/generators/circle';
import { generateEllipse } from '../src/shapes/generators/ellipse';
import { generateParallelLines } from '../src/shapes/generators/parallelLines';
import { generateConvergingLines } from '../src/shapes/generators/convergingLines';
import { generateCurvedLine } from '../src/shapes/generators/curvedLines';

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
});
