import { CURRENT_SCHEMA_VERSION } from "./progress";
import { validateProgress, type ValidationResult } from "./validate";
import { isFiniteNumber, isRecord } from "./guards";

/**
 * Stepwise schema migrations. Each registry entry migrates data *from* that
 * version and must raise `schemaVersion`. Missing steps, future versions or
 * invalid results fail explicitly — stored data is never cleared or
 * "repaired" by guessing.
 */

export type MigrationStep = (
  data: Record<string, unknown>,
) => Record<string, unknown>;

export type MigrationRegistry = Record<number, MigrationStep>;

/** Real migrations register here as the schema evolves (none yet for v1). */
export const MIGRATIONS: MigrationRegistry = {};

export type MigrationResult = ValidationResult;

export function migrateToCurrent(
  raw: unknown,
  registry: MigrationRegistry = MIGRATIONS,
): MigrationResult {
  if (!isRecord(raw)) {
    return { ok: false, error: "El contenido no es un objeto de progreso" };
  }
  let data = raw;
  const rawVersion = data.schemaVersion;
  if (!isFiniteNumber(rawVersion)) {
    return { ok: false, error: "Falta schemaVersion" };
  }
  let version: number = rawVersion;
  if (version > CURRENT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Versión de datos ${version} no compatible con esta versión de la aplicación`,
    };
  }

  while (version < CURRENT_SCHEMA_VERSION) {
    const step = registry[version];
    if (!step) {
      return {
        ok: false,
        error: `No existe migración desde la versión ${version}`,
      };
    }
    data = step(data);
    const nextVersion = data.schemaVersion;
    if (!isFiniteNumber(nextVersion) || nextVersion <= version) {
      return {
        ok: false,
        error: `La migración desde la versión ${version} no avanzó el esquema`,
      };
    }
    version = nextVersion;
  }

  const validation = validateProgress(data);
  if (!validation.ok) {
    return { ok: false, error: `Datos migrados inválidos: ${validation.error}` };
  }
  return { ok: true, data: validation.data };
}
