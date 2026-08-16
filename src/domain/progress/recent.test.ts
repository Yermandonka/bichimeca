import { describe, it, expect } from "vitest";
import { recentAverages, RECENT_SESSION_WINDOW } from "./recent";
import { createEmptyProgress, appendSession } from "./progress";

const NOW = "2026-08-16T12:00:00.000Z";

function progressWith(sessions: Array<{ ppm: number; accuracy: number | null }>) {
  let progress = createEmptyProgress(NOW);
  sessions.forEach((entry, i) => {
    progress = appendSession(progress, {
      id: `s${i}`,
      completedAt: NOW,
      lessonId: `l${i}`,
      exerciseType: "learn",
      durationMs: 60_000,
      totalKeystrokes: 100,
      correctKeystrokes: 90,
      errors: 10,
      accuracy: entry.accuracy,
      ppm: entry.ppm,
      rawPpm: entry.ppm + 1,
      consistency: null,
      xp: 10,
    });
  });
  return progress;
}

describe("recentAverages", () => {
  it("returns nulls with no sessions", () => {
    const result = recentAverages(createEmptyProgress(NOW));
    expect(result.ppm).toBeNull();
    expect(result.accuracy).toBeNull();
  });

  it("averages the available sessions when fewer than the window", () => {
    const result = recentAverages(
      progressWith([
        { ppm: 20, accuracy: 0.9 },
        { ppm: 30, accuracy: 1 },
      ]),
    );
    expect(result.ppm).toBeCloseTo(25);
    expect(result.accuracy).toBeCloseTo(0.95);
  });

  it("only considers the most recent window of sessions", () => {
    const old = Array.from({ length: RECENT_SESSION_WINDOW }, () => ({
      ppm: 10,
      accuracy: 0.8,
    }));
    const recent = Array.from({ length: RECENT_SESSION_WINDOW }, () => ({
      ppm: 40,
      accuracy: 0.98,
    }));
    const result = recentAverages(progressWith([...old, ...recent]));
    expect(result.ppm).toBeCloseTo(40);
    expect(result.accuracy).toBeCloseTo(0.98);
  });

  it("drops exactly the oldest session when one past the window", () => {
    // 6 sessions with distinct speeds: the window must keep the last 5.
    const result = recentAverages(
      progressWith(
        [10, 20, 30, 40, 50, 60].map((ppm) => ({ ppm, accuracy: 0.9 })),
      ),
    );
    expect(result.ppm).toBeCloseTo((20 + 30 + 40 + 50 + 60) / 5);
  });

  it("ignores null accuracies without breaking the average", () => {
    const result = recentAverages(
      progressWith([
        { ppm: 20, accuracy: null },
        { ppm: 30, accuracy: 0.9 },
      ]),
    );
    expect(result.ppm).toBeCloseTo(25);
    expect(result.accuracy).toBeCloseTo(0.9);
  });
});
