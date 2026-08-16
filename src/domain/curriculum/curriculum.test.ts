import { describe, it, expect } from "vitest";
import { allowedKeysForLesson, validateCurriculum } from "./validate";
import type { Lesson } from "./types";
import { CURRICULUM_ES } from "@/data/curriculum/es";

function lesson(overrides: Partial<Lesson>): Lesson {
  return {
    id: "w1-l1",
    world: 1,
    order: 1,
    title: "Prueba",
    type: "learn",
    introducedKeys: ["f", "j"],
    practicedKeys: ["f", "j"],
    xp: 20,
    exercises: [{ type: "drill", text: "fff jjj" }],
    ...overrides,
  };
}

describe("allowedKeysForLesson", () => {
  it("accumulates keys introduced by earlier lessons plus its own", () => {
    const curriculum = [
      lesson({ id: "a", order: 1, introducedKeys: ["f", "j"] }),
      lesson({ id: "b", order: 2, introducedKeys: ["d", "k"] }),
      lesson({ id: "c", order: 3, introducedKeys: [] }),
    ];
    const allowed = allowedKeysForLesson(curriculum, curriculum[1]);
    expect(allowed).toEqual(new Set(["f", "j", "d", "k"]));
    const allowedForReview = allowedKeysForLesson(curriculum, curriculum[2]);
    expect(allowedForReview).toEqual(new Set(["f", "j", "d", "k"]));
  });

  it("does not include keys from later lessons", () => {
    const curriculum = [
      lesson({ id: "a", order: 1, introducedKeys: ["f", "j"] }),
      lesson({ id: "b", order: 2, introducedKeys: ["d", "k"] }),
    ];
    const allowed = allowedKeysForLesson(curriculum, curriculum[0]);
    expect(allowed.has("d")).toBe(false);
  });
});

describe("validateCurriculum", () => {
  it("accepts a well-formed curriculum", () => {
    const problems = validateCurriculum([
      lesson({ id: "a", order: 1 }),
      lesson({
        id: "b",
        order: 2,
        introducedKeys: ["d", "k"],
        exercises: [{ type: "drill", text: "fjd kdj fkd" }],
      }),
    ]);
    expect(problems).toEqual([]);
  });

  it("flags exercises that use keys not yet introduced", () => {
    const problems = validateCurriculum([
      lesson({
        id: "a",
        order: 1,
        introducedKeys: ["f", "j"],
        exercises: [{ type: "drill", text: "fja" }],
      }),
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/"a"/);
    expect(problems[0]).toMatch(/a/);
  });

  it("always permits the space character", () => {
    const problems = validateCurriculum([
      lesson({ exercises: [{ type: "drill", text: "fff jjj fjf" }] }),
    ]);
    expect(problems).toEqual([]);
  });

  it("flags duplicate lesson ids", () => {
    const problems = validateCurriculum([
      lesson({ id: "dup", order: 1 }),
      lesson({ id: "dup", order: 2 }),
    ]);
    expect(problems.some((p) => /duplicad/i.test(p))).toBe(true);
  });

  it("flags lessons whose practiced keys were never introduced", () => {
    const problems = validateCurriculum([
      lesson({ practicedKeys: ["f", "j", "q"] }),
    ]);
    expect(problems.some((p) => /practicada/i.test(p))).toBe(true);
  });

  it("flags empty exercises", () => {
    const problems = validateCurriculum([lesson({ exercises: [] })]);
    expect(problems.some((p) => /ejercicio/i.test(p))).toBe(true);
  });
});

describe("CURRICULUM_ES (real content)", () => {
  it("passes full validation", () => {
    expect(validateCurriculum(CURRICULUM_ES)).toEqual([]);
  });

  it("starts with the F/J anchor keys", () => {
    const first = CURRICULUM_ES[0];
    expect(first.introducedKeys).toEqual(["f", "j"]);
  });

  it("introduces the complete home row across world 1", () => {
    const world1 = CURRICULUM_ES.filter((l) => l.world === 1);
    const introduced = new Set(world1.flatMap((l) => l.introducedKeys));
    for (const key of ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"]) {
      expect(introduced.has(key), `falta ${key}`).toBe(true);
    }
  });

  it("never introduces more than two keys in a single lesson", () => {
    for (const l of CURRICULUM_ES) {
      expect(l.introducedKeys.length, l.id).toBeLessThanOrEqual(2);
    }
  });

  it("keeps earlier keys in practice after new keys arrive (interleaving)", () => {
    const world1 = CURRICULUM_ES.filter((l) => l.world === 1);
    const last = world1[world1.length - 1];
    expect(last.practicedKeys).toContain("f");
    expect(last.practicedKeys).toContain("j");
  });
});
