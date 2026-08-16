"use client";

import Link from "next/link";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import { currentLessonId } from "@/domain/progress/selectors";
import { recentAverages } from "@/domain/progress/recent";
import { practiceStreak } from "@/domain/gamification/gamification";
import { formatAccuracy, formatPpm } from "@/domain/metrics/format";
import { useProgress } from "./providers";

function localDay(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export default function Home() {
  const { progress } = useProgress();

  if (progress === null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 text-ink-400">
        Cargando…
      </main>
    );
  }

  const hasHistory = progress.sessions.length > 0;
  const current = currentLessonId(CURRICULUM_ES, progress);
  const currentLesson = CURRICULUM_ES.find((lesson) => lesson.id === current);
  const recent = recentAverages(progress);
  const streak = practiceStreak(progress, localDay());

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-bold text-white shadow-lg"
        >
          B
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Hola, {progress.profile.name}
          </h1>
          <p className="text-ink-600">
            {hasHistory
              ? "Sigamos donde lo dejaste."
              : "Aprende a escribir sin mirar el teclado, con precisión y a tu ritmo."}
          </p>
        </div>
      </header>

      {hasHistory && (
        <section aria-label="Tu resumen" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-sm text-ink-600">Velocidad reciente</p>
            <p className="mt-1 text-2xl font-bold">
              {recent.ppm !== null ? `${formatPpm(recent.ppm)} PPM` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-sm text-ink-600">Precisión reciente</p>
            <p className="mt-1 text-2xl font-bold">{formatAccuracy(recent.accuracy)}</p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-sm text-ink-600">Racha</p>
            <p className="mt-1 text-2xl font-bold">
              {streak} {streak === 1 ? "día" : "días"}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-white p-4">
            <p className="text-sm text-ink-600">XP total</p>
            <p className="mt-1 text-2xl font-bold">{progress.totalXp}</p>
          </div>
        </section>
      )}

      <section className="flex flex-col items-start gap-3">
        {currentLesson ? (
          <>
            <p className="text-sm font-medium uppercase tracking-wide text-ink-400">
              {hasHistory ? "Siguiente lección" : "Empieza aquí"}
            </p>
            <Link
              href={`/leccion/${currentLesson.id}`}
              className="rounded-full bg-brand-500 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {hasHistory ? "Continuar" : "Empezar"}: {currentLesson.title}
            </Link>
          </>
        ) : (
          <p className="text-lg text-ink-600">
            Has completado todas las lecciones disponibles. ¡Enhorabuena!
          </p>
        )}
        <Link
          href="/curso"
          className="mt-1 font-medium text-brand-600 hover:underline"
        >
          Ver el curso completo
        </Link>
      </section>
    </main>
  );
}
