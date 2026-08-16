import { describe, it, expect } from "vitest";
import {
  completedLessonIds,
  currentLessonId,
  isLessonUnlocked,
} from "./selectors";
import { createEmptyProgress, appendSession } from "./progress";
import type { Lesson } from "@/domain/curriculum/types";

const NOW = "2026-08-16T12:00:00.000Z";

const lesson = (id: string, order: number): Lesson => ({
  id,
  world: 1,
  order,
  title: id,
  type: "learn",
  introducedKeys: [],
  practicedKeys: [],
  xp: 10,
  exercises: [{ type: "drill", text: "fj" }],
});

const CURRICULUM = [lesson("l1", 1), lesson("l2", 2), lesson("l3", 3)];

function progressWithCompleted(...lessonIds: string[]) {
  let progress = createEmptyProgress(NOW);
  lessonIds.forEach((lessonId, i) => {
    progress = appendSession(progress, {
      id: `s${i}`,
      completedAt: NOW,
      lessonId,
      exerciseType: "learn",
      durationMs: 60_000,
      totalKeystrokes: 100,
      correctKeystrokes: 96,
      errors: 4,
      accuracy: 0.96,
      ppm: 20,
      rawPpm: 21,
      consistency: 70,
      xp: 10,
    });
  });
  return progress;
}

describe("completedLessonIds", () => {
  it("collects the distinct lesson ids with at least one session", () => {
    const progress = progressWithCompleted("l1", "l1", "l2");
    expect(completedLessonIds(progress)).toEqual(new Set(["l1", "l2"]));
  });
});

describe("currentLessonId", () => {
  it("is the first lesson when nothing is completed", () => {
    expect(currentLessonId(CURRICULUM, createEmptyProgress(NOW))).toBe("l1");
  });

  it("is the first uncompleted lesson in curriculum order", () => {
    expect(currentLessonId(CURRICULUM, progressWithCompleted("l1"))).toBe("l2");
  });

  it("is null when every lesson is completed", () => {
    expect(
      currentLessonId(CURRICULUM, progressWithCompleted("l1", "l2", "l3")),
    ).toBeNull();
  });
});

describe("isLessonUnlocked", () => {
  it("unlocks the first lesson from the start", () => {
    expect(isLessonUnlocked(CURRICULUM, createEmptyProgress(NOW), "l1")).toBe(true);
  });

  it("keeps later lessons locked until the previous one is completed", () => {
    const progress = createEmptyProgress(NOW);
    expect(isLessonUnlocked(CURRICULUM, progress, "l2")).toBe(false);
    expect(isLessonUnlocked(CURRICULUM, progress, "l3")).toBe(false);
  });

  it("unlocks the next lesson after completing the previous", () => {
    const progress = progressWithCompleted("l1");
    expect(isLessonUnlocked(CURRICULUM, progress, "l2")).toBe(true);
    expect(isLessonUnlocked(CURRICULUM, progress, "l3")).toBe(false);
  });

  it("keeps completed lessons unlocked for replay", () => {
    const progress = progressWithCompleted("l1");
    expect(isLessonUnlocked(CURRICULUM, progress, "l1")).toBe(true);
  });

  it("returns false for unknown lesson ids", () => {
    expect(isLessonUnlocked(CURRICULUM, createEmptyProgress(NOW), "nope")).toBe(
      false,
    );
  });
});
