import type { KeyStats } from "@/domain/engine/session";
import { median } from "@/domain/metrics/stats";
import type { KeyStatRecord } from "./progress";

/**
 * Folds one completed session's per-key stats into the stored lifetime
 * record. Lifetime counters accumulate forever; the EWMA fields track
 * *recent* skill so old beginner mistakes lose influence over time
 * (alpha = weight of the newest session).
 */

export const KEY_STATS_EWMA_ALPHA = 0.3;

function blend(previous: number | null, observed: number | null): number | null {
  if (observed === null) return previous;
  if (previous === null) return observed;
  return KEY_STATS_EWMA_ALPHA * observed + (1 - KEY_STATS_EWMA_ALPHA) * previous;
}

export function mergeSessionKeyStats(
  existing: Record<string, KeyStatRecord>,
  sessionStats: ReadonlyMap<string, KeyStats>,
  nowIso: string,
): Record<string, KeyStatRecord> {
  const merged: Record<string, KeyStatRecord> = { ...existing };

  for (const [key, stats] of sessionStats) {
    const previous = merged[key];
    const sessionAccuracy = stats.attempts > 0 ? stats.correct / stats.attempts : null;
    const sessionLatency =
      stats.latenciesMs.length > 0 ? median(stats.latenciesMs) : null;

    merged[key] = {
      attempts: (previous?.attempts ?? 0) + stats.attempts,
      correct: (previous?.correct ?? 0) + stats.correct,
      errors: (previous?.errors ?? 0) + stats.errors,
      accuracyEwma: blend(previous?.accuracyEwma ?? null, sessionAccuracy),
      latencyEwmaMs: blend(previous?.latencyEwmaMs ?? null, sessionLatency),
      lastPracticedAt: nowIso,
    };
  }

  return merged;
}
