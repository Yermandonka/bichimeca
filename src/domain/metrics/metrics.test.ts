import { describe, it, expect } from "vitest";
import {
  CHARS_PER_WORD,
  ppm,
  rawPpm,
  accuracy,
  errorRate,
  consistencyScore,
  MIN_INTERVALS_FOR_CONSISTENCY,
} from "./metrics";

describe("ppm (palabras por minuto, netas)", () => {
  it("converts correct characters to words at 5 chars per word", () => {
    expect(CHARS_PER_WORD).toBe(5);
    // 250 correct chars in 2 minutes -> 50 words / 2 min = 25 PPM
    expect(ppm({ correctChars: 250, durationMs: 120_000 })).toBe(25);
  });

  it("computes fractional results without rounding", () => {
    // 110 correct chars in 30s -> 22 words in 0.5 min -> 44 PPM
    expect(ppm({ correctChars: 110, durationMs: 30_000 })).toBe(44);
    // 7 chars in 60s -> 1.4 PPM
    expect(ppm({ correctChars: 7, durationMs: 60_000 })).toBeCloseTo(1.4);
  });

  it("returns 0 for zero or negative duration instead of Infinity/NaN", () => {
    expect(ppm({ correctChars: 100, durationMs: 0 })).toBe(0);
    expect(ppm({ correctChars: 100, durationMs: -5 })).toBe(0);
    expect(ppm({ correctChars: 0, durationMs: 0 })).toBe(0);
  });

  it("returns 0 when nothing was typed", () => {
    expect(ppm({ correctChars: 0, durationMs: 60_000 })).toBe(0);
  });
});

describe("rawPpm (velocidad bruta)", () => {
  it("uses total typed characters regardless of correctness", () => {
    // 300 typed chars in 1 minute -> 60 raw PPM
    expect(rawPpm({ totalChars: 300, durationMs: 60_000 })).toBe(60);
  });

  it("is never lower than net ppm for the same duration", () => {
    const durationMs = 45_000;
    const raw = rawPpm({ totalChars: 200, durationMs });
    const net = ppm({ correctChars: 180, durationMs });
    expect(raw).toBeGreaterThan(net);
  });

  it("returns 0 for zero duration", () => {
    expect(rawPpm({ totalChars: 300, durationMs: 0 })).toBe(0);
  });
});

describe("accuracy", () => {
  it("is correct keystrokes over total relevant keystrokes", () => {
    expect(accuracy({ correctKeystrokes: 465, totalKeystrokes: 480 })).toBeCloseTo(
      0.96875,
    );
    expect(accuracy({ correctKeystrokes: 480, totalKeystrokes: 480 })).toBe(1);
    expect(accuracy({ correctKeystrokes: 0, totalKeystrokes: 10 })).toBe(0);
  });

  it("returns null when there is no data instead of NaN", () => {
    expect(accuracy({ correctKeystrokes: 0, totalKeystrokes: 0 })).toBeNull();
  });

  it("never exceeds 1 even with inconsistent inputs", () => {
    expect(accuracy({ correctKeystrokes: 12, totalKeystrokes: 10 })).toBe(1);
  });
});

describe("errorRate", () => {
  it("is errors over total relevant keystrokes", () => {
    expect(errorRate({ errors: 15, totalKeystrokes: 480 })).toBeCloseTo(0.03125);
  });

  it("returns null when there is no data", () => {
    expect(errorRate({ errors: 0, totalKeystrokes: 0 })).toBeNull();
  });
});

describe("consistencyScore (ritmo)", () => {
  it("gives a perfect score for a perfectly stable rhythm", () => {
    const intervals = Array(20).fill(200);
    expect(consistencyScore(intervals)).toBe(100);
  });

  it("is robust to a single long pause (uses median-based dispersion)", () => {
    // 19 stable intervals plus one 3s interruption: the score should stay high
    // because one pause must not distort the rhythm metric.
    const intervals = [...Array(19).fill(200), 3000];
    const score = consistencyScore(intervals);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThan(85);
  });

  it("scores irregular bursty typing clearly lower than stable typing", () => {
    const stable = Array(12).fill(250);
    const bursty = [100, 400, 150, 500, 120, 450, 90, 480, 130, 520, 110, 390];
    const stableScore = consistencyScore(stable)!;
    const burstyScore = consistencyScore(bursty)!;
    expect(burstyScore).toBeLessThan(stableScore - 30);
  });

  it("returns null with insufficient data", () => {
    expect(MIN_INTERVALS_FOR_CONSISTENCY).toBeGreaterThan(1);
    const tooFew = Array(MIN_INTERVALS_FOR_CONSISTENCY - 1).fill(200);
    expect(consistencyScore(tooFew)).toBeNull();
    expect(consistencyScore([])).toBeNull();
  });

  it("ignores non-positive intervals instead of producing NaN", () => {
    const intervals = [...Array(10).fill(200), 0, -50];
    const score = consistencyScore(intervals);
    expect(score).toBe(100);
  });

  it("stays within 0..100", () => {
    const chaotic = [1, 2000, 5, 1800, 3, 2500, 8, 1900, 2, 2100];
    const score = consistencyScore(chaotic)!;
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
