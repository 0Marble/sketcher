import type { StoredAttempt, HistoryStats, ExerciseType, WorksheetResult } from '../types';

const STORAGE_KEY = 'sketcher_history_v1';

export function saveResult(result: WorksheetResult): StoredAttempt {
  const attempt: StoredAttempt = {
    ...result,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  };
  const history = getHistory();
  history.unshift(attempt);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return attempt;
}

export function getHistory(): StoredAttempt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredAttempt[];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStatsByType(type: ExerciseType): HistoryStats {
  const attempts = getHistory().filter((a) => a.type === type);
  if (attempts.length === 0) {
    return { count: 0, best: 0, average: 0 };
  }
  const scores = attempts.map((a) => a.finalScore);
  return {
    count: scores.length,
    best: Math.max(...scores),
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
  };
}

export function getAllStats(): Record<ExerciseType, HistoryStats> {
  const types: ExerciseType[] = [
    'circle',
    'ellipse',
    'parallelLines',
    'convergingLines',
    'curvedLines',
    'circleOnPlane',
    'cube',
  ];
  const stats = {} as Record<ExerciseType, HistoryStats>;
  for (const type of types) {
    stats[type] = getStatsByType(type);
  }
  return stats;
}
