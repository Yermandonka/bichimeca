import { describe, it, expect } from "vitest";
import { mergeSessionKeyStats, KEY_STATS_EWMA_ALPHA } from "./keyStats";
import type { KeyStats } from "@/domain/engine/session";

const NOW = "2026-08-16T12:00:00.000Z";

const sessionStats = (overrides: Partial<KeyStats> = {}): KeyStats => ({
  attempts: 10,
  correct: 9,
  errors: 1,
  latenciesMs: [300, 400, 500],
  ...overrides,
});

describe("mergeSessionKeyStats", () => {
  it("creates a record for a key seen for the first time", () => {
    const merged = mergeSessionKeyStats({}, new Map([["f", sessionStats()]]), NOW);
    const f = merged.f;
    expect(f.attempts).toBe(10);
    expect(f.correct).toBe(9);
    expect(f.errors).toBe(1);
    // First observation seeds the EWMAs directly.
    expect(f.accuracyEwma).toBeCloseTo(0.9);
    expect(f.latencyEwmaMs).toBe(400); // median of 300,400,500
    expect(f.lastPracticedAt).toBe(NOW);
  });

  it("accumulates lifetime counters and blends EWMAs on later sessions", () => {
    const existing = {
      f: {
        attempts: 100,
        correct: 80,
        errors: 20,
        latencyEwmaMs: 600,
        accuracyEwma: 0.8,
        lastPracticedAt: "2026-08-10T00:00:00.000Z",
      },
    };
    const merged = mergeSessionKeyStats(
      existing,
      new Map([["f", sessionStats()]]),
      NOW,
    );
    const f = merged.f;
    expect(f.attempts).toBe(110);
    expect(f.correct).toBe(89);
    expect(f.errors).toBe(21);
    const alpha = KEY_STATS_EWMA_ALPHA;
    expect(f.accuracyEwma).toBeCloseTo(alpha * 0.9 + (1 - alpha) * 0.8);
    expect(f.latencyEwmaMs).toBeCloseTo(alpha * 400 + (1 - alpha) * 600);
    expect(f.lastPracticedAt).toBe(NOW);
  });

  it("keeps the previous latency EWMA when the session has no correct presses", () => {
    const existing = {
      f: {
        attempts: 10,
        correct: 5,
        errors: 5,
        latencyEwmaMs: 500,
        accuracyEwma: 0.5,
        lastPracticedAt: "2026-08-10T00:00:00.000Z",
      },
    };
    const merged = mergeSessionKeyStats(
      existing,
      new Map([["f", sessionStats({ attempts: 2, correct: 0, errors: 2, latenciesMs: [] })]]),
      NOW,
    );
    expect(merged.f.latencyEwmaMs).toBe(500);
    expect(merged.f.accuracyEwma).toBeCloseTo(
      KEY_STATS_EWMA_ALPHA * 0 + (1 - KEY_STATS_EWMA_ALPHA) * 0.5,
    );
  });

  it("keeps both EWMAs when a key has no attempts in the session", () => {
    const existing = {
      f: {
        attempts: 10,
        correct: 5,
        errors: 5,
        latencyEwmaMs: 500,
        accuracyEwma: 0.5,
        lastPracticedAt: "2026-08-10T00:00:00.000Z",
      },
    };
    const merged = mergeSessionKeyStats(
      existing,
      new Map([["f", sessionStats({ attempts: 0, correct: 0, errors: 0, latenciesMs: [] })]]),
      NOW,
    );
    expect(merged.f.accuracyEwma).toBe(0.5);
    expect(merged.f.latencyEwmaMs).toBe(500);
    expect(merged.f.lastPracticedAt).toBe(NOW);
  });

  it("does not touch keys absent from the session", () => {
    const existing = {
      j: {
        attempts: 50,
        correct: 45,
        errors: 5,
        latencyEwmaMs: 350,
        accuracyEwma: 0.9,
        lastPracticedAt: "2026-08-10T00:00:00.000Z",
      },
    };
    const merged = mergeSessionKeyStats(existing, new Map([["f", sessionStats()]]), NOW);
    expect(merged.j).toEqual(existing.j);
    expect(merged.f).toBeDefined();
  });

  it("returns a new object without mutating the input", () => {
    const existing = {};
    const merged = mergeSessionKeyStats(existing, new Map([["f", sessionStats()]]), NOW);
    expect(existing).toEqual({});
    expect(merged).not.toBe(existing);
  });
});
