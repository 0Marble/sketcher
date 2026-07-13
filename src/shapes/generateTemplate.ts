import type { ExerciseType, Template, Rect, ScoringFlags } from '../types';
import { generateCircle } from './generators/circle';
import { generateEllipse } from './generators/ellipse';
import { generateParallelLines } from './generators/parallelLines';
import { generateConvergingLines } from './generators/convergingLines';
import { generateCurvedLine } from './generators/curvedLines';

export function canonicalCellBounds(size: number): Rect {
  return { x: 0, y: 0, width: size, height: size };
}

function flagsFor(type: ExerciseType): ScoringFlags {
  switch (type) {
    case 'circle':
    case 'ellipse':
    case 'curvedLines':
      return { ignoreStrokeCount: false, ignoreStrokeOrder: true, ignoreDirection: true };
    case 'parallelLines':
    case 'convergingLines':
      return { ignoreStrokeCount: false, ignoreStrokeOrder: false, ignoreDirection: false };
  }
}

export function generateTemplate(type: ExerciseType, cellSize: number): Template {
  const bounds = canonicalCellBounds(cellSize);
  switch (type) {
    case 'circle':
      return { type, params: generateCircle(bounds), flags: flagsFor(type), cellBounds: bounds };
    case 'ellipse':
      return { type, params: generateEllipse(bounds), flags: flagsFor(type), cellBounds: bounds };
    case 'parallelLines':
      return { type, params: generateParallelLines(bounds), flags: flagsFor(type), cellBounds: bounds };
    case 'convergingLines':
      return { type, params: generateConvergingLines(bounds), flags: flagsFor(type), cellBounds: bounds };
    case 'curvedLines':
      return { type, params: generateCurvedLine(bounds), flags: flagsFor(type), cellBounds: bounds };
  }
}
