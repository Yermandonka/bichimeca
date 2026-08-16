"use client";

import Link from "next/link";
import { CURRICULUM_ES, WORLD_TITLES } from "@/data/curriculum/es";
import type { Lesson } from "@/domain/curriculum/types";
import {
  completedLessonIds,
  currentLessonId,
  isLessonUnlocked,
} from "@/domain/progress/selectors";
import { lessonStars } from "@/domain/gamification/gamification";
import type { ProgressData } from "@/domain/progress/progress";
import { useProgress } from "../providers";

const ROW_PX = 132;

interface WorldTheme {
  emoji: string;
  /** Full-bleed section background. */
  bg: string;
  /** Road strokes: outer edge and bed. */
  road: [string, string];
  decor: string[];
}

/** Every world is a different landscape along the journey. */
const WORLD_THEMES: Record<number, WorldTheme> = {
  1: {
    emoji: "🌱",
    bg: "bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,rgba(46,230,168,0.22),transparent),radial-gradient(ellipse_60%_45%_at_85%_60%,rgba(120,200,90,0.14),transparent)]",
    road: ["#24402e", "#3f6b4c"],
    decor: ["🌱", "🌼", "🐛", "🍀", "🦋", "🌷", "🐞", "🌻"],
  },
  2: {
    emoji: "🪁",
    bg: "bg-[radial-gradient(ellipse_70%_50%_at_80%_0%,rgba(96,140,255,0.26),transparent),radial-gradient(ellipse_60%_45%_at_15%_55%,rgba(120,80,255,0.18),transparent)]",
    road: ["#26325e", "#42549e"],
    decor: ["☁️", "🪁", "🕊️", "🌤️", "🎈", "🌈", "🫧", "🦅"],
  },
  3: {
    emoji: "🍄",
    bg: "bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,rgba(200,80,255,0.2),transparent),radial-gradient(ellipse_60%_45%_at_80%_60%,rgba(255,93,59,0.12),transparent)]",
    road: ["#38203f", "#5c3a66"],
    decor: ["🍄", "💎", "🦉", "🕯️", "🌙", "🪨", "🦇", "✨"],
  },
  4: {
    emoji: "❄️",
    bg: "bg-[radial-gradient(ellipse_70%_50%_at_75%_0%,rgba(120,200,255,0.24),transparent),radial-gradient(ellipse_60%_45%_at_20%_60%,rgba(255,255,255,0.08),transparent)]",
    road: ["#27404f", "#4a7391"],
    decor: ["❄️", "⛰️", "☃️", "🧊", "🌨️", "🏔️", "🦌", "✨"],
  },
  5: {
    emoji: "🌃",
    bg: "bg-[radial-gradient(ellipse_70%_50%_at_25%_0%,rgba(255,210,63,0.2),transparent),radial-gradient(ellipse_60%_45%_at_80%_55%,rgba(255,93,59,0.16),transparent)]",
    road: ["#443019", "#6f5228"],
    decor: ["🏮", "🌟", "🎆", "🌆", "🎇", "🏙️", "💫", "🎠"],
  },
};

const DEFAULT_THEME = WORLD_THEMES[1];

/** Serpentine x position (percentage) for the nth node of a world. */
function nodeX(index: number): number {
  return 50 + 32 * Math.sin(index * 1.05);
}

