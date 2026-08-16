import type { ProgressData } from "./progress";

/**
 * Rolling view of current skill: averages over the most recent sessions,
 * so early beginner results stop dragging the numbers down as Estrella
 * improves. Lifetime history stays untouched for progress charts.
 */

export const RECENT_SESSION_WINDOW = 5;

const average = (values: number[]): number | null =>
  values.length > 0
    ? values.reduce((acc, value) => acc + value, 0) / values.length
    : null;

export function recentAverages(progress: ProgressData): {
  ppm: number | null;
  accuracy: number | null;
} {
  const recent = progress.sessions.slice(-RECENT_SESSION_WINDOW);
  return {
    ppm: average(recent.map((s) => s.ppm)),
    accuracy: average(
      recent.map((s) => s.accuracy).filter((a): a is number => a !== null),
    ),
  };
}
