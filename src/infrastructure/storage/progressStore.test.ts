import { describe, it, expect } from "vitest";
import { createLocalProgressStore, PROGRESS_STORAGE_KEY } from "./progressStore";
import { createEmptyProgress } from "@/domain/progress/progress";

const NOW = "2026-08-16T12:00:00.000Z";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    dump: () => data,
  };
}

describe("createLocalProgressStore", () => {
  it("round-trips progress through save and load", () => {
    const storage = fakeStorage();
    const store = createLocalProgressStore(storage);
    const progress = createEmptyProgress(NOW);
    store.save(progress);
    expect(store.load()).toEqual(progress);
  });

  it("returns null when nothing is stored", () => {
    const store = createLocalProgressStore(fakeStorage());
    expect(store.load()).toBeNull();
  });

  it("returns null on corrupt JSON without destroying the stored value", () => {
    const storage = fakeStorage({ [PROGRESS_STORAGE_KEY]: "{corrupto" });
    const store = createLocalProgressStore(storage);
    expect(store.load()).toBeNull();
    expect(storage.dump().get(PROGRESS_STORAGE_KEY)).toBe("{corrupto");
  });

  it("returns null on invalid structures without destroying the stored value", () => {
    const raw = JSON.stringify({ schemaVersion: 1, sorpresa: true });
    const storage = fakeStorage({ [PROGRESS_STORAGE_KEY]: raw });
    const store = createLocalProgressStore(storage);
    expect(store.load()).toBeNull();
    expect(storage.dump().get(PROGRESS_STORAGE_KEY)).toBe(raw);
  });

  it("refuses future schema versions without destroying the stored value", () => {
    const progress = createEmptyProgress(NOW);
    const raw = JSON.stringify({ ...progress, schemaVersion: 999 });
    const storage = fakeStorage({ [PROGRESS_STORAGE_KEY]: raw });
    const store = createLocalProgressStore(storage);
    expect(store.load()).toBeNull();
    expect(storage.dump().get(PROGRESS_STORAGE_KEY)).toBe(raw);
  });
});
