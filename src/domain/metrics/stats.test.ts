import { describe, it, expect } from "vitest";
import { median } from "./stats";

describe("median", () => {
  it("returns the middle value for an odd number of items", () => {
    expect(median([300, 100, 200])).toBe(200);
  });

  it("averages the two middle values for an even number of items", () => {
    expect(median([400, 100, 300, 200])).toBe(250);
  });

  it("does not mutate the input array", () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });

  it("throws on an empty list instead of returning NaN", () => {
    expect(() => median([])).toThrow(/al menos un valor/);
  });
});
