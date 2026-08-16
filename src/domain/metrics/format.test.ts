import { describe, it, expect } from "vitest";
import { formatAccuracy, formatDuration, formatPpm } from "./format";

describe("formatAccuracy", () => {
  it("shows one decimal and a percent sign", () => {
    expect(formatAccuracy(0.914)).toBe("91.4 %");
    expect(formatAccuracy(0.96875)).toBe("96.9 %");
    expect(formatAccuracy(0.991)).toBe("99.1 %");
  });

  it("shows a clean 100 % without decimals", () => {
    expect(formatAccuracy(1)).toBe("100 %");
  });

  it("shows an em dash when there is no data", () => {
    expect(formatAccuracy(null)).toBe("—");
  });
});

describe("formatPpm", () => {
  it("rounds to the nearest whole number for display", () => {
    expect(formatPpm(38.4)).toBe("38");
    expect(formatPpm(38.5)).toBe("39");
    expect(formatPpm(0)).toBe("0");
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds in Spanish style", () => {
    expect(formatDuration(134_000)).toBe("2 min 14 s");
    expect(formatDuration(60_000)).toBe("1 min 0 s");
  });

  it("formats sub-minute durations as seconds only", () => {
    expect(formatDuration(45_000)).toBe("45 s");
    expect(formatDuration(999)).toBe("0 s");
  });

  it("never shows negative durations", () => {
    expect(formatDuration(-5_000)).toBe("0 s");
  });
});
