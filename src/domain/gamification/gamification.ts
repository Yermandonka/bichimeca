import type { ProgressData } from "@/domain/progress/progress";

/**
 * Reward primitives. Stars are computed from stored session accuracy (no
 * schema field, so past results re-rate automatically if thresholds are
 * tuned). The streak counts consecutive practice days and stays "alive"
 * through yesterday so it never guilt-trips before today's practice.
 */

/** Accuracy thresholds for stars; tune here, never inline. */
export const STAR_THRESHOLDS = {
  /** 2 stars: good execution. */
  good: 0.95,
  /** 3 stars: mastery-level execution. */
  mastery: 0.97,
} as const;

export type Stars = 0 | 1 | 2 | 3;

/** Stars earned by a completed attempt with the given accuracy. */
export function starsForAccuracy(accuracy: number | null): Stars {
  if (accuracy === null) return 1;
  if (accuracy >= STAR_THRESHOLDS.mastery) return 3;
  if (accuracy >= STAR_THRESHOLDS.good) return 2;
  return 1;
}

/** Best stars achieved for a lesson across all attempts; 0 if never done. */
export function lessonStars(progress: ProgressData, lessonId: string): Stars {
  let best: Stars = 0;
  for (const session of progress.sessions) {
    if (session.lessonId !== lessonId) continue;
    const stars = starsForAccuracy(session.accuracy);
    if (stars > best) best = stars;
  }
  return best;
}

/** Calendar day (YYYY-MM-DD) of an ISO timestamp, in UTC. */
function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive practice days ending today or yesterday (a streak is only
 * broken once a full day passes without practice). `today` is YYYY-MM-DD.
 */
export function practiceStreak(progress: ProgressData, today: string): number {
  const days = new Set(progress.sessions.map((session) => dayOf(session.completedAt)));
  let cursor = days.has(today) ? today : previousDay(today);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}
