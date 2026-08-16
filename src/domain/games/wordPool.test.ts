import { describe, it, expect } from "vitest";
import { unlockedKeys, gameWordPool, gameDifficulty } from "./wordPool";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import { createEmptyProgress, appendSession } from "@/domain/progress/progress";

const NOW = "2026-08-16T12:00:00.000Z";

function progressWithCompleted(lessonIds: string[]) {
  let progress = createEmptyProgress(NOW);
  lessonIds.forEach((lessonId, i) => {
    progress = appendSession(progress, {
      id: `s${i}`,
      completedAt: NOW,
      lessonId,
      exerciseType: "learn",
      durationMs: 60_000,
      totalKeystrokes: 100,
      correctKeystrokes: 95,
      errors: 5,
      accuracy: 0.95,
      ppm: 20,
      rawPpm: 21,
      consistency: 70,
      xp: 20,
    });
  });
  return progress;
}

describe("unlockedKeys", () => {
  it("gives a brand-new learner only the first lesson's keys", () => {
    const keys = unlockedKeys(CURRICULUM_ES, createEmptyProgress(NOW));
    expect(keys).toEqual(new Set(["f", "j"]));
  });

  it("grows with completed lessons", () => {
    const progress = progressWithCompleted(["w1-l1", "w1-l2", "w1-l3"]);
    const keys = unlockedKeys(CURRICULUM_ES, progress);
    expect(keys.has("d")).toBe(true);
    expect(keys.has("k")).toBe(true);
    expect(keys.has("s")).toBe(false);
  });

  it("unlocks every key when the curriculum is finished", () => {
    const progress = progressWithCompleted(CURRICULUM_ES.map((l) => l.id));
    const keys = unlockedKeys(CURRICULUM_ES, progress);
    for (const lesson of CURRICULUM_ES) {
      for (const key of lesson.introducedKeys) {
        expect(keys.has(key), key).toBe(true);
      }
    }
  });
});

describe("gameWordPool", () => {
  it("is empty while progress is still loading (null)", () => {
    expect(gameWordPool(CURRICULUM_ES, null)).toEqual([]);
  });

  it("is never empty, even for a brand-new learner", () => {
    const pool = gameWordPool(CURRICULUM_ES, createEmptyProgress(NOW));
    expect(pool.length).toBeGreaterThan(0);
  });

  it("only contains tokens typeable with unlocked keys", () => {
    const progress = progressWithCompleted(["w1-l1", "w1-l2", "w1-l3"]);
    const keys = unlockedKeys(CURRICULUM_ES, progress);
    const pool = gameWordPool(CURRICULUM_ES, progress);
    for (const word of pool) {
      for (const char of word) {
        expect(keys.has(char), `"${char}" en "${word}"`).toBe(true);
      }
    }
  });

  it("contains real words once enough lessons are complete", () => {
    const progress = progressWithCompleted(
      CURRICULUM_ES.filter((l) => l.world === 1).map((l) => l.id),
    );
    const pool = gameWordPool(CURRICULUM_ES, progress);
    expect(pool).toContain("salsa");
  });

  it("has no duplicates and no single-character tokens", () => {
    const pool = gameWordPool(CURRICULUM_ES, createEmptyProgress(NOW));
    expect(new Set(pool).size).toBe(pool.length);
    for (const word of pool) expect(word.length).toBeGreaterThanOrEqual(2);
  });
});

describe("gameDifficulty", () => {
  it("starts gentle for world 1", () => {
    const difficulty = gameDifficulty(CURRICULUM_ES, createEmptyProgress(NOW));
    expect(difficulty.world).toBe(1);
    expect(difficulty.fallMs).toBeGreaterThan(7000);
  });

  it("gets faster in later worlds", () => {
    const world1 = gameDifficulty(CURRICULUM_ES, createEmptyProgress(NOW));
    const progress3 = progressWithCompleted(
      CURRICULUM_ES.filter((l) => l.world <= 2).map((l) => l.id),
    );
    const world3 = gameDifficulty(CURRICULUM_ES, progress3);
    expect(world3.world).toBe(3);
    expect(world3.fallMs).toBeLessThan(world1.fallMs);
    expect(world3.spawnMs).toBeLessThan(world1.spawnMs);
  });

  it("caps at the hardest defined level when everything is complete", () => {
    const progress = progressWithCompleted(CURRICULUM_ES.map((l) => l.id));
    const difficulty = gameDifficulty(CURRICULUM_ES, progress);
    expect(difficulty.fallMs).toBeGreaterThan(1000);
    expect(Number.isFinite(difficulty.spawnMs)).toBe(true);
  });

  it("gives the gentlest level while progress is still loading (null)", () => {
    const difficulty = gameDifficulty(CURRICULUM_ES, null);
    expect(difficulty).toEqual({ world: 1, fallMs: 9000, spawnMs: 3400, maxItems: 3 });
  });

  it("defaults to the gentlest level with an empty curriculum", () => {
    const difficulty = gameDifficulty([], createEmptyProgress(NOW));
    expect(difficulty.world).toBe(1);
    expect(difficulty.fallMs).toBe(9000);
  });

  it("falls back to level 1 for worlds without a defined level", () => {
    const oddCurriculum = [
      {
        id: "w0-l1",
        world: 0,
        order: 1,
        title: "Fuera de rango",
        type: "learn" as const,
        introducedKeys: ["f", "j"],
        practicedKeys: ["f", "j"],
        xp: 10,
        exercises: [{ type: "drill" as const, text: "fj f jf" }],
      },
    ];
    const difficulty = gameDifficulty(oddCurriculum, createEmptyProgress(NOW));
    expect(difficulty.world).toBe(0);
    expect(difficulty.fallMs).toBe(9000);
  });

  it("skips single-character tokens in the pool", () => {
    const oddCurriculum = [
      {
        id: "w1-x",
        world: 1,
        order: 1,
        title: "Con letras sueltas",
        type: "learn" as const,
        introducedKeys: ["f", "j"],
        practicedKeys: ["f", "j"],
        xp: 10,
        exercises: [{ type: "drill" as const, text: "f j fj jf" }],
      },
    ];
    const pool = gameWordPool(oddCurriculum, createEmptyProgress(NOW));
    expect(pool.sort()).toEqual(["fj", "jf"]);
  });
});
