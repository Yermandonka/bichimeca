import { describe, it, expect } from "vitest";
import { byOrder, nextLessonAfter } from "./ordering";
import type { Lesson } from "./types";

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

const SHUFFLED = [lesson("l2", 2), lesson("l3", 3), lesson("l1", 1)];

describe("byOrder", () => {
  it("sorts by the order field without mutating the input", () => {
    const ordered = byOrder(SHUFFLED);
    expect(ordered.map((l) => l.id)).toEqual(["l1", "l2", "l3"]);
    expect(SHUFFLED.map((l) => l.id)).toEqual(["l2", "l3", "l1"]);
  });
});

describe("nextLessonAfter", () => {
  it("returns the lesson that follows in curriculum order", () => {
    expect(nextLessonAfter(SHUFFLED, "l1")?.id).toBe("l2");
    expect(nextLessonAfter(SHUFFLED, "l2")?.id).toBe("l3");
  });

  it("returns null after the last lesson", () => {
    expect(nextLessonAfter(SHUFFLED, "l3")).toBeNull();
  });

  it("returns null for unknown lesson ids", () => {
    expect(nextLessonAfter(SHUFFLED, "nope")).toBeNull();
  });
});
