"use client";

import { WordRainGame, type GameTheme } from "../WordRainGame";

const NAVES: GameTheme = {
  slug: "naves",
  title: "Invasión Tecleante",
  verb: "Derribadas",
  itemEmoji: "🛸",
  playerEmoji: "🚀",
  fieldClasses:
    "bg-[radial-gradient(circle_at_20%_10%,rgba(120,80,255,0.25),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,93,59,0.2),transparent_40%)] bg-noche-950",
  activeChipClasses: "bg-brand-500 text-noche-950",
  intro:
    "Una flota de naves se acerca a tu cohete. Escribe la palabra de cada nave para derribarla antes de que aterrice. ¡Puntería y precisión, piloto!",
  missLabel: "Aterrizadas",
};

export default function NavesPage() {
  return <WordRainGame theme={NAVES} />;
}
