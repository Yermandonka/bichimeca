/**
 * Data-driven curriculum types. Learning content lives in
 * `src/data/curriculum/` and is validated automatically: an exercise may
 * only use keys already introduced at that point of the journey.
 */

export type LessonType =
  | "learn"
  | "guided-drill"
  | "combo-drill"
  | "words"
  | "sentences"
  | "accuracy"
  | "rhythm"
  | "speed"
  | "weak-keys"
  | "review"
  | "boss";

export type ExerciseType = "drill" | "words" | "sentences";

export interface Exercise {
  type: ExerciseType;
  text: string;
}

export interface Lesson {
  id: string;
  world: number;
  /** Global position within the curriculum; drives key availability. */
  order: number;
  title: string;
  type: LessonType;
  /** Keys taught for the first time in this lesson (max 2). */
  introducedKeys: string[];
  /** Keys the lesson deliberately exercises; must all be introduced by now. */
  practicedKeys: string[];
  xp: number;
  exercises: Exercise[];
  /** Short technique/posture advice shown when the lesson starts. */
  tip?: string;
  /**
   * Optional in-lesson dynamic that changes how progress is presented:
   * "carrera" (energy bar refilled by correct keys), "globos" (a balloon
   * pops per completed word) or "jefe" (boss with health bar). The typing
   * pedagogy underneath is identical.
   */
  dynamic?: "carrera" | "globos" | "jefe";
}

/** Characters always permitted in exercise text besides learned keys. */
export const ALWAYS_ALLOWED_CHARS = new Set([" "]);
