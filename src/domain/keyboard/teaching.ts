import {
  FINGER_LABELS,
  KEYBOARD_ROWS,
  keyForChar,
  type Finger,
} from "./layout";

/**
 * Human teaching guidance per key: which finger, which hand, and how the
 * finger travels from its home-row position. This powers the lesson
 * presentation screens so every new key is genuinely taught, not just shown.
 */

const HOME_KEY_BY_FINGER: Record<Finger, string> = {
  "menique-izq": "a",
  "anular-izq": "s",
  "corazon-izq": "d",
  "indice-izq": "f",
  "indice-der": "j",
  "corazon-der": "k",
  "anular-der": "l",
  "menique-der": "ñ",
  pulgar: " ",
};

export interface KeyGuidance {
  char: string;
  fingerLabel: string;
  hand: "izquierda" | "derecha" | "las dos";
  /** Home-row key where the responsible finger rests. */
  homeKey: string;
  /** Movement instruction in natural Spanish. */
  movement: string;
}

function rowOf(char: string): number | null {
  for (let row = 0; row < KEYBOARD_ROWS.length; row += 1) {
    if (KEYBOARD_ROWS[row].some((key) => key.char === char)) return row;
  }
  return null;
}

export function keyGuidance(char: string): KeyGuidance | null {
  if (char === "⇧") {
    return {
      char: "⇧",
      fingerLabel: "Meñiques",
      hand: "las dos",
      homeKey: "a",
      movement:
        "Mantén Shift con el meñique de la mano CONTRARIA a la letra: para escribir una mayúscula de la mano izquierda, Shift derecho, y al revés. Suéltala en cuanto escribas la letra.",
    };
  }
  const key = keyForChar(char);
  if (!key) return null;

  const homeKey = HOME_KEY_BY_FINGER[key.finger];
  const hand: KeyGuidance["hand"] =
    key.finger === "pulgar"
      ? "las dos"
      : key.finger.endsWith("-izq")
        ? "izquierda"
        : "derecha";
  const homeName = homeKey.toUpperCase();

  let movement: string;
  if (key.finger === "pulgar") {
    movement =
      "Golpéala con el pulgar que te resulte más cómodo, sin mover el resto de la mano.";
  } else {
    const row = rowOf(key.char);
    if (row === 1) {
      movement =
        key.char === homeKey
          ? "Vive en la fila guía: tu dedo ya descansa encima. Púlsala sin desplazar la mano."
          : `Estira el dedo hacia el centro desde la ${homeName}, sin girar la muñeca, y vuelve a la fila guía.`;
    } else if (row === 0) {
      movement = `Sube el dedo en diagonal desde la ${homeName}, púlsala y vuelve enseguida a la fila guía.`;
    } else {
      movement = `Baja el dedo en diagonal desde la ${homeName}, púlsala y vuelve enseguida a la fila guía.`;
    }
  }

  return {
    char: key.char,
    fingerLabel: FINGER_LABELS[key.finger],
    hand,
    homeKey,
    movement,
  };
}
