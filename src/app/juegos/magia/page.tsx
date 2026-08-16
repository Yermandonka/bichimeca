"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import { gameDifficulty, gameWordPool } from "@/domain/games/wordPool";
import { initialLockOn, pressKey, type LockOnState } from "@/domain/games/lockOn";
import { formatAccuracy } from "@/domain/metrics/format";
import { useProgress } from "@/app/providers";

interface Star {
  id: number;
  word: string;
  x: number;
  y: number;
  bornAt: number;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  bornAt: number;
}

const LIVES = 3;
const TICK_MS = 90;
const STREAK_FOR_LIFE = 5;

/**
 * Lluvia de Estrellas: stars appear scattered across the enchanted sky and
 * slowly fade out. Typing a star's word sends the fairy flying to catch it
 * in a burst of sparkles. Five catches in a row weave a "racha mágica"
 * that restores one lost life.
 */
export default function MagiaPage() {
  const { progress } = useProgress();
  const [stars, setStars] = useState<Star[]>([]);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [lock, setLock] = useState<LockOnState>(initialLockOn);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [caught, setCaught] = useState(0);
  const [streak, setStreak] = useState(0);
  const [keystrokes, setKeystrokes] = useState({ total: 0, correct: 0 });
  const [status, setStatus] = useState<"ready" | "playing" | "over">("ready");
  const [now, setNow] = useState(0);
  const [fairy, setFairy] = useState({ x: 50, y: 82 });
  const nextIdRef = useRef(1);
  const lastSpawnRef = useRef(0);
  const fieldRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(() => gameWordPool(CURRICULUM_ES, progress), [progress]);
  const base = useMemo(() => gameDifficulty(CURRICULUM_ES, progress), [progress]);
  // Stars glow a bit longer than ships fall: catching, not shooting.
  const lifeMs = base.fallMs * 1.15;

  const start = useCallback(() => {
    setStars([]);
    setSparkles([]);
    setLock(initialLockOn);
    setLives(LIVES);
    setScore(0);
    setCaught(0);
    setStreak(0);
    setKeystrokes({ total: 0, correct: 0 });
    setFairy({ x: 50, y: 82 });
    lastSpawnRef.current = 0;
    setStatus("playing");
    fieldRef.current?.focus();
  }, []);

  // Sky clock: fade stars out, spawn new ones, expire sparkles.
  useEffect(() => {
    if (status !== "playing") return;
    const interval = window.setInterval(() => {
      const time = performance.now();
      setNow(time);
      setSparkles((current) => current.filter((s) => time - s.bornAt < 800));
      setStars((current) => {
        let next = current;
        const faded = next.filter((star) => time - star.bornAt >= lifeMs);
        if (faded.length > 0) {
          next = next.filter((star) => time - star.bornAt < lifeMs);
          setLives((value) => Math.max(0, value - faded.length));
          setStreak(0);
          setSparkles((s) => [
            ...s,
            ...faded.map((star) => ({
              id: nextIdRef.current++,
              x: star.x,
              y: star.y,
              emoji: "💨",
              bornAt: time,
            })),
          ]);
          setLock((state) =>
            faded.some((star) => star.id === state.targetId) ? initialLockOn : state,
          );
        }
        const canSpawn =
          next.length < base.maxItems &&
          time - lastSpawnRef.current >= base.spawnMs &&
          pool.length > 0;
        if (canSpawn) {
          lastSpawnRef.current = time;
          next = [
            ...next,
            {
              id: nextIdRef.current++,
              word: pool[Math.floor(Math.random() * pool.length)],
              x: 10 + Math.random() * 78,
              y: 10 + Math.random() * 52,
              bornAt: time,
            },
          ];
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [status, lifeMs, base.spawnMs, base.maxItems, pool]);

  useEffect(() => {
    if (status === "playing" && lives === 0) setStatus("over");
  }, [lives, status]);

  const handleChar = useCallback(
    (char: string) => {
      const time = performance.now();
      setKeystrokes((k) => ({ ...k, total: k.total + 1 }));
      const { state, result } = pressKey(lock, stars, char);
      setLock(state);
      if (result.kind === "ignored" || result.kind === "wrong") {
        setStreak(0);
        return;
      }
      setKeystrokes((k) => ({ ...k, correct: k.correct + 1 }));

      if (result.kind === "completed") {
        const star = stars.find((entry) => entry.id === result.targetId);
        if (!star) return;
        const nextStreak = streak + 1;
        setStreak(nextStreak % STREAK_FOR_LIFE);
        setCaught((value) => value + 1);
        setScore((value) => value + star.word.length * 10 + nextStreak * 5);
        setStars((current) => current.filter((entry) => entry.id !== star.id));
        setFairy({ x: star.x, y: star.y });
        const burst: Sparkle[] = [
          { id: nextIdRef.current++, x: star.x, y: star.y, emoji: "✨", bornAt: time },
          { id: nextIdRef.current++, x: star.x - 4, y: star.y - 4, emoji: "💖", bornAt: time },
        ];
        if (nextStreak === STREAK_FOR_LIFE) {
          setLives((value) => Math.min(LIVES, value + 1));
          burst.push({
            id: nextIdRef.current++,
            x: star.x + 4,
            y: star.y - 6,
            emoji: "💗",
            bornAt: time,
          });
        }
        setSparkles((current) => [...current, ...burst]);
      }
    },
    [lock, stars, streak],
  );

  if (progress === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-ink-400">
        Cargando…
      </main>
    );
  }

  const accuracy = keystrokes.total > 0 ? keystrokes.correct / keystrokes.total : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
            ← Inicio
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">🧚 Lluvia de Estrellas</h1>
        </div>
        <p className="text-sm text-ink-600">
          Dificultad: <span className="font-bold text-brand-700">Mundo {base.world}</span>
        </p>
      </header>

      {status !== "playing" ? (
        <section className="rounded-3xl border-2 border-brand-100 bg-noche-900 p-8 text-center shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
          {status === "over" ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                El cielo se apaga
              </p>
              <p className="mt-4 text-5xl font-black">{score}</p>
              <p className="text-ink-600">puntos de magia</p>
              <dl className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">Atrapadas</dt>
                  <dd className="text-xl font-bold">{caught}</dd>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">Racha mágica</dt>
                  <dd className="text-xl font-bold">
                    {streak}/{STREAK_FOR_LIFE}
                  </dd>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">Precisión</dt>
                  <dd className="text-xl font-bold">{formatAccuracy(accuracy)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="anim-twinkle text-6xl">🌟</p>
              <p className="mx-auto mt-4 max-w-md text-lg text-ink-600">
                Las estrellas aparecen en el cielo encantado y se apagan poco a
                poco. Escribe su palabra para que el hada vuele a atraparlas.
                Cinco seguidas sin fallar tejen una racha mágica que devuelve
                una vida. ✨
              </p>
            </>
          )}
          <button
            type="button"
            onClick={start}
            className="mt-8 rounded-2xl bg-brand-500 px-10 py-4 text-lg font-bold text-noche-950 shadow-[5px_5px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[3px_3px_0_#7a2413]"
          >
            {status === "over" ? "Encantar de nuevo" : "Abrir el cielo"}
          </button>
        </section>
      ) : (
        <div
          ref={fieldRef}
          tabIndex={0}
          role="application"
          aria-label="Juego Lluvia de Estrellas. Escribe las palabras de las estrellas."
          onKeyDown={(event) => {
            if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
              event.preventDefault();
              handleChar(event.key.toLowerCase());
            }
          }}
          className="relative h-[28rem] cursor-default overflow-hidden rounded-3xl border-2 border-brand-100 bg-[#241332] bg-[radial-gradient(circle_at_25%_15%,rgba(255,105,180,0.3),transparent_45%),radial-gradient(circle_at_75%_35%,rgba(255,210,63,0.22),transparent_40%),radial-gradient(circle_at_50%_95%,rgba(46,230,168,0.18),transparent_35%)] outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <div className="absolute left-4 top-3 z-10 flex items-center gap-4 text-sm font-bold">
            <span>{score} pts</span>
            <span aria-label={`${lives} vidas`}>
              {Array.from({ length: LIVES }, (_, i) => (i < lives ? "🌸" : "🥀")).join(" ")}
            </span>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
              Racha ✨ {streak}/{STREAK_FOR_LIFE}
            </span>
          </div>

          {stars.map((star) => {
            const age = Math.min(1, (now - star.bornAt) / lifeMs);
            const isTarget = star.id === lock.targetId;
            return (
              <div
                key={star.id}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${star.x}%`, top: `${star.y}%`, opacity: 1 - age * 0.75 }}
              >
                <p className={`text-3xl ${isTarget ? "anim-twinkle" : ""}`}>
                  {age > 0.66 ? "⭐" : "🌟"}
                </p>
                <p
                  className={`mt-0.5 rounded-lg px-2 py-0.5 font-mono text-lg font-bold ${
                    isTarget ? "bg-sol-400 text-noche-950" : "bg-noche-950/75 text-ink-900"
                  }`}
                >
                  {isTarget ? (
                    <>
                      <span className="text-noche-950/50 line-through">{lock.typed}</span>
                      <span>{star.word.slice(lock.typed.length)}</span>
                    </>
                  ) : (
                    star.word
                  )}
                </p>
              </div>
            );
          })}

          {sparkles.map((sparkle) => (
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
            style={{ left: `${fairy.x}%`, top: `${fairy.y}%` }}
          >
            🧚
          </p>
        </div>
      )}
    </main>
  );
}
