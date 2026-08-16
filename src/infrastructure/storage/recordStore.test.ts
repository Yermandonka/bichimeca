import { describe, it, expect } from "vitest";
import { loadRecord, submitScore } from "./recordStore";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    dump: () => data,
  };
}

const KEY = "bichimeca.record.test";

describe("loadRecord", () => {
  it("returns 0 when nothing is stored", () => {
    expect(loadRecord(fakeStorage(), KEY)).toBe(0);
  });

  it("returns the stored numeric record", () => {
    expect(loadRecord(fakeStorage({ [KEY]: "120" }), KEY)).toBe(120);
  });

  it("treats corrupt values as no record without clearing them", () => {
    const storage = fakeStorage({ [KEY]: "no-numérico" });
    expect(loadRecord(storage, KEY)).toBe(0);
    expect(storage.dump().get(KEY)).toBe("no-numérico");
  });
});

describe("submitScore", () => {
  it("persists and flags a score that beats the record", () => {
    const storage = fakeStorage({ [KEY]: "100" });
    expect(submitScore(storage, KEY, 150)).toEqual({ best: 150, isNew: true });
    expect(storage.dump().get(KEY)).toBe("150");
  });

  it("keeps the record when the score does not beat it", () => {
    const storage = fakeStorage({ [KEY]: "100" });
    expect(submitScore(storage, KEY, 80)).toEqual({ best: 100, isNew: false });
    expect(submitScore(storage, KEY, 100)).toEqual({ best: 100, isNew: false });
    expect(storage.dump().get(KEY)).toBe("100");
  });

  it("sets a first record from an empty store", () => {
    const storage = fakeStorage();
    expect(submitScore(storage, KEY, 40)).toEqual({ best: 40, isNew: true });
    expect(storage.dump().get(KEY)).toBe("40");
  });
});
