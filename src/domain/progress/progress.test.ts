import { describe, it, expect } from "vitest";
import {
  CURRENT_SCHEMA_VERSION,
  createEmptyProgress,
  appendSession,
  recordBaseline,
  type ProgressData,
  type SessionRecord,
} from "./progress";
import { validateProgress } from "./validate";
import { migrateToCurrent } from "./migrations";

const NOW = "2026-08-16T12:00:00.000Z";

function sampleSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: "s1",
    completedAt: NOW,
    lessonId: "w1-l1",
    exerciseType: "learn",
    durationMs: 120_000,
    totalKeystrokes: 200,
    correctKeystrokes: 190,
    errors: 10,
    accuracy: 0.95,
    ppm: 19,
    rawPpm: 20,
    consistency: 80,
    xp: 50,
    ...overrides,
  };
}

describe("createEmptyProgress", () => {
  it("starts at the current schema version with safe defaults", () => {
    const progress = createEmptyProgress(NOW);
    expect(progress.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(progress.profile.name).toBe("Estrella");
    expect(progress.profile.nickname).toBe("bichi");
    expect(progress.sessions).toEqual([]);
    expect(progress.baseline).toBeNull();
    expect(progress.totalXp).toBe(0);
  });
});

describe("appendSession", () => {
  it("appends immutably and accumulates XP", () => {
    const progress = createEmptyProgress(NOW);
    const next = appendSession(progress, sampleSession());
    expect(next.sessions).toHaveLength(1);
    expect(next.totalXp).toBe(50);
    expect(progress.sessions).toHaveLength(0);
  });

  it("rejects duplicate session ids to avoid silent double-recording", () => {
    const progress = appendSession(createEmptyProgress(NOW), sampleSession());
    expect(() => appendSession(progress, sampleSession())).toThrow(/duplicad/i);
  });
});

describe("recordBaseline", () => {
  const baseline = {
    recordedAt: NOW,
    ppm: 24,
    accuracy: 0.912,
    errors: 12,
    consistency: 60,
  };

  it("stores the baseline when none exists", () => {
    const progress = recordBaseline(createEmptyProgress(NOW), baseline);
    expect(progress.baseline).toEqual(baseline);
  });

  it("never silently overwrites an existing baseline", () => {
    const first = recordBaseline(createEmptyProgress(NOW), baseline);
    const second = recordBaseline(first, { ...baseline, ppm: 99 });
    expect(second.baseline).toEqual(baseline);
  });
});

describe("validateProgress (import safety)", () => {
  it("accepts its own exported shape round-tripped through JSON", () => {
    let progress = createEmptyProgress(NOW);
    progress = appendSession(progress, sampleSession());
    const parsed: unknown = JSON.parse(JSON.stringify(progress));
    const result = validateProgress(parsed);
    expect(result.ok).toBe(true);
  });

  it("rejects non-objects and malformed structures", () => {
    expect(validateProgress(null).ok).toBe(false);
    expect(validateProgress("hola").ok).toBe(false);
    expect(validateProgress(42).ok).toBe(false);
    expect(validateProgress({}).ok).toBe(false);
    expect(validateProgress({ schemaVersion: 1 }).ok).toBe(false);
  });

  it("rejects non-finite or negative numeric fields", () => {
    const base = JSON.parse(
      JSON.stringify(appendSession(createEmptyProgress(NOW), sampleSession())),
    ) as ProgressData;

    const negativeXp = { ...base, totalXp: -5 };
    expect(validateProgress(negativeXp).ok).toBe(false);

    const badSession = {
      ...base,
      sessions: [{ ...base.sessions[0], ppm: Number.POSITIVE_INFINITY }],
    };
    // Infinity does not survive JSON, but a crafted object must still fail.
    expect(validateProgress(badSession).ok).toBe(false);
  });

  it("rejects sessions with impossible counters", () => {
    const base = JSON.parse(
      JSON.stringify(appendSession(createEmptyProgress(NOW), sampleSession())),
    ) as ProgressData;
    const impossible = {
      ...base,
      sessions: [
        { ...base.sessions[0], correctKeystrokes: 500, totalKeystrokes: 100 },
      ],
    };
    expect(validateProgress(impossible).ok).toBe(false);
  });

  it("rejects every corrupted field, one branch at a time", () => {
    const valid = (): ProgressData =>
      JSON.parse(
        JSON.stringify(appendSession(createEmptyProgress(NOW), sampleSession())),
      ) as ProgressData;
    const goodKeyStat = {
      attempts: 10,
      correct: 9,
      errors: 1,
      latencyEwmaMs: 350,
      accuracyEwma: 0.9,
      lastPracticedAt: NOW,
    };
    const goodBaseline = {
      recordedAt: NOW,
      ppm: 24,
      accuracy: 0.9,
      errors: 3,
      consistency: 60,
    };

    const corruptions: Array<[string, (p: ProgressData) => unknown]> = [
      ["profile no es objeto", (p) => ({ ...p, profile: "x" })],
      ["nombre vacío", (p) => ({ ...p, profile: { ...p.profile, name: "" } })],
      ["apodo no string", (p) => ({ ...p, profile: { ...p.profile, nickname: 7 } })],
      ["createdAt vacío", (p) => ({ ...p, profile: { ...p.profile, createdAt: "" } })],
      ["settings no es objeto", (p) => ({ ...p, settings: null })],
      ["sonido no booleano", (p) => ({ ...p, settings: { ...p.settings, soundEnabled: 1 } })],
      ["movimiento no booleano", (p) => ({ ...p, settings: { ...p.settings, reducedMotion: "no" } })],
      ["objetivo negativo", (p) => ({ ...p, settings: { ...p.settings, dailyGoalMinutes: -1 } })],
      ["sessions no es array", (p) => ({ ...p, sessions: {} })],
      ["sesión no es objeto", (p) => ({ ...p, sessions: [null] })],
      ["sesión sin id", (p) => ({ ...p, sessions: [{ ...p.sessions[0], id: "" }] })],
      ["sesión sin fecha", (p) => ({ ...p, sessions: [{ ...p.sessions[0], completedAt: "" }] })],
      ["lessonId no string", (p) => ({ ...p, sessions: [{ ...p.sessions[0], lessonId: 3 }] })],
      ["tipo no string", (p) => ({ ...p, sessions: [{ ...p.sessions[0], exerciseType: 3 }] })],
      ["precisión fuera de rango", (p) => ({ ...p, sessions: [{ ...p.sessions[0], accuracy: 1.5 }] })],
      ["consistencia fuera de rango", (p) => ({ ...p, sessions: [{ ...p.sessions[0], consistency: 101 }] })],
      ["ids de sesión duplicados", (p) => ({ ...p, sessions: [p.sessions[0], { ...p.sessions[0] }] })],
      ["keyStats no es objeto", (p) => ({ ...p, keyStats: null })],
      ["tecla no es objeto", (p) => ({ ...p, keyStats: { a: 5 } })],
      ["tecla con contador negativo", (p) => ({ ...p, keyStats: { a: { ...goodKeyStat, errors: -1 } } })],
      ["tecla con más aciertos que intentos", (p) => ({ ...p, keyStats: { a: { ...goodKeyStat, correct: 99 } } })],
      ["tecla con latencia inválida", (p) => ({ ...p, keyStats: { a: { ...goodKeyStat, latencyEwmaMs: -2 } } })],
      ["tecla con precisión inválida", (p) => ({ ...p, keyStats: { a: { ...goodKeyStat, accuracyEwma: 2 } } })],
      ["tecla con fecha inválida", (p) => ({ ...p, keyStats: { a: { ...goodKeyStat, lastPracticedAt: 4 } } })],
      ["baseline no es objeto", (p) => ({ ...p, baseline: "x" })],
      ["baseline sin fecha", (p) => ({ ...p, baseline: { ...goodBaseline, recordedAt: "" } })],
      ["baseline con ppm negativa", (p) => ({ ...p, baseline: { ...goodBaseline, ppm: -1 } })],
      ["baseline sin precisión", (p) => ({ ...p, baseline: { ...goodBaseline, accuracy: null } })],
      ["baseline con errores negativos", (p) => ({ ...p, baseline: { ...goodBaseline, errors: -1 } })],
      ["baseline con consistencia inválida", (p) => ({ ...p, baseline: { ...goodBaseline, consistency: 200 } })],
    ];

    for (const [label, corrupt] of corruptions) {
      const result = validateProgress(corrupt(valid()));
      expect(result.ok, label).toBe(false);
    }

    // Sanity: valid data with keyStats and baseline passes.
    const complete = {
      ...valid(),
      keyStats: { a: goodKeyStat },
      baseline: goodBaseline,
    };
    expect(validateProgress(complete).ok).toBe(true);
  });
});

describe("migrateToCurrent", () => {
  it("returns current-version data unchanged", () => {
    const progress = createEmptyProgress(NOW);
    const result = migrateToCurrent(JSON.parse(JSON.stringify(progress)));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("applies stepwise migrations from older versions without losing history", () => {
    const progress = appendSession(createEmptyProgress(NOW), sampleSession());
    const legacy = {
      ...JSON.parse(JSON.stringify(progress)),
      schemaVersion: 0,
    };
    const result = migrateToCurrent(legacy, {
      0: (data) => ({ ...data, schemaVersion: 1 }),
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(result.data.sessions).toHaveLength(1);
      expect(result.data.totalXp).toBe(50);
    }
  });

  it("fails safely when a migration step is missing, never clearing data", () => {
    const legacy = {
      ...JSON.parse(JSON.stringify(createEmptyProgress(NOW))),
      schemaVersion: -3,
    };
    const result = migrateToCurrent(legacy, {});
    expect(result.ok).toBe(false);
  });

  it("refuses data from a future schema version", () => {
    const future = {
      ...JSON.parse(JSON.stringify(createEmptyProgress(NOW))),
      schemaVersion: CURRENT_SCHEMA_VERSION + 1,
    };
    const result = migrateToCurrent(future);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/versión|version/i);
  });

  it("rejects migrated data that fails validation instead of accepting garbage", () => {
    const legacy = { schemaVersion: 0 };
    const result = migrateToCurrent(legacy, {
      0: (data) => ({ ...data, schemaVersion: 1 }),
    });
    expect(result.ok).toBe(false);
  });

  it("rejects content that is not a progress object", () => {
    expect(migrateToCurrent(null).ok).toBe(false);
    expect(migrateToCurrent([1, 2]).ok).toBe(false);
    expect(migrateToCurrent({ schemaVersion: "1" }).ok).toBe(false);
    expect(migrateToCurrent({ schemaVersion: Number.NaN }).ok).toBe(false);
  });

  it("fails when a migration step does not advance the schema version", () => {
    const legacy = {
      ...JSON.parse(JSON.stringify(createEmptyProgress(NOW))),
      schemaVersion: 0,
    };
    const stuck = migrateToCurrent(legacy, { 0: (data) => data });
    expect(stuck.ok).toBe(false);
    if (!stuck.ok) expect(stuck.error).toMatch(/no avanzó/);

    const backwards = migrateToCurrent(legacy, {
      0: (data) => ({ ...data, schemaVersion: Number.NaN }),
    });
    expect(backwards.ok).toBe(false);
  });
});
