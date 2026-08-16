import { describe, it, expect } from "vitest";
import { initialLockOn, pressKey } from "./lockOn";

const items = [
  { id: 1, word: "sol" },
  { id: 2, word: "sal" },
  { id: 3, word: "mar" },
];

describe("pressKey", () => {
  it("locks onto the first item whose word starts with the key", () => {
    const { state, result } = pressKey(initialLockOn, items, "s");
    expect(result.kind).toBe("locked");
    expect(state.targetId).toBe(1);
    expect(state.typed).toBe("s");
  });

  it("ignores keys that match no item", () => {
    const { state, result } = pressKey(initialLockOn, items, "z");
    expect(result.kind).toBe("ignored");
    expect(state.targetId).toBeNull();
  });

  it("advances within the locked word and reports progress", () => {
    let state = pressKey(initialLockOn, items, "m").state;
    const step = pressKey(state, items, "a");
    expect(step.result.kind).toBe("progress");
    expect(step.state.typed).toBe("ma");
  });

  it("reports wrong keys without advancing or unlocking", () => {
    const locked = pressKey(initialLockOn, items, "m").state;
    const { state, result } = pressKey(locked, items, "x");
    expect(result.kind).toBe("wrong");
    expect(state.typed).toBe("m");
    expect(state.targetId).toBe(3);
  });

  it("completes a word and resets the lock", () => {
    let state = pressKey(initialLockOn, items, "m").state;
    state = pressKey(state, items, "a").state;
    const { state: done, result } = pressKey(state, items, "r");
    expect(result).toEqual({ kind: "completed", targetId: 3 });
    expect(done.targetId).toBeNull();
    expect(done.typed).toBe("");
  });

  it("completes single-letter words immediately on lock", () => {
    const { result } = pressKey(initialLockOn, [{ id: 9, word: "y" }], "y");
    expect(result).toEqual({ kind: "completed", targetId: 9 });
  });

  it("relocks when the previous target no longer exists (expired)", () => {
    const locked = pressKey(initialLockOn, items, "s").state;
    const remaining = [{ id: 3, word: "mar" }];
    const { state, result } = pressKey(locked, remaining, "m");
    expect(result.kind).toBe("locked");
    expect(state.targetId).toBe(3);
    expect(state.typed).toBe("m");
  });
});
