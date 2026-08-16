import type { ProgressData } from "@/domain/progress/progress";
import { migrateToCurrent } from "@/domain/progress/migrations";

/**
 * Persistence boundary for learner progress. The rest of the application
 * only sees `ProgressStore`; the current backing is localStorage and can
 * later move to IndexedDB or a sync service without touching callers.
 *
 * Loading never destroys stored data: corrupt or incompatible content
 * simply yields null so the raw value stays available for recovery.
 */

export const PROGRESS_STORAGE_KEY = "bichimeca.progress";

type StringStorage = Pick<Storage, "getItem" | "setItem">;

export interface ProgressStore {
  load(): ProgressData | null;
  save(progress: ProgressData): void;
}

export function createLocalProgressStore(storage: StringStorage): ProgressStore {
  return {
    load() {
      const raw = storage.getItem(PROGRESS_STORAGE_KEY);
      if (raw === null) return null;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }
      const result = migrateToCurrent(parsed);
      return result.ok ? result.data : null;
    },
    save(progress) {
      storage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    },
  };
}
