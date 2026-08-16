import type { Lesson } from "@/domain/curriculum/types";
import type { ProgressData } from "./progress";

/** Distinct lesson ids with at least one completed session. */
export function completedLessonIds(progress: ProgressData): Set<string> {
  return new Set(progress.sessions.map((session) => session.lessonId));
}

/** First uncompleted lesson in curriculum order, or null when done. */
export function currentLessonId(
  curriculum: Lesson[],
  progress: ProgressData,
): string | null {
  const completed = completedLessonIds(progress);
  const ordered = [...curriculum].sort((a, b) => a.order - b.order);
  const next = ordered.find((lesson) => !completed.has(lesson.id));
  return next ? next.id : null;
}

/**
 * A lesson is unlocked when it is the first one or its predecessor (by
 * order) has been completed. Completed lessons stay unlocked for replay.
 */
export function isLessonUnlocked(
  curriculum: Lesson[],
  progress: ProgressData,
  lessonId: string,
): boolean {
  const ordered = [...curriculum].sort((a, b) => a.order - b.order);
  const index = ordered.findIndex((lesson) => lesson.id === lessonId);
  if (index === -1) return false;
  if (index === 0) return true;
  return completedLessonIds(progress).has(ordered[index - 1].id);
}
