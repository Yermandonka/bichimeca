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
 * Invasión Tecleante — full-screen wave shooter.
 *
 * The whole game world lives in a mutable ref advanced by a single tick;
 * React state only mirrors a frame counter, so state updaters stay pure
 * (React StrictMode double-invokes updaters, which silently broke the
 * previous setState-based spawning in development).
 */

type EnemyKind = "normal" | "veloz" | "tanque" | "dorada";

interface Enemy {
  id: number;
  kind: EnemyKind;
  word: string;
  x: number;
  spawnedAt: number;
  fallMs: number;
  points: number;
}

interface Effect {
  id: number;
  type: "explosion" | "score";
  x: number;
  y: number;
  label?: string;
  bornAt: number;
}

interface World {
  enemies: Enemy[];
  effects: Effect[];
  lock: LockOnState;
  lives: number;
  score: number;
  kills: number;
  combo: number;
  bestCombo: number;
  keystrokes: { total: number; correct: number };
  wave: number;
  /** Enemies this wave will send in total. */
  waveQuota: number;
  /** Enemies of this wave already resolved (killed or landed). */
  waveResolved: number;
  interludeUntil: number;
  lastSpawn: number;
  shakeUntil: number;
  laser: { x1: number; y1: number; x2: number; y2: number; until: number } | null;
  ship: { x: number; angle: number };
}

const LIVES = 3;
const TICK_MS = 60;
const RECORD_KEY = "bichimeca.record.naves";
const SHIP_Y = 88;

const ENEMY_STYLE: Record<EnemyKind, { emoji: string; label: string }> = {
  normal: { emoji: "🛸", label: "nave" },
  veloz: { emoji: "🛰️", label: "nave veloz" },
  tanque: { emoji: "👾", label: "nave acorazada" },
  dorada: { emoji: "💫", label: "nave dorada" },
};

function waveQuotaFor(wave: number): number {
  return 6 + wave * 2;
}

function pickKind(wave: number): EnemyKind {
  const roll = Math.random();
  if (roll < 0.06 + wave * 0.01) return "dorada";
  if (wave >= 2 && roll < 0.22 + wave * 0.03) return "veloz";
  if (wave >= 3 && roll < 0.4 + wave * 0.03) return "tanque";
  return "normal";
}

/** Words grow with the waves; fast ships get short words, tanks long ones. */
function pickWord(pool: string[], wave: number, kind: EnemyKind): string {
  const min = kind === "veloz" ? 2 : Math.min(2 + Math.floor(wave / 2), 5);
  const max = kind === "tanque" ? 6 + wave : 4 + wave;
  const fit = pool.filter((word) => word.length >= min && word.length <= max);
  const source = fit.length > 0 ? fit : pool;
  return source[Math.floor(Math.random() * source.length)];
}

function freshWorld(): World {
  return {
    enemies: [],
    effects: [],
    lock: initialLockOn,
    lives: LIVES,
    score: 0,
    kills: 0,
    combo: 0,
    bestCombo: 0,
    keystrokes: { total: 0, correct: 0 },
    wave: 1,
    waveQuota: waveQuotaFor(1),
    waveResolved: 0,
    interludeUntil: 0,
    lastSpawn: 0,
    shakeUntil: 0,
    laser: null,
    ship: { x: 50, angle: 0 },
  };
}

function enemyY(enemy: Enemy, now: number): number {
  return 4 + Math.min(1, (now - enemy.spawnedAt) / enemy.fallMs) * (SHIP_Y - 18);
}

