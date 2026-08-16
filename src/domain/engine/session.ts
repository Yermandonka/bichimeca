import {
  accuracy,
  consistencyScore,
  ppm,
  rawPpm,
} from "@/domain/metrics/metrics";

/**
 * Typing session engine, independent of React and the DOM.
 *
 * The engine consumes composed textual characters (the caller is responsible
 * for using text/input events so dead keys and accents arrive as single
 * characters) plus caller-provided timestamps, which keeps every behavior
 * deterministic and testable.
 *
 * Learning mode rules:
 * - A wrong character never advances the position, so one mistake cannot
 *   cascade into misaligned errors.
 * - Every wrong attempt counts as exactly one error keystroke, attributed to
 *   the key the learner was supposed to press.
 * - A position completed without any wrong attempt is "clean"; completed
 *   after one or more wrong attempts it is "corrected" (counted once).
 * - Backspace is a no-op and is never counted as a keystroke or error.
 * - Key latency runs from the moment a position becomes ready (previous
 *   position completed, or first input for the opening position) until the
 *   correct press.
 *
 * Test mode rules (real-typing behavior, position-aligned so a single
 * mistake still cannot cascade):
 * - Any character advances into the buffer; errors are counted once, at
 *   input time, attributed to the expected key, and are never erased by a
 *   later backspace.
 * - Backspace deletes the last buffer character (safe no-op when empty) and
 *   is not counted as a keystroke.
 * - Clean/corrected positions are judged against the final buffer: a
 *   position is "clean" when its final character is correct and it never
 *   errored, "corrected" when its final character is correct after a
 *   mistake; an uncorrected wrong character counts in neither.
 * - The session completes when the buffer reaches the target length.
 */

export type ExerciseMode = "learning" | "test";

export interface KeyStats {
  attempts: number;
  correct: number;
  errors: number;
  latenciesMs: number[];
}

export interface Session {
  readonly text: string;
  readonly mode: ExerciseMode;
  readonly position: number;
  readonly isComplete: boolean;
  readonly totalKeystrokes: number;
  readonly correctKeystrokes: number;
  readonly errors: number;
  readonly cleanPositions: number;
  readonly correctedPositions: number;
  readonly currentPositionErrored: boolean;
  readonly keyStats: ReadonlyMap<string, KeyStats>;
  readonly firstEventMs: number | null;
  readonly lastEventMs: number | null;
  readonly readySinceMs: number | null;
  readonly keystrokeTimesMs: readonly number[];
  /** Test mode only: characters currently in the buffer. */
  readonly buffer: readonly string[];
  /** Test mode only: positions that errored at input time (never erased). */
  readonly erroredPositions: ReadonlySet<number>;
}

export interface SessionSummary {
  durationMs: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  errors: number;
  accuracy: number | null;
  ppm: number;
  rawPpm: number;
  consistency: number | null;
  cleanPositions: number;
  correctedPositions: number;
}

export function createSession(input: {
  text: string;
  mode: ExerciseMode;
}): Session {
  return {
    text: input.text,
    mode: input.mode,
    position: 0,
    isComplete: input.text.length === 0,
    totalKeystrokes: 0,
    correctKeystrokes: 0,
    errors: 0,
    cleanPositions: 0,
    correctedPositions: 0,
    currentPositionErrored: false,
    keyStats: new Map(),
    firstEventMs: null,
    lastEventMs: null,
    readySinceMs: null,
    keystrokeTimesMs: [],
    buffer: [],
    erroredPositions: new Set(),
  };
}

function judgeBufferPositions(
  text: string,
  buffer: readonly string[],
  erroredPositions: ReadonlySet<number>,
): { cleanPositions: number; correctedPositions: number } {
  let clean = 0;
  let corrected = 0;
  buffer.forEach((char, i) => {
    if (char !== text[i]) return;
    if (erroredPositions.has(i)) corrected += 1;
    else clean += 1;
  });
  return { cleanPositions: clean, correctedPositions: corrected };
}

function cloneStats(
  keyStats: ReadonlyMap<string, KeyStats>,
  key: string,
): [Map<string, KeyStats>, KeyStats] {
  const next = new Map(keyStats);
  const existing = next.get(key);
  const stats: KeyStats = existing
    ? { ...existing, latenciesMs: [...existing.latenciesMs] }
    : { attempts: 0, correct: 0, errors: 0, latenciesMs: [] };
  next.set(key, stats);
  return [next, stats];
}

