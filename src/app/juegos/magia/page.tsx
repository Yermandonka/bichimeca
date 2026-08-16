"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import { gameDifficulty, gameWordPool } from "@/domain/games/wordPool";
import { initialLockOn, pressKey, type LockOnState } from "@/domain/games/lockOn";
import { formatAccuracy } from "@/domain/metrics/format";
import { useProgress } from "@/app/providers";
import { loadRecord, submitScore } from "@/infrastructure/storage/recordStore";

/**
 * Lluvia de Estrellas — full-screen catching game with its own dynamic:
 * stars appear scattered across the enchanted sky and fade out; the fairy
 * flies to every catch. The game world lives in a mutable ref advanced by
 * a single tick (pure React state updaters; see the naves page note about
 * StrictMode double-invocation).
 */

type StarKind = "normal" | "fugaz" | "lunar";

interface Star {
  id: number;
  kind: StarKind;
  word: string;
  x: number;
  y: number;
  bornAt: number;
  lifeMs: number;
  points: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  bornAt: number;
}

interface World {
  stars: Star[];
  sparkles: Sparkle[];
  lock: LockOnState;
  lives: number;
  score: number;
  caught: number;
  streak: number;
  keystrokes: { total: number; correct: number };
  night: number;
  /** Catches needed to finish the current night. */
  nightQuota: number;
  nightCaught: number;
  interludeUntil: number;
  lastSpawn: number;
  fairy: { x: number; y: number };
}

const LIVES = 3;
const TICK_MS = 60;
const STREAK_FOR_LIFE = 5;
const RECORD_KEY = "bichimeca.record.magia";

/** Every normal star of a night shares one look; it changes each night. */
const NIGHT_EMOJIS = ["🌟", "💫", "🔮", "🎇", "🪄", "🌈"];

function nightEmoji(night: number): string {
  return NIGHT_EMOJIS[(night - 1) % NIGHT_EMOJIS.length];
}

function nightQuotaFor(night: number): number {
  return 6 + night * 2;
}

function pickKind(night: number): StarKind {
  const roll = Math.random();
  if (roll < 0.06 + night * 0.01) return "lunar";
  if (roll < 0.2 + night * 0.03) return "fugaz";
  return "normal";
}

/** Word length rises one step per night; shooting stars stay short. */
function pickWord(pool: string[], night: number, kind: StarKind): string {
  const shift = kind === "fugaz" ? -1 : 0;
  const min = Math.max(2, 1 + night + shift);
  const max = min + 2;
  const fit = pool.filter((word) => word.length >= min && word.length <= max);
  const longest = pool.filter((word) => word.length >= min);
  const source = fit.length > 0 ? fit : longest.length > 0 ? longest : pool;
  return source[Math.floor(Math.random() * source.length)];
}

function freshWorld(): World {
  return {
    stars: [],
    sparkles: [],
    lock: initialLockOn,
    lives: LIVES,
    score: 0,
    caught: 0,
    streak: 0,
    keystrokes: { total: 0, correct: 0 },
    night: 1,
    nightQuota: nightQuotaFor(1),
    nightCaught: 0,
    interludeUntil: 0,
    lastSpawn: 0,
    fairy: { x: 50, y: 80 },
  };
}

