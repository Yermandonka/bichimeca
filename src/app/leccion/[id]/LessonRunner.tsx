"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson } from "@/domain/curriculum/types";
import { CURRICULUM_ES } from "@/data/curriculum/es";
import {
  createSession,
  handleBackspace,
  handleInput,
  summarize,
  type KeyStats,
  type Session,
  type SessionSummary,
} from "@/domain/engine/session";
import {
  formatAccuracy,
  formatDuration,
  formatPpm,
} from "@/domain/metrics/format";
import { appendSession } from "@/domain/progress/progress";
import { mergeSessionKeyStats } from "@/domain/progress/keyStats";
import { useProgress } from "@/app/providers";

interface CompletedExercise {
  summary: SessionSummary;
  keyStats: ReadonlyMap<string, KeyStats>;
}

function combineKeyStats(
  exercises: CompletedExercise[],
): Map<string, KeyStats> {
  const combined = new Map<string, KeyStats>();
  for (const exercise of exercises) {
    for (const [key, stats] of exercise.keyStats) {
      const previous = combined.get(key);
      combined.set(key, {
        attempts: (previous?.attempts ?? 0) + stats.attempts,
        correct: (previous?.correct ?? 0) + stats.correct,
        errors: (previous?.errors ?? 0) + stats.errors,
        latenciesMs: [...(previous?.latenciesMs ?? []), ...stats.latenciesMs],
      });
    }
  }
  return combined;
}

function combineSummaries(exercises: CompletedExercise[]) {
  const totals = exercises.reduce(
    (acc, { summary }) => ({
      durationMs: acc.durationMs + summary.durationMs,
      totalKeystrokes: acc.totalKeystrokes + summary.totalKeystrokes,
      correctKeystrokes: acc.correctKeystrokes + summary.correctKeystrokes,
      errors: acc.errors + summary.errors,
    }),
    { durationMs: 0, totalKeystrokes: 0, correctKeystrokes: 0, errors: 0 },
  );

  const accuracy =
    totals.totalKeystrokes > 0
      ? totals.correctKeystrokes / totals.totalKeystrokes
      : null;
  const minutes = totals.durationMs / 60_000;
  const ppm = minutes > 0 ? totals.correctKeystrokes / 5 / minutes : 0;
  const rawPpm = minutes > 0 ? totals.totalKeystrokes / 5 / minutes : 0;

  // Duration-weighted blend of the per-exercise rhythm scores.
  const withConsistency = exercises.filter(
    ({ summary }) => summary.consistency !== null && summary.durationMs > 0,
  );
  const weightTotal = withConsistency.reduce(
    (acc, { summary }) => acc + summary.durationMs,
    0,
  );
  const consistency =
    weightTotal > 0
      ? withConsistency.reduce(
          (acc, { summary }) =>
            acc + summary.consistency! * (summary.durationMs / weightTotal),
          0,
        )
      : null;

  return { ...totals, accuracy, ppm, rawPpm, consistency };
}

