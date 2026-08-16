/**
 * Persistence for per-game best scores. Reading tolerates missing or
 * corrupt values (they count as no record) and never clears storage.
 */

type StringStorage = Pick<Storage, "getItem" | "setItem">;

/** Stored best score for the key, or 0 when absent or unreadable. */
export function loadRecord(storage: StringStorage, key: string): number {
  const stored = Number(storage.getItem(key) ?? "0");
  return Number.isFinite(stored) ? stored : 0;
}

/**
 * Persists the score if it beats the stored record. Returns the best score
 * to display and whether this score set a new record.
 */
export function submitScore(
  storage: StringStorage,
  key: string,
  score: number,
): { best: number; isNew: boolean } {
  const best = loadRecord(storage, key);
  if (score > best) {
    storage.setItem(key, String(score));
    return { best: score, isNew: true };
  }
  return { best, isNew: false };
}
