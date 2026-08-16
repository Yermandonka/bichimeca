import { describe, it, expect } from "vitest";
import { keyGuidance } from "./teaching";
import { CURRICULUM_ES } from "@/data/curriculum/es";

describe("keyGuidance", () => {
  it("describes a home-row anchor as resting under the finger", () => {
    const guidance = keyGuidance("f")!;
    expect(guidance.fingerLabel).toBe("Índice izquierdo");
    expect(guidance.hand).toBe("izquierda");
    expect(guidance.movement).toMatch(/fila guía/i);
  });

  it("describes a top-row key as a diagonal reach up from its home key", () => {
    const guidance = keyGuidance("e")!;
    expect(guidance.fingerLabel).toBe("Corazón izquierdo");
    expect(guidance.homeKey).toBe("d");
    expect(guidance.movement).toMatch(/sube/i);
    expect(guidance.movement).toMatch(/D/);
  });

  it("describes a bottom-row key as a reach down from its home key", () => {
    const guidance = keyGuidance("n")!;
    expect(guidance.fingerLabel).toBe("Índice derecho");
    expect(guidance.hand).toBe("derecha");
    expect(guidance.homeKey).toBe("j");
    expect(guidance.movement).toMatch(/baja/i);
  });

  it("describes the home-row stretch keys G and H", () => {
    expect(keyGuidance("g")!.movement).toMatch(/estira/i);
    expect(keyGuidance("h")!.movement).toMatch(/estira/i);
  });

  it("describes the space bar as a thumb key", () => {
    const guidance = keyGuidance(" ")!;
    expect(guidance.fingerLabel).toBe("Pulgar");
    expect(guidance.movement).toMatch(/pulgar/i);
  });

  it("returns null for unknown characters", () => {
    expect(keyGuidance("€")).toBeNull();
  });

  it("teaches Shift with the opposite-hand pinky rule", () => {
    const guidance = keyGuidance("⇧")!;
    expect(guidance.hand).toBe("las dos");
    expect(guidance.fingerLabel).toMatch(/meñiques/i);
    expect(guidance.movement).toMatch(/contraria/i);
  });

  it("covers every key the curriculum introduces (except modifiers)", () => {
    for (const lesson of CURRICULUM_ES) {
      for (const key of lesson.introducedKeys) {
        if (key === "⇧") continue;
        expect(keyGuidance(key), `sin guía para ${key} en ${lesson.id}`).not.toBeNull();
      }
    }
  });
});
