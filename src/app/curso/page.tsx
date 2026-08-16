"use client";

import Link from "next/link";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import {
  completedLessonIds,
  currentLessonId,
  isLessonUnlocked,
} from "@/domain/progress/selectors";
import { useProgress } from "../providers";

const LESSON_TYPE_LABELS: Record<string, string> = {
  learn: "Nuevas teclas",
  "guided-drill": "Ritmo",
  "combo-drill": "Combinaciones",
  words: "Palabras",
  sentences: "Frases",
  accuracy: "Precisión",
  rhythm: "Ritmo",
  speed: "Velocidad",
  "weak-keys": "Teclas débiles",
  review: "Repaso",
  boss: "Prueba de dominio",
};

export default function CursoPage() {
  const { progress } = useProgress();

  if (progress === null) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center text-ink-400">
        Cargando tu progreso…
      </main>
    );
  }

  const completed = completedLessonIds(progress);
  const current = currentLessonId(CURRICULUM_ES, progress);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-8">
        <Link href="/" className="text-sm font-medium text-brand-600 hover:underline">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Curso</h1>
        <p className="mt-1 text-ink-600">
          Mundo 1 — Fila guía
        </p>
      </header>

      <ol className="relative flex flex-col gap-3">
        {CURRICULUM_ES.map((lesson) => {
          const isCompleted = completed.has(lesson.id);
          const isCurrent = lesson.id === current;
          const unlocked = isLessonUnlocked(CURRICULUM_ES, progress, lesson.id);

          const stateStyles = isCurrent
            ? "border-brand-500 bg-white shadow-md ring-2 ring-brand-500/30"
            : isCompleted
              ? "border-brand-100 bg-brand-100/60"
              : unlocked
                ? "border-brand-100 bg-white"
                : "border-transparent bg-ink-900/5 opacity-60";

          const content = (
            <div
              className={`flex items-center gap-4 rounded-2xl border p-4 transition ${stateStyles}`}
            >
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isCompleted
                    ? "bg-brand-500 text-white"
                    : isCurrent
                      ? "bg-brand-100 text-brand-700"
                      : "bg-ink-900/10 text-ink-600"
                }`}
              >
                {isCompleted ? "✓" : lesson.order}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink-900">{lesson.title}</p>
                <p className="text-sm text-ink-600">
                  {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type}
                  {lesson.introducedKeys.length > 0 &&
                    ` · ${lesson.introducedKeys
                      .map((key) => key.toUpperCase())
                      .join(" y ")}`}
                </p>
              </div>
              {isCurrent && (
                <span className="ml-auto rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                  Continuar
                </span>
              )}
              {!unlocked && (
                <span className="ml-auto text-sm text-ink-400" aria-label="Bloqueada">
                  🔒
                </span>
              )}
            </div>
          );

          return (
            <li key={lesson.id}>
              {unlocked ? (
                <Link
                  href={`/leccion/${lesson.id}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  {content}
                </Link>
              ) : (
                <div aria-disabled="true">{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
