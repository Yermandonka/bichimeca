import type { KeyStats, SessionSummary } from "./session";
import { accuracy, ppm, rawPpm } from "@/domain/metrics/metrics";

/**
 * Aggregation of per-exercise results into one lesson-level result.
 * Pure and UI-independent so lesson totals stay testable.
 */

export interface CompletedExercise {
  summary: SessionSummary;
  keyStats: ReadonlyMap<string, KeyStats>;
}

export interface LessonTotals {
  durationMs: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errors: number;
  accuracy: number | null;
  ppm: number;
  rawPpm: number;
  /** Duration-weighted blend of the per-exercise rhythm scores, or null. */
  consistency: number | null;
}

export function combineKeyStats(
  exercises: CompletedExercise[],
): Map<string, KeyStats> {
  const combined = new Map<string, KeyStats>();
  for (const exercise of exercises) {
    for (const [key, stats] of exercise.keyStats) {
      const previous = combined.get(key);
      combined.set(key, {
        attempts: (previous?.attempts ?? 0) + stats.attempts,
        correct: (previous?.correct ?? 0) + stats.correct,
        errors: (previous?.errors ?? 0) + stats.errors,
        latenciesMs: [...(previous?.latenciesMs ?? []), ...stats.latenciesMs],
      });
    }
  }
  return combined;
}

export function combineSummaries(exercises: CompletedExercise[]): LessonTotals {
  const totals = exercises.reduce(
    (acc, { summary }) => ({
      durationMs: acc.durationMs + summary.durationMs,
      totalKeystrokes: acc.totalKeystrokes + summary.totalKeystrokes,
      correctKeystrokes: acc.correctKeystrokes + summary.correctKeystrokes,
      errors: acc.errors + summary.errors,
    }),
    { durationMs: 0, totalKeystrokes: 0, correctKeystrokes: 0, errors: 0 },
  );

  const withConsistency = exercises.filter(
    ({ summary }) => summary.consistency !== null && summary.durationMs > 0,
  );
  const weightTotal = withConsistency.reduce(
    (acc, { summary }) => acc + summary.durationMs,
    0,
  );
  const consistency =
    weightTotal > 0
      ? withConsistency.reduce(
          (acc, { summary }) =>
            acc + summary.consistency! * (summary.durationMs / weightTotal),
          0,
        )
      : null;

  return {
    ...totals,
    accuracy: accuracy({
      correctKeystrokes: totals.correctKeystrokes,
      totalKeystrokes: totals.totalKeystrokes,
    }),
    ppm: ppm({ correctChars: totals.correctKeystrokes, durationMs: totals.durationMs }),
    rawPpm: rawPpm({
      totalChars: totals.totalKeystrokes,
      durationMs: totals.durationMs,
    }),
    consistency,
  };
}
