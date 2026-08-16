"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import { gameDifficulty, gameWordPool } from "@/domain/games/wordPool";
import { initialLockOn, pressKey, type LockOnState } from "@/domain/games/lockOn";
import { formatAccuracy } from "@/domain/metrics/format";
import { useProgress } from "@/app/providers";

interface Enemy {
  id: number;
  word: string;
  x: number;
  spawnedAt: number;
}

interface Effect {
  id: number;
  type: "explosion" | "score";
  x: number;
  y: number;
  label?: string;
  bornAt: number;
}

const LIVES = 3;
const TICK_MS = 90;
const KILLS_PER_WAVE = 8;

/**
 * Invasión Tecleante: enemy ships descend towards the rocket, which slides
 * to aim at the locked target and fires a laser per correct letter. Waves
 * speed everything up; combos multiply the score.
 */
export default function NavesPage() {
  const { progress } = useProgress();
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [lock, setLock] = useState<LockOnState>(initialLockOn);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [kills, setKills] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [keystrokes, setKeystrokes] = useState({ total: 0, correct: 0 });
  const [status, setStatus] = useState<"ready" | "playing" | "over">("ready");
  const [now, setNow] = useState(0);
  const [shakeStamp, setShakeStamp] = useState(0);
  const [laser, setLaser] = useState<{ x: number; y: number; at: number } | null>(null);
  const nextIdRef = useRef(1);
  const lastSpawnRef = useRef(0);
  const fieldRef = useRef<HTMLDivElement>(null);

  const pool = useMemo(() => gameWordPool(CURRICULUM_ES, progress), [progress]);
  const base = useMemo(() => gameDifficulty(CURRICULUM_ES, progress), [progress]);

  const wave = Math.floor(kills / KILLS_PER_WAVE) + 1;
  const speedup = Math.pow(0.88, wave - 1);
  const fallMs = base.fallMs * speedup;
  const spawnMs = base.spawnMs * speedup;

  const start = useCallback(() => {
    setEnemies([]);
    setEffects([]);
    setLock(initialLockOn);
    setLives(LIVES);
    setScore(0);
    setKills(0);
    setCombo(0);
    setBestCombo(0);
    setKeystrokes({ total: 0, correct: 0 });
    lastSpawnRef.current = 0;
    setStatus("playing");
    fieldRef.current?.focus();
  }, []);

  // Game clock: descend, land, spawn, expire effects.
  useEffect(() => {
    if (status !== "playing") return;
    const interval = window.setInterval(() => {
      const time = performance.now();
      setNow(time);
      setEffects((current) => current.filter((e) => time - e.bornAt < 800));
      setEnemies((current) => {
        let next = current;
        const landed = next.filter((enemy) => time - enemy.spawnedAt >= fallMs);
        if (landed.length > 0) {
          next = next.filter((enemy) => time - enemy.spawnedAt < fallMs);
          setLives((value) => Math.max(0, value - landed.length));
          setCombo(0);
          setShakeStamp(time);
          setLock((state) =>
            landed.some((enemy) => enemy.id === state.targetId)
              ? initialLockOn
              : state,
          );
        }
        const canSpawn =
          next.length < base.maxItems &&
          time - lastSpawnRef.current >= spawnMs &&
          pool.length > 0;
        if (canSpawn) {
          lastSpawnRef.current = time;
          const id = nextIdRef.current;
          nextIdRef.current += 1;
          next = [
            ...next,
            {
              id,
              word: pool[Math.floor(Math.random() * pool.length)],
              x: 10 + Math.random() * 72,
              spawnedAt: time,
            },
          ];
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [status, fallMs, spawnMs, base.maxItems, pool]);

  useEffect(() => {
    if (status === "playing" && lives === 0) setStatus("over");
  }, [lives, status]);

  const handleChar = useCallback(
    (char: string) => {
      const time = performance.now();
      setKeystrokes((k) => ({ ...k, total: k.total + 1 }));
      const { state, result } = pressKey(lock, enemies, char);
      setLock(state);
      if (result.kind === "ignored" || result.kind === "wrong") {
        setCombo(0);
        return;
      }
      setKeystrokes((k) => ({ ...k, correct: k.correct + 1 }));

      const targetId =
        result.kind === "completed" || result.kind === "locked"
          ? result.targetId
          : state.targetId;
      const target = enemies.find((enemy) => enemy.id === targetId);
      if (target) {
        const y = Math.min(1, (time - target.spawnedAt) / fallMs) * 62 + 6;
        setLaser({ x: target.x, y, at: time });
        if (result.kind === "completed") {
          const nextCombo = combo + 1;
          const gained = target.word.length * 10 * nextCombo;
          setCombo(nextCombo);
          setBestCombo((best) => Math.max(best, nextCombo));
          setScore((value) => value + gained);
          setKills((value) => value + 1);
          setEnemies((current) => current.filter((enemy) => enemy.id !== target.id));
          setEffects((current) => [
            ...current,
            { id: nextIdRef.current++, type: "explosion", x: target.x, y, bornAt: time },
            {
              id: nextIdRef.current++,
              type: "score",
              x: target.x,
              y: Math.max(2, y - 8),
              label: `+${gained}`,
              bornAt: time,
            },
          ]);
        }
      }
    },
    [lock, enemies, combo, fallMs],
  );

  if (progress === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-ink-400">
        Cargando…
      </main>
    );
  }

  const target = enemies.find((enemy) => enemy.id === lock.targetId);
  const shipX = target ? target.x : 50;
  const accuracy = keystrokes.total > 0 ? keystrokes.correct / keystrokes.total : null;
  const isShaking = now - shakeStamp < 400;
  const laserVisible = laser !== null && now - laser.at < 140;

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-4 flex items-baseline justify-between">
        <div>
          <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
            ← Inicio
          </Link>
          <h1 className="mt-1 text-2xl font-black tracking-tight">🚀 Invasión Tecleante</h1>
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
                Fin de la invasión
              </p>
              <p className="mt-4 text-5xl font-black">{score}</p>
              <p className="text-ink-600">puntos</p>
              <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-center sm:grid-cols-4">
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">Derribadas</dt>
                  <dd className="text-xl font-bold">{kills}</dd>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">Oleada</dt>
                  <dd className="text-xl font-bold">{wave}</dd>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">Mejor combo</dt>
                  <dd className="text-xl font-bold">x{bestCombo}</dd>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3">
                  <dt className="text-xs text-ink-600">Precisión</dt>
                  <dd className="text-xl font-bold">{formatAccuracy(accuracy)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="anim-drift text-6xl">🛸</p>
              <p className="mx-auto mt-4 max-w-md text-lg text-ink-600">
                Una flota se acerca a tu cohete. Escribe la palabra de cada nave
                para derribarla con el láser. Encadena derribos sin fallar y el
                combo multiplicará tus puntos. Cada oleada es más rápida.
              </p>
            </>
          )}
          <button
            type="button"
            onClick={start}
            className="mt-8 rounded-2xl bg-brand-500 px-10 py-4 text-lg font-bold text-noche-950 shadow-[5px_5px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[3px_3px_0_#7a2413]"
          >
            {status === "over" ? "Otra invasión" : "Despegar"}
          </button>
        </section>
      ) : (
        <div
          ref={fieldRef}
          tabIndex={0}
          role="application"
          aria-label="Juego Invasión Tecleante. Escribe las palabras de las naves."
          onKeyDown={(event) => {
            if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
              event.preventDefault();
              handleChar(event.key.toLowerCase());
            }
          }}
          className={`relative h-[28rem] cursor-default overflow-hidden rounded-3xl border-2 border-brand-100 bg-noche-950 bg-[radial-gradient(circle_at_20%_10%,rgba(120,80,255,0.28),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,93,59,0.18),transparent_40%),radial-gradient(1px_1px_at_30%_60%,#fff_99%,transparent),radial-gradient(1px_1px_at_70%_20%,#fff_99%,transparent),radial-gradient(1px_1px_at_85%_75%,#fff_99%,transparent),radial-gradient(1.5px_1.5px_at_15%_35%,#fff_99%,transparent),radial-gradient(1px_1px_at_50%_85%,#fff_99%,transparent)] outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            isShaking ? "anim-shake" : ""
          }`}
        >
          {isShaking && (
            <div className="pointer-events-none absolute inset-0 z-20 rounded-3xl ring-8 ring-inset ring-red-500/40" />
          )}
          <div className="absolute left-4 top-3 z-10 flex items-center gap-4 text-sm font-bold">
            <span>{score} pts</span>
            <span aria-label={`${lives} vidas`}>
              {Array.from({ length: LIVES }, (_, i) => (i < lives ? "❤️" : "🖤")).join(" ")}
            </span>
            <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
              Oleada {wave}
            </span>
            {combo > 1 && (
              <span
                key={combo}
                className="anim-pop-in rounded-full bg-sol-400 px-2.5 py-0.5 text-xs font-black text-noche-950"
              >
                COMBO x{combo}
              </span>
            )}
          </div>

          {laserVisible && (
            <div
              className="pointer-events-none absolute z-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-t from-brand-500 via-sol-400 to-transparent"
              style={{
                left: `${laser!.x}%`,
                top: `${laser!.y + 4}%`,
                height: `${88 - laser!.y}%`,
              }}
            />
          )}

          {enemies.map((enemy) => {
            const t = Math.min(1, (now - enemy.spawnedAt) / fallMs);
            const isTarget = enemy.id === lock.targetId;
            return (
              <div
                key={enemy.id}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${enemy.x}%`, top: `${6 + t * 62}%` }}
              >
                <p className={`text-3xl ${isTarget ? "anim-wobble" : "anim-drift"}`}>🛸</p>
                <p
                  className={`mt-0.5 rounded-lg px-2 py-0.5 font-mono text-lg font-bold ${
                    isTarget
                      ? "bg-brand-500 text-noche-950"
                      : "bg-noche-950/75 text-ink-900"
                  }`}
                >
                  {isTarget ? (
                    <>
                      <span className="text-noche-950/50 line-through">{lock.typed}</span>
                      <span>{enemy.word.slice(lock.typed.length)}</span>
                    </>
                  ) : (
                    enemy.word
                  )}
                </p>
              </div>
            );
          })}

          {effects.map((effect) =>
            effect.type === "explosion" ? (
              <p
                key={effect.id}
                className="anim-explode pointer-events-none absolute -translate-x-1/2 text-4xl"
                style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
              >
                💥
              </p>
            ) : (
              <p
                key={effect.id}
                className="anim-float-up pointer-events-none absolute -translate-x-1/2 font-black text-sol-400"
                style={{ left: `${effect.x}%`, top: `${effect.y}%` }}
              >
                {effect.label}
              </p>
            ),
          )}

          <p
            aria-hidden="true"
            className="motion-safe-transition absolute bottom-2 -translate-x-1/2 text-4xl transition-[left] duration-300 ease-out"
            style={{ left: `${shipX}%` }}
          >
            🚀
          </p>
        </div>
      )}
    </main>
  );
}
