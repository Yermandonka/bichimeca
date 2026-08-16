import type { Lesson } from "@/domain/curriculum/types";
import type { ProgressData } from "@/domain/progress/progress";
import { currentLessonId } from "@/domain/progress/selectors";
import { byOrder } from "@/domain/curriculum/ordering";

/**
 * Word material and difficulty for the typing mini-games.
 *
 * The pool reuses the curriculum's own exercise tokens from lessons the
 * learner has reached, so a game can never ask for a key that hasn't been
 * taught, and difficulty follows the world Estrella is currently in.
 */

/** Lessons the learner has reached: everything up to the current one. */
function reachedLessons(curriculum: Lesson[], progress: ProgressData): Lesson[] {
  const ordered = byOrder(curriculum);
  const current = currentLessonId(curriculum, progress);
  if (current === null) return ordered;
  const index = ordered.findIndex((lesson) => lesson.id === current);
  return ordered.slice(0, index + 1);
}

/** Keys taught in lessons the learner has reached. */
export function unlockedKeys(
  curriculum: Lesson[],
  progress: ProgressData,
): Set<string> {
  const keys = new Set<string>();
  for (const lesson of reachedLessons(curriculum, progress)) {
    lesson.introducedKeys.forEach((key) => keys.add(key.toLowerCase()));
  }
  return keys;
}

/** Unique typing tokens (length ≥ 2) available to the learner right now. */
export function gameWordPool(
  curriculum: Lesson[],
  progress: ProgressData,
): string[] {
  const keys = unlockedKeys(curriculum, progress);
  const pool = new Set<string>();
  for (const lesson of reachedLessons(curriculum, progress)) {
    for (const exercise of lesson.exercises) {
      for (const token of exercise.text.split(" ")) {
        const lower = token.toLowerCase();
        if (lower.length < 2) continue;
        if ([...lower].every((char) => keys.has(char))) pool.add(lower);
      }
    }
  }
  return [...pool];
}

export interface GameDifficulty {
  /** World the learner is currently in (drives all other values). */
  world: number;
  /** Time an item takes to cross the play field, in ms. */
  fallMs: number;
  /** Interval between item spawns, in ms. */
  spawnMs: number;
  /** Maximum simultaneous items on screen. */
  maxItems: number;
}

const LEVELS: Record<number, Omit<GameDifficulty, "world">> = {
  1: { fallMs: 9000, spawnMs: 3400, maxItems: 3 },
  2: { fallMs: 7500, spawnMs: 2900, maxItems: 4 },
  3: { fallMs: 6200, spawnMs: 2500, maxItems: 5 },
  4: { fallMs: 5400, spawnMs: 2200, maxItems: 5 },
  5: { fallMs: 4800, spawnMs: 2000, maxItems: 6 },
};

const HARDEST = Math.max(...Object.keys(LEVELS).map(Number));

/** Difficulty for the learner's current world (capped at the hardest level). */
export function gameDifficulty(
  curriculum: Lesson[],
  progress: ProgressData,
): GameDifficulty {
  const reached = reachedLessons(curriculum, progress);
  const world = reached.length > 0 ? reached[reached.length - 1].world : 1;
  const level = LEVELS[Math.min(world, HARDEST)] ?? LEVELS[1];
  return { world, ...level };
}
