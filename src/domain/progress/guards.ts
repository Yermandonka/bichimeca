/** Small structural type guards shared by validation and migrations. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isCount(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

export function isFractionOrNull(value: unknown): boolean {
  return value === null || (isFiniteNumber(value) && value >= 0 && value <= 1);
}

export function isScoreOrNull(value: unknown): boolean {
  return value === null || (isFiniteNumber(value) && value >= 0 && value <= 100);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
