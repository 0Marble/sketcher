import type { Stroke, ExerciseType, ExerciseParams, ScoringFlags } from '../types';
import { buildTargetCurves } from '../geometry/targetCurves';
import { vectorScore, type VectorScoreResult } from './vectorScore';

export function scoreCell(
  type: ExerciseType,
  params: ExerciseParams,
  strokes: Stroke[],
  flags: ScoringFlags
): VectorScoreResult {
  const targetCurves = buildTargetCurves(type, params);
  return vectorScore(targetCurves, strokes, flags);
}
