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
});