export function LessonRunner({ lesson }: { lesson: Lesson }) {
  const { progress, updateProgress } = useProgress();
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [session, setSession] = useState<Session>(() =>
    createSession({ text: lesson.exercises[0].text, mode: "learning" }),
  );
  const [completed, setCompleted] = useState<CompletedExercise[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const savedRef = useRef(false);

  const isLessonDone = completed.length === lesson.exercises.length;

  const nextLesson = useMemo(() => {
    const ordered = [...CURRICULUM_ES].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((candidate) => candidate.id === lesson.id);
    return index >= 0 ? (ordered[index + 1] ?? null) : null;
  }, [lesson.id]);

  const feedChar = useCallback((char: string) => {
    setSession((current) => {
      const next = handleInput(current, { char, timeMs: performance.now() });
      return next;
    });
  }, []);

  // When the current exercise completes, archive it and start the next one.
  useEffect(() => {
    if (!session.isComplete || session.totalKeystrokes === 0) return;
    setCompleted((done) => [
      ...done,
      { summary: summarize(session), keyStats: session.keyStats },
    ]);
    const nextIndex = exerciseIndex + 1;
    if (nextIndex < lesson.exercises.length) {
      setExerciseIndex(nextIndex);
      setSession(
        createSession({
          text: lesson.exercises[nextIndex].text,
          mode: "learning",
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- driven only by completion
  }, [session.isComplete]);

  // Persist the lesson result exactly once.
  useEffect(() => {
    if (!isLessonDone || savedRef.current || progress === null) return;
    savedRef.current = true;
    const totals = combineSummaries(completed);
    const nowIso = new Date().toISOString();
    updateProgress((current) =>
      appendSession(
        {
          ...current,
          keyStats: mergeSessionKeyStats(
            current.keyStats,
            combineKeyStats(completed),
            nowIso,
          ),
        },
        {
          id: crypto.randomUUID(),
          completedAt: nowIso,
          lessonId: lesson.id,
          exerciseType: lesson.type,
          durationMs: Math.round(totals.durationMs),
          totalKeystrokes: totals.totalKeystrokes,
          correctKeystrokes: totals.correctKeystrokes,
          errors: totals.errors,
          accuracy: totals.accuracy,
          ppm: totals.ppm,
          rawPpm: totals.rawPpm,
          consistency: totals.consistency,
          xp: lesson.xp,
        },
      ),
    );
  }, [isLessonDone, completed, progress, lesson, updateProgress]);

  const restart = useCallback(() => {
    savedRef.current = false;
    setCompleted([]);
    setExerciseIndex(0);
    setSession(createSession({ text: lesson.exercises[0].text, mode: "learning" }));
    inputRef.current?.focus();
  }, [lesson]);

  if (isLessonDone) {
    const totals = combineSummaries(completed);
    return (
      <section
        role="status"
        className="mx-auto mt-8 max-w-xl rounded-3xl border border-brand-100 bg-white p-8 text-center shadow-lg"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Lección completada
        </p>
        <h2 className="mt-1 text-2xl font-bold">{lesson.title}</h2>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-left">
          <div className="rounded-2xl bg-brand-50 p-4">
            <dt className="text-sm text-ink-600">Velocidad</dt>
            <dd className="text-2xl font-bold">
              {formatPpm(totals.ppm)} <span className="text-base font-medium">PPM</span>
            </dd>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4">
            <dt className="text-sm text-ink-600">Precisión</dt>
            <dd className="text-2xl font-bold">{formatAccuracy(totals.accuracy)}</dd>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4">
            <dt className="text-sm text-ink-600">Errores</dt>
            <dd className="text-2xl font-bold">{totals.errors}</dd>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4">
            <dt className="text-sm text-ink-600">Tiempo</dt>
            <dd className="text-2xl font-bold">{formatDuration(totals.durationMs)}</dd>
          </div>
        </dl>
        <p className="mt-6 text-lg font-semibold text-brand-600">+{lesson.xp} XP</p>
        <div className="mt-8 flex flex-col items-center gap-3">
          {nextLesson ? (
            <Link
              href={`/leccion/${nextLesson.id}`}
              className="w-full rounded-full bg-brand-500 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-brand-600"
            >
              Siguiente
            </Link>
          ) : (
            <Link
              href="/curso"
              className="w-full rounded-full bg-brand-500 px-8 py-3 text-lg font-semibold text-white shadow-md transition hover:bg-brand-600"
            >
              Volver al curso
            </Link>
          )}
          <button
            type="button"
            onClick={restart}
            className="w-full rounded-full border border-brand-100 px-8 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Repetir
          </button>
        </div>
      </section>
    );
  }

  const text = lesson.exercises[exerciseIndex].text;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between text-sm text-ink-600">
        <span>
          Ejercicio {exerciseIndex + 1} de {lesson.exercises.length}
        </span>
        <span aria-hidden="true" className="flex gap-1.5">
          {lesson.exercises.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-6 rounded-full ${
                index < exerciseIndex
                  ? "bg-brand-500"
                  : index === exerciseIndex
                    ? "bg-brand-100 ring-1 ring-brand-500"
                    : "bg-ink-900/10"
              }`}
            />
          ))}
        </span>
      </div>

      {/* Clicking the text refocuses the hidden input that captures typing. */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="cursor-text rounded-3xl border border-brand-100 bg-white p-8 shadow-md"
      >
        <p
          aria-label={`Texto a escribir: ${text}`}
          className="select-none font-mono text-3xl leading-relaxed tracking-wider"
        >
          {[...text].map((char, index) => {
            const isPast = index < session.position;
            const isCurrent = index === session.position;
            const errored = isCurrent && session.currentPositionErrored;
            return (
              <span
                key={index}
                className={
                  errored
                    ? "rounded bg-red-100 text-red-700 underline decoration-2 underline-offset-4"
                    : isCurrent
                      ? "rounded bg-brand-100 text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4"
                      : isPast
                        ? "text-brand-600"
                        : "text-ink-400"
                }
              >
                {char === " " ? " " : char}
              </span>
            );
          })}
        </p>
        <input
          ref={inputRef}
          autoFocus
          aria-label="Zona de escritura"
          className="absolute h-0 w-0 opacity-0"
          value=""
          onChange={() => undefined}
          onBeforeInput={(event) => {
            const native = event.nativeEvent as InputEvent;
            event.preventDefault();
            if (native.data) {
              for (const char of native.data) feedChar(char);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              setSession((current) =>
                handleBackspace(current, { timeMs: performance.now() }),
              );
            }
          }}
        />
      </div>

      <p className="mt-4 text-center text-sm text-ink-400">
        Escribe el texto. Los errores no avanzan: pulsa la tecla correcta para
        continuar.
      </p>
    </section>
  );
}
