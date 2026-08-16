import { describe, it, expect } from "vitest";
import { createSession, handleInput, handleBackspace, summarize } from "./session";

function drive(
  text: string,
  events: Array<{ char?: string; backspace?: true }>,
  startMs = 1000,
  stepMs = 200,
) {
  let session = createSession({ text, mode: "test" });
  events.forEach((event, i) => {
    const timeMs = startMs + i * stepMs;
    session = event.backspace
      ? handleBackspace(session, { timeMs })
      : handleInput(session, { char: event.char!, timeMs });
  });
  return session;
}

describe("test-mode session: real-typing behavior", () => {
  it("advances on a wrong character instead of blocking", () => {
    const session = drive("casa", [{ char: "c" }, { char: "x" }]);
    expect(session.position).toBe(2);
    expect(session.errors).toBe(1);
  });

  it("completes when the buffer reaches the target length", () => {
    const session = drive("sol", [{ char: "s" }, { char: "o" }, { char: "x" }]);
    expect(session.isComplete).toBe(true);
  });

  it("does not cascade errors after one wrong character", () => {
    // Learner types 'x' instead of 'a' but continues aligned by position:
    // remaining correct chars are still counted correct.
    const session = drive("casa", [
      { char: "c" },
      { char: "x" },
      { char: "s" },
      { char: "a" },
    ]);
    expect(session.errors).toBe(1);
    expect(session.correctKeystrokes).toBe(3);
  });

  it("backspace removes the last typed character and allows correction", () => {
    const session = drive("sol", [
      { char: "s" },
      { char: "x" },
      { backspace: true },
      { char: "o" },
      { char: "l" },
    ]);
    expect(session.isComplete).toBe(true);
    expect(session.errors).toBe(1);
    // The final text is fully correct after the fix.
    expect(session.correctedPositions).toBe(1);
    expect(session.cleanPositions).toBe(2);
  });

  it("counts an uncorrected error exactly once, at input time", () => {
    const session = drive("sol", [{ char: "s" }, { char: "x" }, { char: "l" }]);
    expect(session.errors).toBe(1);
    expect(session.correctedPositions).toBe(0);
    expect(session.cleanPositions).toBe(2);
  });

  it("backspace at the start is a safe no-op", () => {
    const session = drive("sol", [{ backspace: true }, { char: "s" }]);
    expect(session.position).toBe(1);
    expect(session.errors).toBe(0);
  });

  it("backspace does not erase the record of a corrected error", () => {
    const session = drive("ala", [
      { char: "a" },
      { char: "x" },
      { backspace: true },
      { char: "l" },
      { char: "a" },
    ]);
    // Accuracy accounts for the original mistake even though the final
    // buffer is perfect: 4 char inputs, 3 correct.
    expect(session.totalKeystrokes).toBe(4);
    expect(session.correctKeystrokes).toBe(3);
    expect(session.errors).toBe(1);
  });

  it("attributes test-mode errors to the expected key", () => {
    const session = drive("casa", [{ char: "c" }, { char: "x" }]);
    const statsForA = session.keyStats.get("a")!;
    expect(statsForA.errors).toBe(1);
    expect(session.keyStats.has("x")).toBe(false);
  });
});

describe("test-mode summarize", () => {
  it("bases net PPM on correct keystrokes and raw PPM on all keystrokes", () => {
    // 5 inputs over 800ms, 4 correct
    const session = drive("mano", [
      { char: "m" },
      { char: "x" },
      { backspace: true },
      { char: "a" },
      { char: "n" },
      { char: "o" },
    ]);
    const summary = summarize(session);
    expect(summary.totalKeystrokes).toBe(5);
    expect(summary.correctKeystrokes).toBe(4);
    expect(summary.accuracy).toBeCloseTo(4 / 5);
    expect(summary.rawPpm).toBeGreaterThan(summary.ppm);
    expect(Number.isFinite(summary.ppm)).toBe(true);
  });

  it("keeps clean/corrected accounting coherent with the final buffer", () => {
    const session = drive("sol", [
      { char: "s" },
      { char: "x" },
      { backspace: true },
      { char: "o" },
      { char: "l" },
    ]);
    const summary = summarize(session);
    expect(summary.cleanPositions + summary.correctedPositions).toBe(3);
  });
});
