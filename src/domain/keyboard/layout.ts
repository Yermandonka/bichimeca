/**
 * Simplified ISO-ES keyboard model for the visual keyboard: the three
 * letter rows plus the space bar, each key with its touch-typing finger.
 * Symbol/number rows join the model when the curriculum reaches them.
 */

export type Finger =
  | "menique-izq"
  | "anular-izq"
  | "corazon-izq"
  | "indice-izq"
  | "indice-der"
  | "corazon-der"
  | "anular-der"
  | "menique-der"
  | "pulgar";

export const FINGER_LABELS: Record<Finger, string> = {
  "menique-izq": "Meñique izquierdo",
  "anular-izq": "Anular izquierdo",
  "corazon-izq": "Corazón izquierdo",
  "indice-izq": "Índice izquierdo",
  "indice-der": "Índice derecho",
  "corazon-der": "Corazón derecho",
  "anular-der": "Anular derecho",
  "menique-der": "Meñique derecho",
  pulgar: "Pulgar",
};

export interface KeyboardKey {
  /** Base (lowercase) character produced by the key. */
  char: string;
  finger: Finger;
  /** Home-row anchor keys carry a tactile bump (F and J). */
  isAnchor?: boolean;
}

const key = (char: string, finger: Finger, isAnchor?: boolean): KeyboardKey => ({
  char,
  finger,
  ...(isAnchor ? { isAnchor } : {}),
});

/** Letter rows top to bottom; the space bar is rendered separately. */
export const KEYBOARD_ROWS: KeyboardKey[][] = [
  [
    key("q", "menique-izq"),
    key("w", "anular-izq"),
    key("e", "corazon-izq"),
    key("r", "indice-izq"),
    key("t", "indice-izq"),
    key("y", "indice-der"),
    key("u", "indice-der"),
    key("i", "corazon-der"),
    key("o", "anular-der"),
    key("p", "menique-der"),
  ],
  [
    key("a", "menique-izq"),
    key("s", "anular-izq"),
    key("d", "corazon-izq"),
    key("f", "indice-izq", true),
    key("g", "indice-izq"),
    key("h", "indice-der"),
    key("j", "indice-der", true),
    key("k", "corazon-der"),
    key("l", "anular-der"),
    key("ñ", "menique-der"),
  ],
  [
    key("z", "menique-izq"),
    key("x", "anular-izq"),
    key("c", "corazon-izq"),
    key("v", "indice-izq"),
    key("b", "indice-izq"),
    key("n", "indice-der"),
    key("m", "indice-der"),
    key(",", "corazon-der"),
    key(".", "anular-der"),
    key("-", "menique-der"),
  ],
];

export const SPACE_KEY: KeyboardKey = key(" ", "pulgar");

const KEY_INDEX: Map<string, KeyboardKey> = new Map(
  [...KEYBOARD_ROWS.flat(), SPACE_KEY].map((entry) => [entry.char, entry]),
);

/** Key producing the given character (case-insensitive), or null. */
export function keyForChar(char: string): KeyboardKey | null {
  return KEY_INDEX.get(char.toLowerCase()) ?? null;
}
