"use client";

import Link from "next/link";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import { currentLessonId } from "@/domain/progress/selectors";
import { recentAverages } from "@/domain/progress/recent";
import { practiceStreak } from "@/domain/gamification/gamification";
import { gameDifficulty } from "@/domain/games/wordPool";
import { formatAccuracy, formatPpm } from "@/domain/metrics/format";
import { useProgress } from "./providers";

// Sessions store completedAt in UTC, so the streak day must be UTC too.
function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
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
  const streak = practiceStreak(progress, utcDay());

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-12">
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl bg-brand-500 font-mono text-3xl font-black text-noche-950 shadow-[5px_5px_0_#7a2413]"
        >
          B
        </span>
        <div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
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
          <div className="rounded-2xl border border-brand-100 bg-noche-900 p-4">
            <p className="text-sm text-ink-600">Velocidad reciente</p>
            <p className="mt-1 text-2xl font-bold">
              {recent.ppm !== null ? `${formatPpm(recent.ppm)} PPM` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-noche-900 p-4">
            <p className="text-sm text-ink-600">Precisión reciente</p>
            <p className="mt-1 text-2xl font-bold">{formatAccuracy(recent.accuracy)}</p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-noche-900 p-4">
            <p className="text-sm text-ink-600">Racha</p>
            <p className="mt-1 text-2xl font-bold">
              {streak} {streak === 1 ? "día" : "días"}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-noche-900 p-4">
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
              className="rounded-2xl bg-brand-500 px-8 py-4 text-lg font-bold text-noche-950 shadow-[5px_5px_0_#7a2413] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-brand-600 hover:shadow-[3px_3px_0_#7a2413] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
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

      <section aria-label="Juegos y modo texto" className="mt-2">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-ink-400">
          Juegos y práctica libre — dificultad: Mundo{" "}
          {gameDifficulty(CURRICULUM_ES, progress).world}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/juegos/naves"
            className="group rounded-3xl border-2 border-brand-100 bg-[radial-gradient(circle_at_20%_10%,rgba(120,80,255,0.3),transparent_50%)] bg-noche-900 p-6 shadow-[5px_5px_0_rgba(0,0,0,0.35)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:border-brand-500 hover:shadow-[3px_3px_0_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <p className="text-4xl transition group-hover:-translate-y-1">🚀</p>
            <p className="mt-2 text-lg font-black">Invasión Tecleante</p>
            <p className="text-sm text-ink-600">
              Derriba naves espaciales escribiendo sus palabras antes de que aterricen.
            </p>
          </Link>
          <Link
            href="/juegos/magia"
            className="group rounded-3xl border-2 border-brand-100 bg-[radial-gradient(circle_at_75%_20%,rgba(255,105,180,0.3),transparent_50%)] bg-noche-900 p-6 shadow-[5px_5px_0_rgba(0,0,0,0.35)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:border-sol-400 hover:shadow-[3px_3px_0_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <p className="text-4xl transition group-hover:-translate-y-1">🧚</p>
            <p className="mt-2 text-lg font-black">Lluvia de Estrellas</p>
            <p className="text-sm text-ink-600">
              Atrapa estrellas fugaces con tu varita escribiendo su palabra mágica.
            </p>
          </Link>
          <Link
            href="/texto"
            className="group rounded-3xl border-2 border-brand-100 bg-[radial-gradient(circle_at_50%_15%,rgba(46,230,168,0.22),transparent_50%)] bg-noche-900 p-6 shadow-[5px_5px_0_rgba(0,0,0,0.35)] transition hover:translate-x-0.5 hover:translate-y-0.5 hover:border-menta-400 hover:shadow-[3px_3px_0_rgba(0,0,0,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <p className="text-4xl transition group-hover:-translate-y-1">📜</p>
            <p className="mt-2 text-lg font-black">Modo texto</p>
            <p className="text-sm text-ink-600">
              Textos reales al azar, escritura libre y tu ranking de mejores marcas.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