export function handleInput(
  session: Session,
  event: { char: string; timeMs: number },
): Session {
  if (session.isComplete) return session;
  return session.mode === "test"
    ? handleTestInput(session, event)
    : handleLearningInput(session, event);
}

function handleLearningInput(
  session: Session,
  event: { char: string; timeMs: number },
): Session {
  const expected = session.text[session.position];
  const readySinceMs = session.readySinceMs ?? event.timeMs;
  const [keyStats, stats] = cloneStats(session.keyStats, expected);
  stats.attempts += 1;

  const base = {
    ...session,
    keyStats,
    totalKeystrokes: session.totalKeystrokes + 1,
    firstEventMs: session.firstEventMs ?? event.timeMs,
    lastEventMs: event.timeMs,
    keystrokeTimesMs: [...session.keystrokeTimesMs, event.timeMs],
  };

  if (event.char !== expected) {
    stats.errors += 1;
    return {
      ...base,
      errors: session.errors + 1,
      currentPositionErrored: true,
      readySinceMs,
    };
  }

  stats.correct += 1;
  stats.latenciesMs.push(event.timeMs - readySinceMs);
  const position = session.position + 1;
  return {
    ...base,
    position,
    isComplete: position === session.text.length,
    correctKeystrokes: session.correctKeystrokes + 1,
    cleanPositions: session.cleanPositions + (session.currentPositionErrored ? 0 : 1),
    correctedPositions:
      session.correctedPositions + (session.currentPositionErrored ? 1 : 0),
    currentPositionErrored: false,
    readySinceMs: event.timeMs,
  };
}

function handleTestInput(
  session: Session,
  event: { char: string; timeMs: number },
): Session {
  const positionIndex = session.buffer.length;
  const expected = session.text[positionIndex];
  const readySinceMs = session.readySinceMs ?? event.timeMs;
  const [keyStats, stats] = cloneStats(session.keyStats, expected);
  stats.attempts += 1;

  const correct = event.char === expected;
  const erroredPositions = correct
    ? session.erroredPositions
    : new Set(session.erroredPositions).add(positionIndex);
  if (correct) {
    stats.correct += 1;
    stats.latenciesMs.push(event.timeMs - readySinceMs);
  } else {
    stats.errors += 1;
  }

  const buffer = [...session.buffer, event.char];
  return {
    ...session,
    keyStats,
    buffer,
    erroredPositions,
    position: buffer.length,
    isComplete: buffer.length === session.text.length,
    totalKeystrokes: session.totalKeystrokes + 1,
    correctKeystrokes: session.correctKeystrokes + (correct ? 1 : 0),
    errors: session.errors + (correct ? 0 : 1),
    ...judgeBufferPositions(session.text, buffer, erroredPositions),
    firstEventMs: session.firstEventMs ?? event.timeMs,
    lastEventMs: event.timeMs,
    readySinceMs: event.timeMs,
    keystrokeTimesMs: [...session.keystrokeTimesMs, event.timeMs],
  };
}

export function handleBackspace(
  session: Session,
  event: { timeMs: number },
): Session {
  // In learning mode a wrong key never enters the buffer, so there is
  // nothing to delete; backspace is intentionally inert and uncounted.
  if (session.mode !== "test") return session;
  if (session.buffer.length === 0 || session.isComplete) return session;

  const buffer = session.buffer.slice(0, -1);
  return {
    ...session,
    buffer,
    position: buffer.length,
    ...judgeBufferPositions(session.text, buffer, session.erroredPositions),
    lastEventMs: event.timeMs,
    readySinceMs: event.timeMs,
  };
}

export function summarize(session: Session): SessionSummary {
  const durationMs =
    session.firstEventMs !== null && session.lastEventMs !== null
      ? session.lastEventMs - session.firstEventMs
      : 0;

  const intervals: number[] = [];
  for (let i = 1; i < session.keystrokeTimesMs.length; i += 1) {
    intervals.push(session.keystrokeTimesMs[i] - session.keystrokeTimesMs[i - 1]);
  }

  return {
    durationMs,
    totalKeystrokes: session.totalKeystrokes,
    correctKeystrokes: session.correctKeystrokes,
    errors: session.errors,
    accuracy: accuracy({
      correctKeystrokes: session.correctKeystrokes,
      totalKeystrokes: session.totalKeystrokes,
    }),
    ppm: ppm({ correctChars: session.correctKeystrokes, durationMs }),
    rawPpm: rawPpm({ totalChars: session.totalKeystrokes, durationMs }),
    consistency: consistencyScore(intervals),
    cleanPositions: session.cleanPositions,
    correctedPositions: session.correctedPositions,
  };
}
