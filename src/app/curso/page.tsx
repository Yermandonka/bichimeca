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

const ROW_PX = 104;

/** Serpentine x position (percentage) for the nth node of a world. */
function nodeX(index: number): number {
  return 50 + 34 * Math.sin(index * 1.05);
}

function WorldPath({
  lessons,
  progress,
  current,
}: {
  lessons: Lesson[];
  progress: ProgressData;
  current: string | null;
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
        {/* Road bed, warm edge and dashed center line */}
        <path
          d={path}
          fill="none"
          stroke="#3d2f24"
          strokeWidth="46"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke="#6b543d"
          strokeWidth="38"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke="rgba(246,241,231,0.55)"
          strokeWidth="3"
          strokeDasharray="10 14"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {lessons.map((lesson, i) => {
        const DECOR = ["🌳", "🌼", "🪨", "🌻", "🍄", "🌲", "🦋", "⛰️"];
        const decor = DECOR[(lesson.order + i) % DECOR.length];
        const decorX = nodeX(i) > 50 ? nodeX(i) - 34 : nodeX(i) + 34;
        const isCompleted = completed.has(lesson.id);
        const isCurrent = lesson.id === current;
        const unlocked = isLessonUnlocked(CURRICULUM_ES, progress, lesson.id);
        const stars = lessonStars(progress, lesson.id);
        const isBoss = lesson.type === "boss";

        const circle = (
          <span
            className={`flex items-center justify-center rounded-full border-2 font-black shadow-[4px_4px_0_rgba(0,0,0,0.35)] transition ${
              isBoss ? "h-16 w-16 text-2xl" : "h-14 w-14 text-lg"
            } ${
              isCurrent
                ? "border-brand-500 bg-brand-500 text-noche-950 ring-4 ring-brand-500/30"
                : isCompleted
                  ? "border-menta-400 bg-menta-400/20 text-menta-400"
                  : unlocked
                    ? "border-brand-100 bg-noche-900 text-ink-900"
                    : "border-ink-900/10 bg-noche-900/60 text-ink-400 opacity-70"
            }`}
          >
            {isBoss ? "👑" : isCompleted ? "✓" : unlocked ? lesson.order : "🔒"}
          </span>
        );

        const label = (
          <span className="mt-1.5 block max-w-36 text-center text-xs font-semibold leading-tight">
            <span className={unlocked ? "text-ink-900" : "text-ink-400"}>
              {lesson.title}
            </span>
            {isCompleted && (
              <span className="mt-0.5 block" aria-label={`${stars} de 3 estrellas`}>
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
              <span className="mt-0.5 block rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-black uppercase text-noche-950">
                Continuar
              </span>
            )}
          </span>
        );

        return (
          <div key={lesson.id}>
            <p
              aria-hidden="true"
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-2xl opacity-70"
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
                className="flex flex-col items-center rounded-2xl p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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
      <main className="mx-auto max-w-2xl px-6 py-16 text-center text-ink-400">
        Cargando tu progreso…
      </main>
    );
  }

  const current = currentLessonId(CURRICULUM_ES, progress);
  const worlds = [...new Set(CURRICULUM_ES.map((lesson) => lesson.world))].sort(
    (a, b) => a - b,
  );

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Curso</h1>
        <Link
          href="/"
          className="rounded-full border-2 border-brand-100 bg-noche-900 px-4 py-1.5 text-sm font-bold text-brand-600 transition hover:border-brand-500"
        >
          ← Inicio
        </Link>
      </header>

      {worlds.map((world) => (
        <section key={world} aria-label={WORLD_TITLES[world] ?? `Mundo ${world}`}>
          <h2 className="mb-6 mt-10 rounded-2xl border-2 border-brand-100 bg-noche-900 px-5 py-3 text-center text-lg font-black shadow-[4px_4px_0_rgba(0,0,0,0.35)] first:mt-0">
            {WORLD_TITLES[world] ?? `Mundo ${world}`}
          </h2>
          <WorldPath
            lessons={CURRICULUM_ES.filter((lesson) => lesson.world === world)}
            progress={progress}
            current={current}
          />
        </section>
      ))}
    </main>
  );
}
