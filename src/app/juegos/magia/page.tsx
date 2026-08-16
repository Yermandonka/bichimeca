"use client";

import { WordRainGame, type GameTheme } from "../WordRainGame";

const MAGIA: GameTheme = {
  slug: "magia",
  title: "Lluvia de Estrellas",
  verb: "Atrapadas",
  itemEmoji: "🌟",
  playerEmoji: "🧚",
  fieldClasses:
    "bg-[radial-gradient(circle_at_25%_15%,rgba(255,105,180,0.28),transparent_45%),radial-gradient(circle_at_75%_35%,rgba(255,210,63,0.22),transparent_40%)] bg-[#241332]",
  activeChipClasses: "bg-sol-400 text-noche-950",
  intro:
    "Las estrellas fugaces caen sobre el jardín encantado. Escribe la palabra de cada estrella para atraparla con tu varita antes de que se apague. ¡Magia y brillo, hada!",
  missLabel: "Apagadas",
};

export default function MagiaPage() {
  return <WordRainGame theme={MAGIA} />;
}
