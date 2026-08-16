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

/**
 * The Shift modifier as a teachable "key". There are two physical Shift
 * keys; technique dictates using the pinky OPPOSITE to the letter's hand,
 * which the visual keyboard resolves per character.
 */
export const SHIFT_KEY: KeyboardKey = key("⇧", "menique-izq");

/** Characters produced with Shift plus a base key on ISO-ES. */
export const SHIFTED_CHARS: Record<string, string> = {
  ";": ",",
  ":": ".",
  _: "-",
};

const KEY_INDEX: Map<string, KeyboardKey> = new Map(
  [...KEYBOARD_ROWS.flat(), SPACE_KEY, SHIFT_KEY].map((entry) => [
    entry.char,
    entry,
  ]),
);

/**
 * Key producing the given character: case-insensitive, and shifted
 * punctuation resolves to its base key. Null when not on the base layout.
 */
export function keyForChar(char: string): KeyboardKey | null {
  const base = SHIFTED_CHARS[char] ?? char.toLowerCase();
  return KEY_INDEX.get(base) ?? null;
}

/** Whether typing this character requires holding Shift on ISO-ES. */
export function requiresShift(char: string): boolean {
  return char in SHIFTED_CHARS || char !== char.toLowerCase();
}
