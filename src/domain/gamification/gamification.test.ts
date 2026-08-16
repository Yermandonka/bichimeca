import { describe, it, expect } from "vitest";
import {
  starsForAccuracy,
  lessonStars,
  practiceStreak,
  STAR_THRESHOLDS,
} from "./gamification";
import { createEmptyProgress, appendSession } from "@/domain/progress/progress";

const DAY = "2026-08-16";

function progressWithSessions(
  entries: Array<{ lessonId: string; accuracy: number | null; completedAt: string }>,
) {
  let progress = createEmptyProgress(`${DAY}T08:00:00.000Z`);
  entries.forEach((entry, i) => {
    progress = appendSession(progress, {
      id: `s${i}`,
      completedAt: entry.completedAt,
      lessonId: entry.lessonId,
      exerciseType: "learn",
      durationMs: 60_000,
      totalKeystrokes: 100,
      correctKeystrokes: 95,
      errors: 5,
      accuracy: entry.accuracy,
      ppm: 20,
      rawPpm: 21,
      consistency: 70,
      xp: 10,
    });
  });
  return progress;
}

describe("starsForAccuracy", () => {
  it("gives one star for completing regardless of accuracy", () => {
    expect(starsForAccuracy(0.5)).toBe(1);
    expect(starsForAccuracy(null)).toBe(1);
  });

  it("gives two stars at the good threshold and three at mastery", () => {
    expect(starsForAccuracy(STAR_THRESHOLDS.good)).toBe(2);
    expect(starsForAccuracy(STAR_THRESHOLDS.mastery - 0.001)).toBe(2);
    expect(starsForAccuracy(STAR_THRESHOLDS.mastery)).toBe(3);
    expect(starsForAccuracy(1)).toBe(3);
  });

  it("keeps thresholds ordered sensibly", () => {
    expect(STAR_THRESHOLDS.good).toBeGreaterThan(0.9);
    expect(STAR_THRESHOLDS.mastery).toBeGreaterThan(STAR_THRESHOLDS.good);
  });
});

describe("lessonStars", () => {
  it("returns 0 for lessons never completed", () => {
    const progress = progressWithSessions([]);
    expect(lessonStars(progress, "w1-l1")).toBe(0);
  });

  it("returns the best stars across attempts", () => {
    const progress = progressWithSessions([
      { lessonId: "w1-l1", accuracy: 0.9, completedAt: `${DAY}T08:00:00.000Z` },
      { lessonId: "w1-l1", accuracy: 0.99, completedAt: `${DAY}T09:00:00.000Z` },
      { lessonId: "w1-l1", accuracy: 0.95, completedAt: `${DAY}T10:00:00.000Z` },
    ]);
    expect(lessonStars(progress, "w1-l1")).toBe(3);
  });

  it("ignores sessions from other lessons", () => {
    const progress = progressWithSessions([
      { lessonId: "w1-l1", accuracy: 0.9, completedAt: `${DAY}T08:00:00.000Z` },
      { lessonId: "w1-l2", accuracy: 1, completedAt: `${DAY}T09:00:00.000Z` },
    ]);
    expect(lessonStars(progress, "w1-l1")).toBe(1);
  });
});

describe("practiceStreak", () => {
  it("is 0 with no sessions", () => {
    expect(practiceStreak(progressWithSessions([]), DAY)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const progress = progressWithSessions([
      { lessonId: "a", accuracy: 1, completedAt: "2026-08-14T10:00:00.000Z" },
      { lessonId: "b", accuracy: 1, completedAt: "2026-08-15T10:00:00.000Z" },
      { lessonId: "c", accuracy: 1, completedAt: "2026-08-16T10:00:00.000Z" },
    ]);
    expect(practiceStreak(progress, DAY)).toBe(3);
  });

  it("keeps yesterday's streak alive before practicing today", () => {
    const progress = progressWithSessions([
      { lessonId: "a", accuracy: 1, completedAt: "2026-08-14T10:00:00.000Z" },
      { lessonId: "b", accuracy: 1, completedAt: "2026-08-15T10:00:00.000Z" },
    ]);
    expect(practiceStreak(progress, DAY)).toBe(2);
  });

  it("resets after a missed day", () => {
    const progress = progressWithSessions([
      { lessonId: "a", accuracy: 1, completedAt: "2026-08-12T10:00:00.000Z" },
      { lessonId: "b", accuracy: 1, completedAt: "2026-08-13T10:00:00.000Z" },
    ]);
    expect(practiceStreak(progress, DAY)).toBe(0);
  });

  it("crosses month boundaries correctly", () => {
    const progress = progressWithSessions([
      { lessonId: "a", accuracy: 1, completedAt: "2026-07-31T10:00:00.000Z" },
      { lessonId: "b", accuracy: 1, completedAt: "2026-08-01T10:00:00.000Z" },
    ]);
    expect(practiceStreak(progress, "2026-08-01")).toBe(2);
  });

  it("counts several sessions on one day as a single streak day", () => {
    const progress = progressWithSessions([
      { lessonId: "a", accuracy: 1, completedAt: "2026-08-16T08:00:00.000Z" },
      { lessonId: "b", accuracy: 1, completedAt: "2026-08-16T20:00:00.000Z" },
    ]);
    expect(practiceStreak(progress, DAY)).toBe(1);
  });
});
