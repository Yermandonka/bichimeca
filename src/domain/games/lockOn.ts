/**
 * Lock-on typing shared by the mini-games: the first key selects a target
 * whose word starts with it, later keys must follow that word, and
 * completing it releases the lock. Pure and deterministic.
 */

export interface LockCandidate {
  id: number;
  word: string;
}

export interface LockOnState {
  targetId: number | null;
  typed: string;
}

export const initialLockOn: LockOnState = { targetId: null, typed: "" };

export type LockResult =
  | { kind: "ignored" }
  | { kind: "locked"; targetId: number }
  | { kind: "progress" }
  | { kind: "wrong" }
  | { kind: "completed"; targetId: number };

export function pressKey(
  state: LockOnState,
  items: LockCandidate[],
  char: string,
): { state: LockOnState; result: LockResult } {
  const target =
    state.targetId !== null
      ? items.find((item) => item.id === state.targetId)
      : undefined;

  if (!target) {
    // Not locked (or the target vanished): lock onto the first candidate.
    const candidate = items.find((item) => item.word.startsWith(char));
    if (!candidate) return { state: initialLockOn, result: { kind: "ignored" } };
    if (candidate.word.length === 1) {
      return {
        state: initialLockOn,
        result: { kind: "completed", targetId: candidate.id },
      };
    }
    return {
      state: { targetId: candidate.id, typed: char },
      result: { kind: "locked", targetId: candidate.id },
    };
  }

  const nextTyped = state.typed + char;
  if (!target.word.startsWith(nextTyped)) {
    return { state, result: { kind: "wrong" } };
  }
  if (nextTyped === target.word) {
    return { state: initialLockOn, result: { kind: "completed", targetId: target.id } };
  }
  return {
    state: { targetId: target.id, typed: nextTyped },
    result: { kind: "progress" },
  };
}
