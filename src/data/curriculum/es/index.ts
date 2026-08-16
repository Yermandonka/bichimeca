import type { Lesson } from "@/domain/curriculum/types";
import { WORLD_1 } from "./world1";

/**
 * Spanish curriculum, ordered. New worlds append here; the content tests
 * validate the whole sequence automatically.
 */
export const CURRICULUM_ES: Lesson[] = [...WORLD_1];
