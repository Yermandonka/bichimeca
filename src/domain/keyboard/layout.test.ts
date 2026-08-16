import { describe, it, expect } from "vitest";
import { KEYBOARD_ROWS, FINGER_LABELS, keyForChar } from "./layout";
import { CURRICULUM_ES } from "@/data/curriculum/es";

describe("KEYBOARD_ROWS (ISO-ES)", () => {
  it("contains the Spanish home row including ñ", () => {
    const homeRow = KEYBOARD_ROWS[1].map((key) => key.char);
    expect(homeRow).toEqual(["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"]);
  });

  it("assigns a labelled finger to every key", () => {
    for (const row of KEYBOARD_ROWS) {
      for (const key of row) {
        expect(FINGER_LABELS[key.finger], key.char).toBeTruthy();
      }
    }
  });

  it("marks exactly F and J as anchor keys", () => {
    const anchors = KEYBOARD_ROWS.flat()
      .filter((key) => key.isAnchor)
      .map((key) => key.char);
    expect(anchors.sort()).toEqual(["f", "j"]);
  });

  it("has no duplicate characters", () => {
    const chars = KEYBOARD_ROWS.flat().map((key) => key.char);
    expect(new Set(chars).size).toBe(chars.length);
  });
});

describe("keyForChar", () => {
  it("finds keys regardless of case", () => {
    expect(keyForChar("F")?.char).toBe("f");
    expect(keyForChar("ñ")?.char).toBe("ñ");
  });

  it("maps the space character to the space bar", () => {
    expect(keyForChar(" ")?.char).toBe(" ");
  });

  it("returns null for characters not on the base layout", () => {
    expect(keyForChar("€")).toBeNull();
  });
});

describe("curriculum coverage", () => {
  it("every key introduced by the curriculum exists on the keyboard", () => {
    for (const lesson of CURRICULUM_ES) {
      for (const char of lesson.introducedKeys) {
        expect(keyForChar(char), `tecla ${char} de ${lesson.id}`).not.toBeNull();
      }
    }
  });

  it("every exercise character can be highlighted on the keyboard", () => {
    for (const lesson of CURRICULUM_ES) {
      for (const exercise of lesson.exercises) {
        for (const char of exercise.text) {
          expect(keyForChar(char), `carácter "${char}" en ${lesson.id}`).not.toBeNull();
        }
      }
    }
  });
});
