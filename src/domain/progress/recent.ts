import type { ProgressData } from "./progress";

/**
 * Rolling view of current skill: averages over the most recent sessions,
 * so early beginner results stop dragging the numbers down as Estrella
 * improves. Lifetime history stays untouched for progress charts.
 */

export const RECENT_SESSION_WINDOW = 5;

export function recentAverages(progress: ProgressData): {
  ppm: number | null;
  accuracy: number | null;
} {
  const recent = progress.sessions.slice(-RECENT_SESSION_WINDOW);
  if (recent.length === 0) return { ppm: null, accuracy: null };

  const ppm = recent.reduce((acc, s) => acc + s.ppm, 0) / recent.length;

  const withAccuracy = recent.filter((s) => s.accuracy !== null);
  const accuracy =
    withAccuracy.length > 0
      ? withAccuracy.reduce((acc, s) => acc + (s.accuracy as number), 0) /
        withAccuracy.length
      : null;

  return { ppm, accuracy };
}
