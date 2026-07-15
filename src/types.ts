export type ExerciseType =
  | 'circle'
  | 'ellipse'
  | 'parallelLines'
  | 'convergingLines'
  | 'curvedLines'
  | 'circleOnPlane'
  | 'cube';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface StrokePoint extends Point {
  pressure: number;
  time: number;
}

export type Stroke = StrokePoint[];

export interface CircleParams {
  center: Point;
  radius: number;
}

export interface EllipseParams {
  center: Point;
  rx: number;
  ry: number;
  rotation: number; // radians
}

export interface ParallelLinesParams {
  guideLine: { start: Point; end: Point };
  topLine: { start: Point; end: Point };
  count: number;
}

export interface ConvergingLinesParams {
  vanishingPoint: Point;
  basePoints: [Point, Point];
}

export interface CurvedLinesParams {
  start: Point;
  end: Point;
  control: [Point] | [Point, Point];
}

export interface CircleOnPlaneParams {
  center: Point;
  u: Point;
  v: Point;
  radius: number;
  normalAngle: number;
}

export interface CubeParams {
  edges: { start: Point; end: Point }[];
  frontFaceCenter: Point;
  upVector: Point;
  normalVector: Point;
}

export type ExerciseParams =
  | CircleParams
  | EllipseParams
  | ParallelLinesParams
  | ConvergingLinesParams
  | CurvedLinesParams
  | CircleOnPlaneParams
  | CubeParams;

export interface ScoringFlags {
  ignoreStrokeCount: boolean;
  ignoreStrokeOrder: boolean;
  ignoreDirection: boolean;
}

export interface Template {
  type: ExerciseType;
  params: ExerciseParams;
  flags: ScoringFlags;
  cellBounds: Rect;
}

import type { PerPointError } from './geometry/types';

export type CellKind = 'trace' | 'practice';

export interface CellState {
  index: number;
  kind: CellKind;
  strokes: Stroke[];
  score?: number;
  perPointErrors?: PerPointError[][];
}

export interface WorksheetResult {
  type: ExerciseType;
  params: ExerciseParams;
  cellScores: number[];
  finalScore: number;
  timestamp: number;
}

export interface StoredAttempt extends WorksheetResult {
  id: string;
}

export interface HistoryStats {
  count: number;
  best: number;
  average: number;
}
