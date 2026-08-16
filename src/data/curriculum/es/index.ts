import type { Lesson } from "@/domain/curriculum/types";
import { WORLD_1 } from "./world1";
import { WORLD_2 } from "./world2";
import { WORLD_3 } from "./world3";
import { WORLD_4 } from "./world4";
import { WORLD_5 } from "./world5";

/**
 * Spanish curriculum, ordered. New worlds append here; the content tests
 * validate the whole sequence automatically.
 */
export const CURRICULUM_ES: Lesson[] = [
  ...WORLD_1,
  ...WORLD_2,
  ...WORLD_3,
  ...WORLD_4,
  ...WORLD_5,
];

/** Display titles for the course map, indexed by world number. */
export const WORLD_TITLES: Record<number, string> = {
  1: "Mundo 1 — Fila guía",
  2: "Mundo 2 — Fila superior",
  3: "Mundo 3 — Fila inferior",
  4: "Mundo 4 — Mayúsculas",
  5: "Mundo 5 — Puntuación y frases reales",
};
