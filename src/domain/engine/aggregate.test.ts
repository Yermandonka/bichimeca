import { describe, it, expect } from "vitest";
import {
  combineKeyStats,
  combineSummaries,
  type CompletedExercise,
} from "./aggregate";
import type { KeyStats, SessionSummary } from "./session";

function summary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    durationMs: 60_000,
    totalKeystrokes: 100,
    correctKeystrokes: 90,
    errors: 10,
    accuracy: 0.9,
    ppm: 18,
    rawPpm: 20,
    consistency: 80,
    cleanPositions: 85,
    correctedPositions: 5,
    ...overrides,
  };
}

function exercise(
  summaryOverrides: Partial<SessionSummary> = {},
  keyStats: Array<[string, KeyStats]> = [],
): CompletedExercise {
  return { summary: summary(summaryOverrides), keyStats: new Map(keyStats) };
}

describe("combineKeyStats", () => {
  it("sums counters and concatenates latencies per key across exercises", () => {
    const combined = combineKeyStats([
      exercise({}, [
        ["f", { attempts: 5, correct: 4, errors: 1, latenciesMs: [200, 300] }],
      ]),
      exercise({}, [
        ["f", { attempts: 3, correct: 3, errors: 0, latenciesMs: [250] }],
        ["j", { attempts: 2, correct: 2, errors: 0, latenciesMs: [400] }],
      ]),
    ]);
    expect(combined.get("f")).toEqual({
      attempts: 8,
      correct: 7,
      errors: 1,
      latenciesMs: [200, 300, 250],
    });
    expect(combined.get("j")).toEqual({
      attempts: 2,
      correct: 2,
      errors: 0,
      latenciesMs: [400],
    });
  });

  it("returns an empty map for no exercises", () => {
    expect(combineKeyStats([]).size).toBe(0);
  });
});

describe("combineSummaries", () => {
  it("sums counters and recomputes speed and accuracy over the totals", () => {
    const totals = combineSummaries([
      exercise({ durationMs: 60_000, totalKeystrokes: 100, correctKeystrokes: 90, errors: 10 }),
      exercise({ durationMs: 30_000, totalKeystrokes: 50, correctKeystrokes: 50, errors: 0 }),
    ]);
    expect(totals.durationMs).toBe(90_000);
    expect(totals.totalKeystrokes).toBe(150);
    expect(totals.correctKeystrokes).toBe(140);
    expect(totals.errors).toBe(10);
    expect(totals.accuracy).toBeCloseTo(140 / 150);
    // 140 correct chars = 28 words in 1.5 min
    expect(totals.ppm).toBeCloseTo(28 / 1.5);
    expect(totals.rawPpm).toBeCloseTo(30 / 1.5);
  });

  it("blends consistency weighted by exercise duration", () => {
    const totals = combineSummaries([
      exercise({ durationMs: 30_000, consistency: 90 }),
      exercise({ durationMs: 60_000, consistency: 60 }),
    ]);
    // (90 * 30 + 60 * 60) / 90 = 70
    expect(totals.consistency).toBeCloseTo(70);
  });

  it("ignores exercises without a consistency score in the blend", () => {
    const totals = combineSummaries([
      exercise({ durationMs: 30_000, consistency: null }),
      exercise({ durationMs: 60_000, consistency: 75 }),
    ]);
    expect(totals.consistency).toBe(75);
  });

  it("returns safe null/zero values for an empty lesson", () => {
    const totals = combineSummaries([]);
    expect(totals.accuracy).toBeNull();
    expect(totals.ppm).toBe(0);
    expect(totals.rawPpm).toBe(0);
    expect(totals.consistency).toBeNull();
    expect(totals.durationMs).toBe(0);
  });
});
