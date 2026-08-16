import { describe, it, expect } from "vitest";
import { createSession, handleInput, handleBackspace, summarize } from "./session";

/**
 * Deterministic driver: types the given characters at fixed 200ms intervals
 * starting at t=1000.
 */
function type(text: string, chars: string[], startMs = 1000, stepMs = 200) {
  let session = createSession({ text, mode: "learning" });
  chars.forEach((char, i) => {
    session = handleInput(session, { char, timeMs: startMs + i * stepMs });
  });
  return session;
}

describe("learning-mode session: progression", () => {
  it("advances one position per correct character", () => {
    const session = type("casa", ["c", "a", "s"]);
    expect(session.position).toBe(3);
    expect(session.isComplete).toBe(false);
  });

  it("completes when the whole text is typed correctly", () => {
    const session = type("sol", ["s", "o", "l"]);
    expect(session.position).toBe(3);
    expect(session.isComplete).toBe(true);
  });

  it("does not advance on a wrong character", () => {
    const session = type("casa", ["c", "x"]);
    expect(session.position).toBe(1);
  });

  it("ignores input after completion", () => {
    const session = type("no", ["n", "o", "x", "y"]);
    expect(session.isComplete).toBe(true);
    expect(session.totalKeystrokes).toBe(2);
  });

  it("handles Spanish characters as single composed characters", () => {
    const session = type("ñandú", ["ñ", "a", "n", "d", "ú"]);
    expect(session.isComplete).toBe(true);
    expect(session.errors).toBe(0);
  });

  it("treats an empty text as complete from the start", () => {
    let session = createSession({ text: "", mode: "learning" });
    expect(session.isComplete).toBe(true);
    session = handleInput(session, { char: "x", timeMs: 1000 });
    expect(session.totalKeystrokes).toBe(0);
    expect(summarize(session).accuracy).toBeNull();
  });
});

describe("learning-mode session: error accounting", () => {
  it("counts each wrong attempt as exactly one error keystroke", () => {
    const session = type("casa", ["c", "x", "z", "a"]);
    expect(session.totalKeystrokes).toBe(4);
    expect(session.correctKeystrokes).toBe(2);
    expect(session.errors).toBe(2);
  });

  it("attributes errors to the expected key, not the typed key", () => {
    const session = type("casa", ["c", "x", "a"]);
    const statsForA = session.keyStats.get("a")!;
    expect(statsForA.errors).toBe(1);
    expect(statsForA.attempts).toBe(2);
    expect(statsForA.correct).toBe(1);
    expect(session.keyStats.has("x")).toBe(false);
  });

  it("distinguishes clean positions from corrected positions", () => {
    // 'c' clean, 'a' wrong-then-right (corrected), 's' clean, 'a' clean
    const session = type("casa", ["c", "x", "a", "s", "a"]);
    expect(session.cleanPositions).toBe(3);
    expect(session.correctedPositions).toBe(1);
  });

  it("counts a position with several wrong attempts as one corrected position", () => {
    const session = type("si", ["x", "z", "s", "i"]);
    expect(session.correctedPositions).toBe(1);
    expect(session.cleanPositions).toBe(1);
    expect(session.errors).toBe(2);
  });

  it("treats backspace as a no-op that is never counted as an error", () => {
    let session = createSession({ text: "sol", mode: "learning" });
    session = handleInput(session, { char: "s", timeMs: 1000 });
    session = handleBackspace(session, { timeMs: 1100 });
    expect(session.position).toBe(1);
    expect(session.totalKeystrokes).toBe(1);
    expect(session.errors).toBe(0);
  });
});

describe("learning-mode session: latency", () => {
  it("measures latency from readiness to the correct press", () => {
    let session = createSession({ text: "al", mode: "learning" });
    // First key: readiness starts at the session's first event.
    session = handleInput(session, { char: "a", timeMs: 1000 });
    session = handleInput(session, { char: "l", timeMs: 1450 });
    const statsForL = session.keyStats.get("l")!;
    expect(statsForL.latenciesMs).toEqual([450]);
  });

  it("measures latency for a corrected key from readiness, not from the mistake", () => {
    let session = createSession({ text: "al", mode: "learning" });
    session = handleInput(session, { char: "a", timeMs: 1000 });
    session = handleInput(session, { char: "x", timeMs: 1200 });
    session = handleInput(session, { char: "l", timeMs: 1700 });
    const statsForL = session.keyStats.get("l")!;
    // readiness at 1000 (after 'a'), correct press at 1700
    expect(statsForL.latenciesMs).toEqual([700]);
  });
});

describe("summarize", () => {
  it("produces coherent metrics for a clean run", () => {
    // "mano" typed perfectly, 4 chars over 600ms of typing
    const session = type("mano", ["m", "a", "n", "o"]);
    const summary = summarize(session);
    expect(summary.accuracy).toBe(1);
    expect(summary.errors).toBe(0);
    expect(summary.durationMs).toBe(600);
    // 4 correct chars = 0.8 words in 0.01 min -> 80 PPM
    expect(summary.ppm).toBeCloseTo(80);
    expect(summary.rawPpm).toBeCloseTo(80);
  });

  it("reflects errors in accuracy and separates raw from net speed", () => {
    const session = type("mano", ["m", "x", "a", "n", "o"]);
    const summary = summarize(session);
    expect(summary.accuracy).toBeCloseTo(4 / 5);
    expect(summary.errors).toBe(1);
    expect(summary.rawPpm).toBeGreaterThan(summary.ppm);
  });

  it("returns safe values for an empty session (no NaN/Infinity)", () => {
    const session = createSession({ text: "hola", mode: "learning" });
    const summary = summarize(session);
    expect(summary.accuracy).toBeNull();
    expect(summary.ppm).toBe(0);
    expect(summary.rawPpm).toBe(0);
    expect(summary.durationMs).toBe(0);
    expect(summary.consistency).toBeNull();
  });

  it("computes consistency from inter-keystroke intervals", () => {
    const chars = "teclado".split("");
    const session = type("teclado", chars); // uniform 200ms rhythm
    const summary = summarize(session);
    expect(summary.consistency).toBe(100);
  });

  it("carries clean/corrected counts into the summary", () => {
    const session = type("casa", ["c", "x", "a", "s", "a"]);
    const summary = summarize(session);
    expect(summary.cleanPositions).toBe(3);
    expect(summary.correctedPositions).toBe(1);
  });
});
