/** Shared statistical helpers for metric computations. */

/** Median of a non-empty list of numbers; the input is not mutated. */
export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error("median requiere al menos un valor");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
