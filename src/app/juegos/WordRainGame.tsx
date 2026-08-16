"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import {
  gameDifficulty,
  gameWordPool,
} from "@/domain/games/wordPool";
import { formatAccuracy } from "@/domain/metrics/format";
import { useProgress } from "@/app/providers";

export interface GameTheme {
  slug: string;
  title: string;
  /** What the learner does to an item, e.g. "derriba" / "atrapa". */
  verb: string;
  itemEmoji: string;
  playerEmoji: string;
  /** Tailwind classes for the play-field background. */
  fieldClasses: string;
  /** Accent classes for the active word chip. */
  activeChipClasses: string;
  intro: string;
  missLabel: string;
}

interface FallingItem {
  id: number;
  word: string;
  spawnedAt: number;
  /** Horizontal position as a percentage. */
  x: number;
}

const LIVES = 3;
const TICK_MS = 90;

/**
 * Shared typing game: themed items fall with a word each; typing a word
 * removes its item and scores points. Difficulty (speed, spawn rate) comes
 * from the learner's current world, and every word only uses keys already
 * taught. Deterministic-friendly: all timing flows through performance.now.
 */
export function WordRainGame({ theme }: { theme: GameTheme }) {
  const { progress } = useProgress();
  const [items, setItems] = useState<FallingItem[]>([]);
  const [typed, setTyped] = useState("");
  const [targetId, setTargetId] = useState<number | null>(null);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [keystrokes, setKeystrokes] = useState({ total: 0, correct: 0 });
  const [status, setStatus] = useState<"ready" | "playing" | "over">("ready");
  const [now, setNow] = useState(0);
  const nextIdRef = useRef(1);
  const lastSpawnRef = useRef(0);
  const fieldRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(
    () => (progress ? gameWordPool(CURRICULUM_ES, progress) : []),
    [progress],
  );
  const difficulty = useMemo(
    () =>
      progress
        ? gameDifficulty(CURRICULUM_ES, progress)
        : { world: 1, fallMs: 9000, spawnMs: 3400, maxItems: 3 },
    [progress],
  );

  const start = useCallback(() => {
    setItems([]);
    setTyped("");
    setTargetId(null);
    setLives(LIVES);
    setScore(0);
    setHits(0);
    setMisses(0);
    setKeystrokes({ total: 0, correct: 0 });
    lastSpawnRef.current = 0;
    setStatus("playing");
    fieldRef.current?.focus();
  }, []);

  // Game clock: spawn, advance, and detect items reaching the ground.
  useEffect(() => {
    if (status !== "playing") return;
    const interval = window.setInterval(() => {
      const time = performance.now();
      setNow(time);

      setItems((current) => {
        let next = current;
        const landed = next.filter((item) => time - item.spawnedAt >= difficulty.fallMs);
        if (landed.length > 0) {
          next = next.filter((item) => time - item.spawnedAt < difficulty.fallMs);
          setMisses((value) => value + landed.length);
          setLives((value) => Math.max(0, value - landed.length));
          setTargetId((value) =>
            landed.some((item) => item.id === value) ? null : value,
          );
          if (landed.some((item) => item.id === targetId)) setTyped("");
        }
        const canSpawn =
          next.length < difficulty.maxItems &&
          time - lastSpawnRef.current >= difficulty.spawnMs &&
          pool.length > 0;
        if (canSpawn) {
          lastSpawnRef.current = time;
          const word = pool[Math.floor(Math.random() * pool.length)];
          const id = nextIdRef.current;
          nextIdRef.current += 1;
          next = [...next, { id, word, spawnedAt: time, x: 8 + Math.random() * 76 }];
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [status, difficulty.fallMs, difficulty.spawnMs, difficulty.maxItems, pool, targetId]);

  useEffect(() => {
    if (status === "playing" && lives === 0) setStatus("over");
  }, [lives, status]);

  const handleChar = useCallback(
    (char: string) => {
      setKeystrokes((k) => ({ ...k, total: k.total + 1 }));
      setItems((current) => {
        const target =
          targetId !== null ? current.find((item) => item.id === targetId) : undefined;
        if (!target) {
          // Lock onto the lowest item whose word starts with the pressed key.
          const candidates = current
            .filter((item) => item.word.startsWith(char))
            .sort((a, b) => a.spawnedAt - b.spawnedAt);
          if (candidates.length === 0) return current;
          const locked = candidates[0];
          setKeystrokes((k) => ({ ...k, correct: k.correct + 1 }));
          if (locked.word.length === 1) {
            setScore((value) => value + 10);
            setHits((value) => value + 1);
            return current.filter((item) => item.id !== locked.id);
          }
          setTargetId(locked.id);
          setTyped(char);
          return current;
        }
        const nextTyped = typed + char;
        if (!target.word.startsWith(nextTyped)) {
          // Wrong key: keep the lock but do not advance.
          return current;
        }
        setKeystrokes((k) => ({ ...k, correct: k.correct + 1 }));
        if (nextTyped === target.word) {
          setScore((value) => value + target.word.length * 10);
          setHits((value) => value + 1);
          setTargetId(null);
          setTyped("");
          return current.filter((item) => item.id !== target.id);
        }
        setTyped(nextTyped);
        return current;
      });
    },
    [targetId, typed],
  );

  const accuracy =
    keystrokes.total > 0 ? keystrokes.correct / keystrokes.total : null;

  if (progress === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-ink-400">
        Cargando…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
            ← Inicio
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            {theme.itemEmoji} {theme.title}
          </h1>
        </div>
        <p className="text-sm text-ink-600">
          Dificultad: <span className="font-bold text-brand-700">Mundo {difficulty.world}</span>
        </p>
      </header>

      {status !== "playing" && (
        <section className="rounded-3xl border-2 border-brand-100 bg-noche-900 p-8 text-center shadow-[6px_6px_0_rgba(0,0,0,0.35)]">
          {status === "over" ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
                Fin de la partida
              </p>
              <p className="mt-4 text-5xl font-black">{score}</p>
              <p className="text-ink-600">puntos</p>
              <dl className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">{theme.verb}</dt>
                  <dd className="text-xl font-bold">{hits}</dd>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">{theme.missLabel}</dt>
                  <dd className="text-xl font-bold">{misses}</dd>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">Precisión</dt>
                  <dd className="text-xl font-bold">{formatAccuracy(accuracy)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="text-6xl">{theme.playerEmoji}</p>
              <p className="mx-auto mt-4 max-w-md text-lg text-ink-600">{theme.intro}</p>
            </>
          )}
          <button
            type="button"
            onClick={start}
            className="mt-8 rounded-2xl bg-brand-500 px-10 py-4 text-lg font-bold text-noche-950 shadow-[5px_5px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[3px_3px_0_#7a2413]"
          >
            {status === "over" ? "Jugar otra vez" : "Jugar"}
          </button>
        </section>
      )}

      {status === "playing" && (
        <div
          ref={fieldRef}
          tabIndex={0}
          role="application"
          aria-label={`Juego ${theme.title}. Escribe las palabras que caen.`}
          onKeyDown={(event) => {
            if (
              event.key.length === 1 &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey
            ) {
              event.preventDefault();
              handleChar(event.key.toLowerCase());
            }
          }}
          className={`relative h-[26rem] cursor-default overflow-hidden rounded-3xl border-2 border-brand-100 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${theme.fieldClasses}`}
        >
          <div className="absolute left-4 top-3 z-10 flex items-center gap-4 text-sm font-bold">
            <span>{score} pts</span>
            <span aria-label={`${lives} vidas`}>
              {Array.from({ length: LIVES }, (_, i) => (i < lives ? "❤️" : "🖤")).join(" ")}
            </span>
          </div>
          {items.map((item) => {
            const t = Math.min(1, (now - item.spawnedAt) / difficulty.fallMs);
            const isTarget = item.id === targetId;
            return (
              <div
                key={item.id}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${item.x}%`, top: `${t * 88}%` }}
              >
                <p className="text-3xl">{theme.itemEmoji}</p>
                <p
                  className={`mt-0.5 rounded-lg px-2 py-0.5 font-mono text-lg font-bold ${
                    isTarget ? theme.activeChipClasses : "bg-noche-950/70 text-ink-900"
                  }`}
                >
                  {isTarget ? (
                    <>
                      <span className="text-menta-400">{typed}</span>
                      <span>{item.word.slice(typed.length)}</span>
                    </>
                  ) : (
                    item.word
                  )}
                </p>
              </div>
            );
          })}
          <p
            aria-hidden="true"
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-4xl"
          >
            {theme.playerEmoji}
          </p>
        </div>
      )}
    </main>
  );
}
