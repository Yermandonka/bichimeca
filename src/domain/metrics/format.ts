/**
 * Learner-facing formatting for metrics.
 *
 * Display conventions follow the product spec examples:
 * accuracy "96.9 %", speed "38" (whole PPM), duration "2 min 14 s".
 */

/** Formats a 0..1 accuracy fraction as a percentage, or an em dash for no data. */
export function formatAccuracy(fraction: number | null): string {
  if (fraction === null) return "—";
  const percent = fraction * 100;
  if (percent === 100) return "100 %";
  return `${percent.toFixed(1)} %`;
}

/** Formats a PPM value as a whole number for display. */
export function formatPpm(value: number): string {
  return String(Math.round(value));
}

/** Formats a duration in ms as "M min S s" or "S s" below one minute. */
export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} s`;
  return `${minutes} min ${seconds} s`;
}
