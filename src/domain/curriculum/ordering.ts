import type { Lesson } from "./types";

/** Lesson sequencing helpers; ordering follows the `order` field. */

/** A copy of the curriculum sorted by lesson order; the input is not mutated. */
export function byOrder(curriculum: Lesson[]): Lesson[] {
  return [...curriculum].sort((a, b) => a.order - b.order);
}

/** The lesson that follows the given one in curriculum order, or null. */
export function nextLessonAfter(
  curriculum: Lesson[],
  lessonId: string,
): Lesson | null {
  const ordered = byOrder(curriculum);
  const index = ordered.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? (ordered[index + 1] ?? null) : null;
}