export default function NavesPage() {
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
      // Shift every time anchor by the pause length so nothing jumps.
      const pausedFor = performance.now() - pauseStartRef.current;
      const world = worldRef.current;
      world.enemies.forEach((enemy) => {
        enemy.spawnedAt += pausedFor;
      });
      world.effects.forEach((effect) => {
        effect.bornAt += pausedFor;
      });
      world.lastSpawn += pausedFor;
      world.interludeUntil += pausedFor;
      world.shakeUntil += pausedFor;
      if (world.laser) world.laser.until += pausedFor;
      setStatus("playing");
    }
  }, [status]);

  // Single game tick mutating the world ref; render follows via setFrame.
  useEffect(() => {
    if (status !== "playing") return;
    const interval = window.setInterval(() => {
      const now = performance.now();
      const world = worldRef.current;
      const speedup = Math.pow(0.9, world.wave - 1);

      world.effects = world.effects.filter((e) => now - e.bornAt < 800);
      if (world.laser && now > world.laser.until) world.laser = null;

      // Landings hurt: lose a life, break the combo, shake the screen.
      const landed = world.enemies.filter((e) => now - e.spawnedAt >= e.fallMs);
      if (landed.length > 0) {
        world.enemies = world.enemies.filter((e) => now - e.spawnedAt < e.fallMs);
        world.lives = Math.max(0, world.lives - landed.length);
        world.combo = 0;
        world.waveResolved += landed.length;
        world.shakeUntil = now + 400;
        if (landed.some((e) => e.id === world.lock.targetId)) {
          world.lock = initialLockOn;
        }
      }

      // Wave flow: quota resolved and field clear -> interlude -> next wave.
      const inInterlude = now < world.interludeUntil;
      if (
        !inInterlude &&
        world.waveResolved >= world.waveQuota &&
        world.enemies.length === 0
      ) {
        world.wave += 1;
        world.waveQuota = waveQuotaFor(world.wave);
        world.waveResolved = 0;
        world.interludeUntil = now + 2200;
      }

      const spawned = world.waveResolved + world.enemies.length;
      const canSpawn =
        !inInterlude &&
        spawned < world.waveQuota &&
        world.enemies.length < base.maxItems + Math.floor(world.wave / 3) &&
        now - world.lastSpawn >= base.spawnMs * speedup &&
        pool.length > 0;
      if (canSpawn) {
        world.lastSpawn = now;
        const kind = pickKind(world.wave);
        const speed =
          kind === "veloz" ? 0.62 : kind === "tanque" ? 1.35 : kind === "dorada" ? 0.55 : 1;
        const mult =
          kind === "veloz" ? 2 : kind === "tanque" ? 3 : kind === "dorada" ? 5 : 1;
        const word = pickWord(pool, world.wave, kind);
        world.enemies.push({
          id: idRef.current++,
          kind,
          word,
          x: 8 + Math.random() * 76,
          spawnedAt: now,
          fallMs: base.fallMs * speedup * speed,
          points: word.length * 10 * mult,
        });
      }

      // Ship: glide towards the locked target (patrol when idle) with the
      // tip rotated to aim at it.
      const target = world.enemies.find((e) => e.id === world.lock.targetId);
      const wantedX = target ? target.x : 50 + 30 * Math.sin(now / 1400);
      world.ship.x += (wantedX - world.ship.x) * 0.14;
      if (target) {
        const dx = target.x - world.ship.x;
        const dy = enemyY(target, now) - SHIP_Y;
        world.ship.angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
      } else {
        world.ship.angle += (0 - world.ship.angle) * 0.2;
      }

      if (world.lives === 0) finish();
      setFrame((f) => f + 1);
    }, TICK_MS);
    return () => window.clearInterval(interval);
  }, [status, base, pool, finish]);

  const handleChar = useCallback((char: string) => {
    const now = performance.now();
    const world = worldRef.current;
    world.keystrokes.total += 1;
    const { state, result } = pressKey(world.lock, world.enemies, char);
    world.lock = state;
    if (result.kind === "ignored" || result.kind === "wrong") {
      world.combo = 0;
      return;
    }
    world.keystrokes.correct += 1;

    const targetId =
      result.kind === "completed" || result.kind === "locked"
        ? result.targetId
        : state.targetId;
    const target = world.enemies.find((e) => e.id === targetId);
    if (!target) return;
    const y = enemyY(target, now);
    world.laser = {
      x1: world.ship.x,
      y1: SHIP_Y - 3,
      x2: target.x,
      y2: y,
      until: now + 130,
    };

    if (result.kind === "completed") {
      world.combo += 1;
      world.bestCombo = Math.max(world.bestCombo, world.combo);
      const gained = target.points * world.combo;
      world.score += gained;
      world.kills += 1;
      world.waveResolved += 1;
      world.enemies = world.enemies.filter((e) => e.id !== target.id);
      world.effects.push(
        { id: idRef.current++, type: "explosion", x: target.x, y, bornAt: now },
        {
          id: idRef.current++,
          type: "score",
          x: target.x,
          y: Math.max(2, y - 7),
          label: `+${gained}`,
          bornAt: now,
        },
      );
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
  const isShaking = status === "playing" && now < world.shakeUntil;
  const inInterlude = status === "playing" && now < world.interludeUntil;

  return (
    <main
      className={`relative h-dvh w-full overflow-hidden bg-noche-950 bg-[radial-gradient(ellipse_60%_45%_at_15%_0%,rgba(120,80,255,0.35),transparent),radial-gradient(ellipse_50%_40%_at_85%_20%,rgba(255,93,59,0.22),transparent),radial-gradient(ellipse_70%_50%_at_50%_110%,rgba(46,230,168,0.14),transparent),radial-gradient(1.5px_1.5px_at_12%_25%,#fff_99%,transparent),radial-gradient(1px_1px_at_28%_65%,#fff_99%,transparent),radial-gradient(2px_2px_at_44%_12%,#ffd23f_99%,transparent),radial-gradient(1px_1px_at_58%_48%,#fff_99%,transparent),radial-gradient(1.5px_1.5px_at_72%_78%,#fff_99%,transparent),radial-gradient(1px_1px_at_86%_35%,#fff_99%,transparent),radial-gradient(1px_1px_at_94%_62%,#fff_99%,transparent)] ${
        isShaking ? "anim-shake" : ""
      }`}
    >
      <p
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-[14%] text-6xl opacity-40"
      >
        🪐
      </p>
      {isShaking && (
        <div className="pointer-events-none absolute inset-0 z-20 ring-[12px] ring-inset ring-red-500/40" />
      )}

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-3 text-sm font-bold">
        <div className="flex items-center gap-4">
          <span className="text-lg">{world.score} pts</span>
          <span aria-label={`${world.lives} vidas`}>
            {Array.from({ length: LIVES }, (_, i) =>
              i < world.lives ? "❤️" : "🖤",
            ).join(" ")}
          </span>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
            Oleada {world.wave}
          </span>
          {world.combo > 1 && (
            <span
              key={world.combo}
              className="anim-pop-in rounded-full bg-sol-400 px-2.5 py-0.5 text-xs font-black text-noche-950"
            >
              COMBO x{world.combo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sol-400">🏆 Récord: {record}</span>
          {(status === "playing" || status === "paused") && (
            <button
              type="button"
              onClick={togglePause}
              className="rounded-full border-2 border-brand-100 bg-noche-900 px-3 py-1 text-xs font-bold hover:border-brand-500"
            >
              {status === "paused" ? "▶ Reanudar" : "⏸ Pausa"}
            </button>
          )}
        </div>
      </div>

      {inInterlude && (
        <p
          key={world.wave}
          className="anim-pop-in absolute inset-x-0 top-1/3 z-20 text-center text-5xl font-black text-sol-400"
        >
          ¡Oleada {world.wave}!
        </p>
      )}

      {(status === "playing" || status === "paused") && (
        <div
          role="application"
          aria-label="Juego Invasión Tecleante. Escribe las palabras de las naves; el teclado ya está activo."
          className="absolute inset-0"
        >
          {world.laser && now < world.laser.until && (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="laserGradient" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#ff5d3b" />
                  <stop offset="100%" stopColor="#ffd23f" />
                </linearGradient>
              </defs>
              <line
                x1={world.laser.x1}
                y1={world.laser.y1}
                x2={world.laser.x2}
                y2={world.laser.y2}
                stroke="url(#laserGradient)"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
            </svg>
          )}

          {world.enemies.map((enemy) => {
            const y = enemyY(enemy, now);
            const isTarget = enemy.id === world.lock.targetId;
            return (
              <div
                key={enemy.id}
                className="absolute -translate-x-1/2 text-center"
                style={{ left: `${enemy.x}%`, top: `${y}%` }}
              >
                <p
                  aria-label={ENEMY_STYLE[enemy.kind].label}
                  className={`${enemy.kind === "tanque" ? "text-4xl" : "text-3xl"} ${
                    isTarget ? "anim-wobble" : "anim-drift"
                  }`}
                >
                  {ENEMY_STYLE[enemy.kind].emoji}
                </p>
                <p
                  className={`mt-0.5 rounded-lg px-2 py-0.5 font-mono text-lg font-bold ${
                    isTarget
                      ? "bg-brand-500 text-noche-950"
                      : enemy.kind === "dorada"
                        ? "bg-sol-400/90 text-noche-950"
                        : "bg-noche-950/75 text-ink-900"
                  }`}
                >
                  {isTarget ? (
                    <>
                      <span className="text-noche-950/50 line-through">
                        {world.lock.typed}
                      </span>
                      <span>{enemy.word.slice(world.lock.typed.length)}</span>
                    </>
                  ) : (
                    enemy.word
                  )}
                </p>
              </div>
            );
          })}

          {world.effects.map((effect) =>
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
            className="absolute text-5xl"
            style={{
              left: `${world.ship.x}%`,
              top: `${SHIP_Y}%`,
              transform: `translateX(-50%) rotate(${world.ship.angle}deg)`,
            }}
          >
            🚀
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
                  Fin de la invasión
                </p>
                {newRecord && (
                  <p className="anim-pop-in mt-2 text-lg font-black text-sol-400">
                    🎉 ¡Nuevo récord personal!
                  </p>
                )}
                <p className="mt-3 text-5xl font-black">{world.score}</p>
                <p className="text-ink-600">puntos</p>
                <dl className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-center sm:grid-cols-4">
                  <div className="rounded-2xl bg-brand-50 p-3">
                    <dt className="text-xs text-ink-600">Derribadas</dt>
                    <dd className="text-xl font-bold">{world.kills}</dd>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-3">
                    <dt className="text-xs text-ink-600">Oleada</dt>
                    <dd className="text-xl font-bold">{world.wave}</dd>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-3">
                    <dt className="text-xs text-ink-600">Mejor combo</dt>
                    <dd className="text-xl font-bold">x{world.bestCombo}</dd>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-3">
                    <dt className="text-xs text-ink-600">Precisión</dt>
                    <dd className="text-xl font-bold">{formatAccuracy(accuracy)}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-black">🚀 Invasión Tecleante</h1>
                <p className="mx-auto mt-3 max-w-md text-ink-600">
                  Derriba la flota escribiendo la palabra de cada nave. Las
                  veloces 🛰️, acorazadas 👾 y doradas 💫 valen más; el combo
                  multiplica los puntos y cada oleada llega más rápida y con
                  palabras más largas. Esc para pausar. Dificultad: Mundo{" "}
                  {base.world}.
                </p>
              </>
            )}
            <button
              type="button"
              onClick={start}
              className="mt-7 rounded-2xl bg-brand-500 px-10 py-4 text-lg font-bold text-noche-950 shadow-[5px_5px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[3px_3px_0_#7a2413]"
            >
              {status === "over" ? "Otra invasión" : "Despegar"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