function WorldPath({
  lessons,
  progress,
  current,
  theme,
}: {
  lessons: Lesson[];
  progress: ProgressData;
  current: string | null;
  theme: WorldTheme;
}) {
  const completed = completedLessonIds(progress);
  const height = lessons.length * ROW_PX;
  const points = lessons.map((_, i) => ({ x: nodeX(i), y: i * ROW_PX + ROW_PX / 2 }));
  // Smooth S-curves between nodes so the trail reads like a real path.
  const path = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midY = (prev.y + p.y) / 2;
      return `C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
    <div className="relative" style={{ height }}>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill="none"
          stroke={theme.road[0]}
          strokeWidth="54"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke={theme.road[1]}
          strokeWidth="44"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke="rgba(246,241,231,0.55)"
          strokeWidth="3.5"
          strokeDasharray="12 16"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {lessons.map((lesson, i) => {
        const decor = theme.decor[(lesson.order + i) % theme.decor.length];
        const decorX = nodeX(i) > 50 ? nodeX(i) - 33 : nodeX(i) + 33;
        const isCompleted = completed.has(lesson.id);
        const isCurrent = lesson.id === current;
        const unlocked = isLessonUnlocked(CURRICULUM_ES, progress, lesson.id);
        const stars = lessonStars(progress, lesson.id);
        const isBoss = lesson.type === "boss";

        const circle = (
          <span
            className={`flex items-center justify-center rounded-full border-4 font-black shadow-[5px_5px_0_rgba(0,0,0,0.4)] transition group-hover:-translate-y-1 ${
              isBoss ? "h-24 w-24 text-4xl" : "h-20 w-20 text-2xl"
            } ${
              isCurrent
                ? "border-brand-500 bg-brand-500 text-noche-950 ring-8 ring-brand-500/25"
                : isCompleted
                  ? "border-menta-400 bg-menta-400/25 text-menta-400"
                  : unlocked
                    ? "border-brand-100 bg-noche-900 text-ink-900"
                    : "border-ink-900/10 bg-noche-900/70 text-ink-400 opacity-70"
            }`}
          >
            {isBoss ? "👑" : isCompleted ? "✓" : unlocked ? lesson.order : "🔒"}
          </span>
        );

        const label = (
          <span className="mt-2 block max-w-52 text-center text-base font-bold leading-tight">
            <span
              className={`rounded-xl px-2 py-0.5 ${
                unlocked ? "bg-noche-950/60 text-ink-900" : "text-ink-400"
              }`}
            >
              {lesson.title}
            </span>
            {isCompleted && (
              <span
                className="mt-1 block text-lg"
                aria-label={`${stars} de 3 estrellas`}
              >
                {[1, 2, 3].map((star) => (
                  <span
                    key={star}
                    aria-hidden="true"
                    className={star <= stars ? "text-sol-400" : "text-ink-900/20"}
                  >
                    ★
                  </span>
                ))}
              </span>
            )}
            {isCurrent && (
              <span className="anim-pop-in mt-1 block rounded-full bg-brand-500 px-3 py-1 text-xs font-black uppercase text-noche-950">
                Continuar
              </span>
            )}
          </span>
        );

        return (
          <div key={lesson.id}>
            <p
              aria-hidden="true"
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-4xl opacity-80"
              style={{ left: `${decorX}%`, top: i * ROW_PX + ROW_PX / 2 }}
            >
              {decor}
            </p>
            <div
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${nodeX(i)}%`, top: i * ROW_PX + ROW_PX / 2 }}
            >
              {unlocked ? (
                <Link
                  href={`/leccion/${lesson.id}`}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Lección ${lesson.order}: ${lesson.title}`}
                  className="group flex flex-col items-center rounded-3xl p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  {circle}
                  {label}
                </Link>
              ) : (
                <div aria-disabled="true" className="flex flex-col items-center p-1">
                  {circle}
                  {label}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CursoPage() {
  const { progress } = useProgress();

  if (progress === null) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-ink-400">
        Cargando tu progreso…
      </main>
    );
  }

  const current = currentLessonId(CURRICULUM_ES, progress);
  const completed = completedLessonIds(progress);
  const worlds = [...new Set(CURRICULUM_ES.map((lesson) => lesson.world))].sort(
    (a, b) => a - b,
  );

  return (
    <main className="min-h-dvh w-full">
      <header className="flex items-center justify-between px-6 py-5">
        <h1 className="text-3xl font-black tracking-tight">Curso</h1>
        <Link
          href="/"
          className="rounded-full border-2 border-brand-100 bg-noche-900 px-5 py-2 text-base font-bold text-brand-600 transition hover:border-brand-500"
        >
          ← Inicio
        </Link>
      </header>

      {worlds.map((world) => {
        const theme = WORLD_THEMES[world] ?? DEFAULT_THEME;
        const lessons = CURRICULUM_ES.filter((lesson) => lesson.world === world);
        const done = lessons.filter((lesson) => completed.has(lesson.id)).length;
        return (
          <section
            key={world}
            aria-label={WORLD_TITLES[world] ?? `Mundo ${world}`}
            className={`w-full py-10 ${theme.bg}`}
          >
            <div className="mx-auto max-w-4xl px-4">
              <div className="mb-8 flex items-center justify-between gap-4 rounded-3xl border-2 border-brand-100 bg-noche-900/85 px-6 py-4 shadow-[5px_5px_0_rgba(0,0,0,0.4)]">
                <h2 className="text-2xl font-black">
                  <span aria-hidden="true" className="mr-2 text-3xl">
                    {theme.emoji}
                  </span>
                  {WORLD_TITLES[world] ?? `Mundo ${world}`}
                </h2>
                <div className="text-right">
                  <p className="text-lg font-black text-menta-400">
                    {done}/{lessons.length}
                  </p>
                  <div className="mt-1 h-2.5 w-36 overflow-hidden rounded-full bg-noche-950">
                    <div
                      className="h-full rounded-full bg-menta-400 transition-all"
                      style={{ width: `${(done / lessons.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <WorldPath
                lessons={lessons}
                progress={progress}
                current={current}
                theme={theme}
              />
            </div>
          </section>
        );
      })}
    </main>
  );
}