export default function MagiaPage() {
  const { progress } = useProgress();
  const router = useRouter();
  const worldRef = useRef<World>(freshWorld());
  const idRef = useRef(1);
  const [status, setStatus] = useState<"ready" | "playing" | "paused" | "over">(
    "ready",
  );
  const [, setFrame] = useState(0);
  const [record, setRecord] = useState(0);
  const [newRecord, setNewRecord] = useState(false);
  const pauseStartRef = useRef(0);

  const pool = useMemo(() => gameWordPool(CURRICULUM_ES, progress), [progress]);
  const base = useMemo(() => gameDifficulty(CURRICULUM_ES, progress), [progress]);
  // Stars glow a bit longer than ships fall: catching, not shooting.
  const lifeMs = base.fallMs * 1.15;

  useEffect(() => {
    setRecord(loadRecord(window.localStorage, RECORD_KEY));
  }, []);

  const start = useCallback(() => {
    worldRef.current = freshWorld();
    worldRef.current.interludeUntil = performance.now() + 1600;
    setNewRecord(false);
    setStatus("playing");
  }, []);

  const finish = useCallback(() => {
    const { score } = worldRef.current;
    setStatus("over");
    const { best, isNew } = submitScore(window.localStorage, RECORD_KEY, score);
    setRecord(best);
    setNewRecord(isNew);
  }, []);

  const togglePause = useCallback(() => {
    if (status === "playing") {
      pauseStartRef.current = performance.now();
      setStatus("paused");
    } else if (status === "paused") {
      const pausedFor = performance.now() - pauseStartRef.current;
      const world = worldRef.current;
      world.stars.forEach((star) => {
        star.bornAt += pausedFor;
      });
      world.sparkles.forEach((sparkle) => {
        sparkle.bornAt += pausedFor;
      });
      world.lastSpawn += pausedFor;
      world.interludeUntil += pausedFor;
      setStatus("playing");
    }
  }, [status]);

  // Sky clock: fade stars out, spawn new ones, expire sparkles.
  useEffect(() => {
    if (status !== "playing") return;
    const interval = window.setInterval(() => {
      const now = performance.now();
      const world = worldRef.current;

      world.sparkles = world.sparkles.filter((s) => now - s.bornAt < 800);

      const faded = world.stars.filter((star) => now - star.bornAt >= star.lifeMs);
      if (faded.length > 0) {
        world.stars = world.stars.filter((star) => now - star.bornAt < star.lifeMs);
        world.lives = Math.max(0, world.lives - faded.length);
        world.streak = 0;
        world.sparkles.push(
          ...faded.map((star) => ({
            id: idRef.current++,
            x: star.x,
            y: star.y,
            emoji: "💨",
            bornAt: now,
          })),
        );
        if (faded.some((star) => star.id === world.lock.targetId)) {
          world.lock = initialLockOn;
        }
      }

      // Night flow: enough catches and a clear sky start the next night.
      const inInterlude = now < world.interludeUntil;
      if (
        !inInterlude &&
        world.nightCaught >= world.nightQuota &&
        world.stars.length === 0
      ) {
        world.night += 1;
        world.nightQuota = nightQuotaFor(world.night);
        world.nightCaught = 0;
        world.interludeUntil = now + 2200;
      }

      const hurry = Math.pow(0.92, world.night - 1);
      const canSpawn =
        !inInterlude &&
        world.stars.length < base.maxItems + Math.floor(world.night / 2) &&
        now - world.lastSpawn >= base.spawnMs * hurry &&
        pool.length > 0;
      if (canSpawn) {
        world.lastSpawn = now;
        const kind = pickKind(world.night);
        const life =
          kind === "fugaz" ? 0.55 : kind === "lunar" ? 0.75 : 1;
        const mult = kind === "fugaz" ? 2 : kind === "lunar" ? 4 : 1;
        const word = pickWord(pool, world.night, kind);
        world.stars.push({
          id: idRef.current++,
          kind,
          word,
          x: 8 + Math.random() * 80,
          y: 12 + Math.random() * 50,
          bornAt: now,
          lifeMs: lifeMs * hurry * life,
          points: word.length * 10 * mult,
        });
      }

      if (world.lives === 0) finish();
      setFrame((f) => f + 1);
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [status, lifeMs, base, pool, finish]);

  const handleChar = useCallback((char: string) => {
    const now = performance.now();
    const world = worldRef.current;
    world.keystrokes.total += 1;
    const { state, result } = pressKey(world.lock, world.stars, char);
    world.lock = state;
    if (result.kind === "ignored" || result.kind === "wrong") {
      world.streak = 0;
      return;
    }
    world.keystrokes.correct += 1;

    if (result.kind === "completed") {
      const star = world.stars.find((entry) => entry.id === result.targetId);
      if (!star) return;
      world.streak += 1;
      world.caught += 1;
      world.nightCaught += 1;
      world.score += star.points + world.streak * 5;
      world.stars = world.stars.filter((entry) => entry.id !== star.id);
      world.fairy = { x: star.x, y: star.y };
      world.sparkles.push(
        { id: idRef.current++, x: star.x, y: star.y, emoji: "✨", bornAt: now },
        { id: idRef.current++, x: star.x - 4, y: star.y - 4, emoji: "💖", bornAt: now },
      );
      if (star.kind === "lunar") {
        world.lives = Math.min(LIVES, world.lives + 1);
        world.sparkles.push({
          id: idRef.current++,
          x: star.x + 5,
          y: star.y - 5,
          emoji: "🌙",
          bornAt: now,
        });
      }
      if (world.streak >= STREAK_FOR_LIFE) {
        world.streak = 0;
        world.lives = Math.min(LIVES, world.lives + 1);
        world.sparkles.push({
          id: idRef.current++,
          x: star.x + 4,
          y: star.y - 6,
          emoji: "💗",
          bornAt: now,
        });
      }
    }
  }, []);

  // Global keyboard: type instantly (no clicking), Escape toggles pause.
  useEffect(() => {
    if (status !== "playing" && status !== "paused") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        togglePause();
        return;
      }
      if (
        status === "playing" &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        handleChar(event.key.toLowerCase());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [status, handleChar, togglePause]);

  if (progress === null) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-ink-400">
        Cargando…
      </main>
    );
  }

  const world = worldRef.current;
  const now = performance.now();
  const accuracy =
    world.keystrokes.total > 0
      ? world.keystrokes.correct / world.keystrokes.total
      : null;

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#241332] bg-[radial-gradient(ellipse_55%_45%_at_25%_10%,rgba(255,105,180,0.35),transparent),radial-gradient(ellipse_50%_40%_at_78%_30%,rgba(255,210,63,0.25),transparent),radial-gradient(ellipse_70%_45%_at_50%_105%,rgba(46,230,168,0.22),transparent),radial-gradient(1.5px_1.5px_at_18%_40%,#fff_99%,transparent),radial-gradient(1px_1px_at_36%_70%,#fff_99%,transparent),radial-gradient(2px_2px_at_55%_18%,#ffd23f_99%,transparent),radial-gradient(1px_1px_at_70%_55%,#fff_99%,transparent),radial-gradient(1.5px_1.5px_at_88%_75%,#fff_99%,transparent)]">
      <p
        aria-hidden="true"
        className="pointer-events-none absolute left-[6%] top-[10%] text-6xl opacity-50"
      >
        🌙
      </p>
      <p
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[4%] left-[12%] text-4xl opacity-60"
      >
        🌷
      </p>
      <p
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[6%] right-[10%] text-4xl opacity-60"
      >
        🌼
      </p>

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-3 text-sm font-bold">
        <div className="flex items-center gap-4">
          <span className="text-lg">{world.score} pts</span>
          <span aria-label={`${world.lives} vidas`}>
            {Array.from({ length: LIVES }, (_, i) =>
              i < world.lives ? "🌸" : "🥀",
            ).join(" ")}
          </span>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
            Noche {world.night}
          </span>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
            Racha ✨ {world.streak}/{STREAK_FOR_LIFE}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sol-400">🏆 Récord: {record}</span>
          {(status === "playing" || status === "paused") && (
            <button
              type="button"
              onClick={togglePause}
              className="rounded-full border-2 border-brand-100 bg-noche-900 px-5 py-2.5 text-base font-bold hover:border-brand-500"
            >
              {status === "paused" ? "▶ Reanudar" : "⏸ Pausa"}
            </button>
          )}
        </div>
      </div>

      {status === "playing" && now < world.interludeUntil && (
        <p
          key={world.night}
          className="anim-pop-in absolute inset-x-0 top-1/3 z-20 text-center text-5xl font-black text-sol-400"
        >
          🌙 ¡Noche {world.night}!
        </p>
      )}

      {(status === "playing" || status === "paused") && (
        <div
          role="application"
          aria-label="Juego Lluvia de Estrellas. Escribe las palabras de las estrellas; el teclado ya está activo."
          className="absolute inset-0"
        >
          {world.stars.map((star) => {
            const age = Math.min(1, (now - star.bornAt) / star.lifeMs);
            const isTarget = star.id === world.lock.targetId;
            const emoji =
              star.kind === "fugaz"
                ? "🌠"
                : star.kind === "lunar"
                  ? "🌙"
                  : age > 0.66
                    ? "⭐"
                    : nightEmoji(world.night);
            return (
              <div
                key={star.id}
                className="absolute -translate-x-1/2 text-center"
                style={{
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  opacity: 1 - age * 0.75,
                }}
              >
                <p className={`text-3xl ${isTarget ? "anim-twinkle" : ""}`}>
                  {emoji}
                </p>
                <p
                  className={`mt-0.5 rounded-lg px-2 py-0.5 font-mono text-lg font-bold ${
                    isTarget
                      ? "bg-sol-400 text-noche-950"
                      : "bg-noche-950/75 text-ink-900"
                  }`}
                >
                  {isTarget ? (
                    <>
                      <span className="text-noche-950/50 line-through">
                        {world.lock.typed}
                      </span>
                      <span>{star.word.slice(world.lock.typed.length)}</span>
                    </>
                  ) : (
                    star.word
                  )}
                </p>
              </div>
            );
          })}

          {world.sparkles.map((sparkle) => (
            <p
              key={sparkle.id}
              className="anim-sparkle pointer-events-none absolute -translate-x-1/2 text-3xl"
              style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
            >
              {sparkle.emoji}
            </p>
          ))}

          <p
            aria-hidden="true"
            className="motion-safe-transition absolute -translate-x-1/2 text-4xl transition-all duration-500 ease-out"
            style={{ left: `${world.fairy.x}%`, top: `${world.fairy.y}%` }}
          >
            🧚
          </p>
        </div>
      )}

      {status === "paused" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-noche-950/80 backdrop-blur-sm">
          <div className="anim-pop-in w-72 rounded-3xl border-2 border-brand-100 bg-noche-900 p-6 text-center shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
            <p className="text-xl font-black">Pausa</p>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={togglePause}
                className="rounded-2xl bg-brand-500 px-6 py-3 font-bold text-noche-950 shadow-[4px_4px_0_#7a2413] transition hover:bg-brand-600"
              >
                Reanudar
              </button>
              <button
                type="button"
                onClick={start}
                className="rounded-2xl border-2 border-brand-100 px-6 py-3 font-bold text-ink-900 transition hover:border-brand-500"
              >
                Reiniciar
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-2xl border-2 border-brand-100 px-6 py-3 font-bold text-ink-600 transition hover:border-brand-500"
              >
                Salir al inicio
              </button>
            </div>
          </div>
        </div>
      )}

      {(status === "ready" || status === "over") && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-noche-950/70">
          <section className="anim-pop-in mx-6 max-w-xl rounded-3xl border-2 border-brand-100 bg-noche-900 p-8 text-center shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
            <div className="mb-3 flex items-center justify-between text-sm">
              <Link href="/" className="font-medium text-brand-600 hover:underline">
                ← Inicio
              </Link>
              <span className="text-sol-400">🏆 Récord: {record}</span>
            </div>
            {status === "over" ? (
              <>
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                  El cielo se apaga
                </p>
                {newRecord && (
                  <p className="anim-pop-in mt-2 text-lg font-black text-sol-400">
                    🎉 ¡Nuevo récord personal!
                  </p>
                )}
                <p className="mt-3 text-5xl font-black">{world.score}</p>
                <p className="text-ink-600">puntos de magia</p>
                <dl className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-brand-50 p-3">
                    <dt className="text-xs text-ink-600">Atrapadas</dt>
                    <dd className="text-xl font-bold">{world.caught}</dd>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-3">
                    <dt className="text-xs text-ink-600">Noche</dt>
                    <dd className="text-xl font-bold">{world.night}</dd>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-3">
                    <dt className="text-xs text-ink-600">Precisión</dt>
                    <dd className="text-xl font-bold">{formatAccuracy(accuracy)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-black">🧚 Lluvia de Estrellas</h1>
                <p className="mx-auto mt-3 max-w-md text-ink-600">
                  Las estrellas aparecen en el cielo encantado y se apagan poco
                  a poco. Cada noche cambia la constelación, acelera el cielo y
                  alarga las palabras; las fugaces 🌠 valen doble y la lunar 🌙
                  regala una vida. Cinco seguidas sin fallar también curan. Esc
                  para pausar. Dificultad: Mundo {base.world}.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={start}
              className="mt-7 rounded-2xl bg-brand-500 px-10 py-4 text-lg font-bold text-noche-950 shadow-[5px_5px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[3px_3px_0_#7a2413]"
            >
              {status === "over" ? "Encantar de nuevo" : "Abrir el cielo"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
