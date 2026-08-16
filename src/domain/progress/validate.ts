import type { ProgressData } from "./progress";

/**
 * Structural validation for progress data coming from storage or an
 * imported backup. Imported content is treated purely as data: it is only
 * inspected, never executed. Anything malformed, non-finite, negative or
 * internally inconsistent is rejected with a message.
 */

export type ValidationResult =
  | { ok: true; data: ProgressData }
  | { ok: false; error: string };

const fail = (error: string): ValidationResult => ({ ok: false, error });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCount(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isFractionOrNull(value: unknown): boolean {
  return value === null || (isFiniteNumber(value) && value >= 0 && value <= 1);
}

function isScoreOrNull(value: unknown): boolean {
  return value === null || (isFiniteNumber(value) && value >= 0 && value <= 100);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function validateSession(value: unknown, index: number): string | null {
  if (!isRecord(value)) return `sesión ${index}: no es un objeto`;
  const s = value;
  if (!isNonEmptyString(s.id)) return `sesión ${index}: id inválido`;
  if (!isNonEmptyString(s.completedAt)) return `sesión ${index}: fecha inválida`;
  if (typeof s.lessonId !== "string") return `sesión ${index}: lessonId inválido`;
  if (typeof s.exerciseType !== "string") return `sesión ${index}: tipo inválido`;
  for (const field of [
    "durationMs",
    "totalKeystrokes",
    "correctKeystrokes",
    "errors",
    "ppm",
    "rawPpm",
    "xp",
  ]) {
    if (!isCount(s[field])) return `sesión ${index}: ${field} inválido`;
  }
  if (!isFractionOrNull(s.accuracy)) return `sesión ${index}: precisión inválida`;
  if (!isScoreOrNull(s.consistency)) return `sesión ${index}: consistencia inválida`;
  if ((s.correctKeystrokes as number) > (s.totalKeystrokes as number)) {
    return `sesión ${index}: más aciertos que pulsaciones`;
  }
  return null;
}

function validateKeyStat(key: string, value: unknown): string | null {
  if (!isRecord(value)) return `tecla ${key}: no es un objeto`;
  for (const field of ["attempts", "correct", "errors"]) {
    if (!isCount(value[field])) return `tecla ${key}: ${field} inválido`;
  }
  if ((value.correct as number) > (value.attempts as number)) {
    return `tecla ${key}: más aciertos que intentos`;
  }
  if (value.latencyEwmaMs !== null && !isCount(value.latencyEwmaMs)) {
    return `tecla ${key}: latencia inválida`;
  }
  if (!isFractionOrNull(value.accuracyEwma)) return `tecla ${key}: precisión inválida`;
  if (value.lastPracticedAt !== null && typeof value.lastPracticedAt !== "string") {
    return `tecla ${key}: fecha inválida`;
  }
  return null;
}

function validateBaseline(value: unknown): string | null {
  if (value === null) return null;
  if (!isRecord(value)) return "baseline: no es un objeto";
  if (!isNonEmptyString(value.recordedAt)) return "baseline: fecha inválida";
  if (!isCount(value.ppm)) return "baseline: ppm inválida";
  if (!isFractionOrNull(value.accuracy) || value.accuracy === null) {
    return "baseline: precisión inválida";
  }
  if (!isCount(value.errors)) return "baseline: errores inválidos";
  if (!isScoreOrNull(value.consistency)) return "baseline: consistencia inválida";
  return null;
}

export function validateProgress(raw: unknown): ValidationResult {
  if (!isRecord(raw)) return fail("El contenido no es un objeto de progreso");
  if (!isFiniteNumber(raw.schemaVersion)) return fail("Falta schemaVersion");

  if (!isRecord(raw.profile)) return fail("Falta el perfil");
  if (!isNonEmptyString(raw.profile.name)) return fail("Perfil: nombre inválido");
  if (raw.profile.nickname !== null && typeof raw.profile.nickname !== "string") {
    return fail("Perfil: apodo inválido");
  }
  if (!isNonEmptyString(raw.profile.createdAt)) return fail("Perfil: fecha inválida");

  if (!isRecord(raw.settings)) return fail("Faltan los ajustes");
  if (typeof raw.settings.soundEnabled !== "boolean") return fail("Ajustes: sonido inválido");
  if (typeof raw.settings.reducedMotion !== "boolean") return fail("Ajustes: movimiento inválido");
  if (!isCount(raw.settings.dailyGoalMinutes)) return fail("Ajustes: objetivo inválido");

  if (!Array.isArray(raw.sessions)) return fail("Faltan las sesiones");
  const seenIds = new Set<string>();
  for (let i = 0; i < raw.sessions.length; i += 1) {
    const problem = validateSession(raw.sessions[i], i);
    if (problem) return fail(problem);
    const id = (raw.sessions[i] as { id: string }).id;
    if (seenIds.has(id)) return fail(`sesión ${i}: id duplicado`);
    seenIds.add(id);
  }

  if (!isRecord(raw.keyStats)) return fail("Faltan las estadísticas de teclas");
  for (const [key, value] of Object.entries(raw.keyStats)) {
    const problem = validateKeyStat(key, value);
    if (problem) return fail(problem);
  }

  const baselineProblem = validateBaseline(raw.baseline);
  if (baselineProblem) return fail(baselineProblem);

  if (!isCount(raw.totalXp)) return fail("XP total inválida");

  return { ok: true, data: raw as unknown as ProgressData };
}
