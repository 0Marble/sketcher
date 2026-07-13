import type { Point } from '../types';

export interface SampledPoint extends Point {
  t: number; // normalized parameter along the curve / segment
}

export interface SampledCurve {
  points: SampledPoint[];
  closed: boolean;
}

export interface PerPointError {
  distance: number;
  color: string;
}
