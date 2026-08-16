import { SHIFTED_CHARS } from "@/domain/keyboard/layout";
import { ALWAYS_ALLOWED_CHARS, type Lesson } from "./types";

/**
 * Curriculum content validation, run in automated tests so broken content
 * can never ship: unique ids, coherent ordering, and the core constraint
 * that exercises only use keys already introduced.
 */

/** Keys available in a lesson: everything introduced up to and including it. */
export function allowedKeysForLesson(
  curriculum: Lesson[],
  lesson: Lesson,
): Set<string> {
  const allowed = new Set<string>();
  for (const candidate of curriculum) {
    if (candidate.order <= lesson.order) {
      candidate.introducedKeys.forEach((key) => allowed.add(key));
    }
  }
  return allowed;
}

export function validateCurriculum(curriculum: Lesson[]): string[] {
  const problems: string[] = [];
  const seenIds = new Set<string>();
  const seenOrders = new Set<number>();

  for (const lesson of curriculum) {
    if (seenIds.has(lesson.id)) {
      problems.push(`Lección "${lesson.id}": id duplicado`);
    }
    seenIds.add(lesson.id);

    if (seenOrders.has(lesson.order)) {
      problems.push(`Lección "${lesson.id}": orden ${lesson.order} duplicado`);
    }
    seenOrders.add(lesson.order);

    if (lesson.introducedKeys.length > 2) {
      problems.push(
        `Lección "${lesson.id}": introduce ${lesson.introducedKeys.length} teclas (máximo 2)`,
      );
    }

    if (lesson.exercises.length === 0) {
      problems.push(`Lección "${lesson.id}": no tiene ejercicios`);
    }

    const allowed = allowedKeysForLesson(curriculum, lesson);

    for (const key of lesson.practicedKeys) {
      if (!allowed.has(key)) {
        problems.push(
          `Lección "${lesson.id}": tecla practicada "${key}" nunca introducida`,
        );
      }
    }

    lesson.exercises.forEach((exercise, index) => {
      for (const char of exercise.text) {
        if (allowed.has(char) || ALWAYS_ALLOWED_CHARS.has(char)) continue;
        // Shifted characters (uppercase letters, ; : _) are available once
        // the learner knows Shift ("⇧") and the base key.
        const baseChar = SHIFTED_CHARS[char] ?? char.toLowerCase();
        if (baseChar !== char && allowed.has("⇧") && allowed.has(baseChar)) {
          continue;
        }
        problems.push(
          `Lección "${lesson.id}", ejercicio ${index}: carácter "${char}" no disponible todavía`,
        );
        break;
      }
    });
  }

  return problems;
}
