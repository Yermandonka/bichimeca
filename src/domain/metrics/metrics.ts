/**
 * Core typing metrics for Bichimeca.
 *
 * Conventions (documented per product spec):
 * - PPM (palabras por minuto): 1 word = 5 typed characters.
 *   - Net PPM uses only correctly typed characters.
 *   - Raw PPM uses all typed characters, before accounting for errors.
 * - Accuracy: correct keystrokes / total relevant keystrokes, as a 0..1 fraction.
 * - Consistency: 0..100 rhythm score derived from robust (median/MAD)
 *   dispersion of inter-keystroke intervals, so a single interruption does
 *   not distort the metric.
 *
 * All functions must return finite numbers or null — never NaN/Infinity.
 */

import { median } from "./stats";

export const CHARS_PER_WORD = 5;

/** Minimum inter-keystroke intervals required before rhythm is meaningful. */
export const MIN_INTERVALS_FOR_CONSISTENCY = 5;

const msToMinutes = (durationMs: number): number => durationMs / 60_000;

function wordsPerMinute(chars: number, durationMs: number): number {
  if (durationMs <= 0) return 0;
  const words = Math.max(0, chars) / CHARS_PER_WORD;
  return words / msToMinutes(durationMs);
}

/** Net typing speed in palabras por minuto. */
export function ppm(input: { correctChars: number; durationMs: number }): number {
  return wordsPerMinute(input.correctChars, input.durationMs);
}

/** Raw typing speed (before accounting for errors) in palabras por minuto. */
export function rawPpm(input: { totalChars: number; durationMs: number }): number {
  return wordsPerMinute(input.totalChars, input.durationMs);
}

/** Clamped 0..1 ratio, or null when the denominator holds no data. */
function fractionOf(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.min(1, Math.max(0, numerator / denominator));
}

/**
 * Accuracy as a 0..1 fraction, or null when there is no data.
 * Clamped so inconsistent inputs can never report more than 100 %.
 */
export function accuracy(input: {
  correctKeystrokes: number;
  totalKeystrokes: number;
}): number | null {
  return fractionOf(input.correctKeystrokes, input.totalKeystrokes);
}

/** Error rate as a 0..1 fraction, or null when there is no data. */
export function errorRate(input: {
  errors: number;
  totalKeystrokes: number;
}): number | null {
  return fractionOf(input.errors, input.totalKeystrokes);
}

/**
 * Rhythm consistency score in 0..100 from inter-keystroke intervals (ms).
 *
 * Uses the median absolute deviation relative to the median interval, a
 * robust dispersion measure: one long pause barely moves it, while genuinely
 * bursty typing scores clearly lower. Returns null when there is not enough
 * data to say anything meaningful.
 */
export function consistencyScore(intervalsMs: number[]): number | null {
  const valid = intervalsMs.filter((interval) => interval > 0);
  if (valid.length < MIN_INTERVALS_FOR_CONSISTENCY) return null;

  // `valid` holds only positive intervals, so the median is always positive.
  const med = median(valid);
  const mad = median(valid.map((interval) => Math.abs(interval - med)));
  const relativeDispersion = mad / med;

  const score = 100 * (1 - relativeDispersion);
  return Math.min(100, Math.max(0, score));
}
